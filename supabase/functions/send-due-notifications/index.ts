// supabase/functions/send-due-notifications/index.ts

import { createClient } from 'npm:@supabase/supabase-js@2';

// ----- Env vars from Supabase Edge Function Secrets -----
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
}

const supabase = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

const BATCH_SIZE = 200;

type EventType = 'meeting' | 'task' | 'tour' | 'test';
type NotifType = 'morning' | 'before_start' | 'reminder' | 'test';

interface ScheduledRow {
  id: string;
  event_type: EventType;
  event_id: string;
  user_id: string;
  notif_type: NotifType;
  scheduled_at: string;
  sent: boolean;
  payload: any;
}

// ---------- Helpers ----------

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Get all due notifications (sent = false, scheduled_at <= now)
async function fetchDue(): Promise<ScheduledRow[]> {
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from('scheduled_notifications')
    .select('*')
    .eq('sent', false)
    .lte('scheduled_at', nowIso)
    .order('scheduled_at', { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    console.error('fetchDue error', error);
    throw error;
  }

  console.log('fetchDue got', data?.length ?? 0, 'rows');
  return (data ?? []) as ScheduledRow[];
}

// Get all valid Expo tokens for a user
async function getUserTokens(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('push_tokens')
    .select('expo_push_token, revoked')
    .eq('user_id', userId); // no revoked filter here so we can see everything

  if (error) {
    console.error('getUserTokens error', error);
    throw error;
  }

  console.log('Raw push_tokens rows for user', userId, data);

  // Treat `revoked = false` or `revoked IS NULL` as active
  const tokens =
    data
      ?.filter((row: any) => row.revoked === false || row.revoked == null)
      .map((row: any) => row.expo_push_token as string) ?? [];

  console.log('Tokens for user', userId, ':', tokens);
  return tokens;
}

// Mark notifications as sent
async function markAsSent(ids: string[]) {
  if (!ids.length) return;

  const { error } = await supabase
    .from('scheduled_notifications')
    .update({ sent: true, sent_at: new Date().toISOString() })
    .in('id', ids);

  if (error) {
    console.error('markAsSent error', error);
    throw error;
  }
}

// ---------- Main handler ----------

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    const rows = await fetchDue();
    if (!rows.length) {
      console.log('No due notifications');
      return json({ ok: true, processed: 0, message: 'No due notifications' });
    }

    const messages: any[] = [];
    const idsToMark: string[] = [];

    for (const row of rows) {
      const tokens = await getUserTokens(row.user_id);
      if (!tokens.length) {
        console.log('No tokens for user', row.user_id);
        continue;
      }

      const payload = row.payload ?? {};
      const title =
        typeof payload.title === 'string' ? payload.title : 'Upcoming event';
      const body =
        typeof payload.body === 'string'
          ? payload.body
          : 'You have an upcoming event.';

      for (const token of tokens) {
        messages.push({
          to: token,
          sound: 'default',
          title,
          body,
          data: {
            ...payload,
            event_type: row.event_type,
            event_id: row.event_id,
            notif_type: row.notif_type,
          },
        });
      }

      idsToMark.push(row.id);
    }

    console.log('Prepared', messages.length, 'push messages');

    if (messages.length) {
      const expoRes = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messages),
      });

      const expoBody = await expoRes.json();
      console.log('Expo response status:', expoRes.status);
      console.log('Expo response body:', JSON.stringify(expoBody));

      if (!expoRes.ok) {
        throw new Error('Expo push failed');
      }
    }

    if (idsToMark.length) {
      await markAsSent(idsToMark);
    }

    return json({
      ok: true,
      processed_rows: rows.length,
      sent_messages: messages.length,
      updated_ids: idsToMark,
    });
  } catch (err: any) {
    console.error('send-due-notifications error', err);
    return json(
      {
        ok: false,
        error: err?.message ?? String(err),
      },
      500,
    );
  }
});