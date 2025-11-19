// utils/alarms.ts
import * as Notifications from 'expo-notifications';

type MeetingRow = {
    id: string;
    title: string;
    meeting_date: string;       // 'YYYY-MM-DD'
    meeting_time?: string | null; // '9:00 AM'
    status: 'upcoming' | 'scheduled' | 'active' | 'completed' | 'cancelled';
};

type TaskRow = {
    id: string;
    title?: string | null;
    task_date?: string | null;   // 'YYYY-MM-DD'
    due_date?: string | null;    // 'YYYY-MM-DD'
    time?: string | null;        // '9:00 AM'
    status?: string | null;      // 'pending' | 'completed' | 'upcoming' | ...
};

type TourPlan = {
    id: string;
    title: string;
    start_date: string;          // 'YYYY-MM-DD'
    start_time?: string | null;  // '9:00 AM'
    status: 'planned' | 'confirmed' | 'cancelled' | 'completed';
};

const REMINDER_OFFSET_MINUTES = 15; // notify 15 minutes BEFORE

// ---- helpers ----
function getTodayYMD(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function parse12hToDate(ymd: string, hhmmAmPm?: string | null): Date | null {
    if (!ymd) return null;
    const [Y, M, D] = ymd.split('-').map(Number);
    if (!Y || !M || !D) return null;

    let h = 9, m = 0; // default 09:00 if no time provided
    if (hhmmAmPm && /\d/.test(hhmmAmPm)) {
        const match = hhmmAmPm.trim().match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)?$/i);
        if (match) {
            const hour = Number(match[1]);
            const minute = Number(match[2] ?? 0);
            const ampm = match[3]?.toUpperCase();
            h = hour % 12 + (ampm === 'PM' ? 12 : 0);
            m = minute;
        }
    }
    return new Date(Y, M - 1, D, h, m, 0, 0);
}

function minutesUntil(d: Date) {
    return (d.getTime() - Date.now()) / 60000;
}

// ---- MAIN ----
export async function scheduleUpcomingAlarms(opts: {
    meetings?: MeetingRow[];
    tasks?: TaskRow[];
    tours?: TourPlan[];
}) {
    const todayYMD = getTodayYMD();
    const now = new Date();

    // Clear all old schedules; we will re-create ONLY today's ones
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Helper to schedule one reminder
    const scheduleReminder = async (
        title: string,
        body: string,
        startAt: Date
    ) => {
        // 15 minutes BEFORE start
        const reminderAt = new Date(startAt.getTime() - REMINDER_OFFSET_MINUTES * 60_000);
        if (reminderAt <= now) return; // reminder time already passed

        const diffMins = minutesUntil(reminderAt);
        console.log('Scheduling notification at', reminderAt.toISOString(), 'in', diffMins, 'minutes');

        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound: 'default',
                priority: Notifications.AndroidNotificationPriority.MAX,
            },
            trigger: {
                date: reminderAt,
                channelId: 'alarms',
            },
        });
    };

    // ---- MEETINGS: only today's, and only active-like statuses ----
    (opts.meetings || []).forEach(async (m) => {
        const allowed: MeetingRow['status'][] = ['upcoming', 'scheduled', 'active'];
        if (!allowed.includes(m.status)) return;
        if (m.meeting_date !== todayYMD) return; // ❗ only today

        const startAt = parse12hToDate(m.meeting_date, m.meeting_time);
        if (!startAt) return;

        await scheduleReminder(`🗓️ ${m.title}`, 'Meeting starts soon.', startAt);
    });

    // ---- TOURS: only today's start date, planned/confirmed ----
    (opts.tours || []).forEach(async (t) => {
        if (t.status === 'cancelled' || t.status === 'completed') return;
        if (t.start_date !== todayYMD) return; // ❗ only today

        const startAt = parse12hToDate(t.start_date, t.start_time);
        if (!startAt) return;

        await scheduleReminder(`📍 ${t.title}`, 'Tour starts soon.', startAt);
    });

    // ---- TASKS: only today's date, and pending/upcoming ----
    (opts.tasks || []).forEach(async (t) => {
        const status = (t.status || '').toLowerCase();
        if (['completed', 'done', 'cancelled'].includes(status)) return;

        const dateStr = t.task_date || t.due_date;
        if (!dateStr || dateStr !== todayYMD) return; // ❗ only today

        const startAt = parse12hToDate(dateStr, (t as any).time || null);
        if (!startAt) return;

        const label = t.title || 'Task';
        await scheduleReminder(`✅ ${label}`, 'Task is due soon.', startAt);
    });
}