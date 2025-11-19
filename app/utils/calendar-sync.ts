// // utils/calendar-sync.ts
// import * as Calendar from 'expo-calendar';
// import { Alert, Platform } from 'react-native';
// import { supabase } from '../config';

// // Local helper to parse a date string (YYYY-MM-DD) and a 12-hour time string (e.g. "9:30 AM") into a Date.
// // Returns null if inputs are invalid.
// function parse12hToDate(dateStr: string, time12h?: string | null): Date | null {
//     if (!dateStr || !time12h) return null;

//     const dateParts = dateStr.split('-').map((p) => Number(p));
//     if (dateParts.length !== 3 || dateParts.some((n) => Number.isNaN(n))) return null;
//     const [year, month, day] = dateParts;

//     const timeMatch = time12h.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
//     if (!timeMatch) return null;

//     let hour = parseInt(timeMatch[1], 10);
//     const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
//     const ampm = timeMatch[3].toUpperCase();

//     if (ampm === 'PM' && hour !== 12) hour += 12;
//     if (ampm === 'AM' && hour === 12) hour = 0;

//     return new Date(year, month - 1, day, hour, minute);
// }

// // 1. Permissions
// export async function ensureCalendarPermission(): Promise<boolean> {
//     const existing = await Calendar.getCalendarPermissionsAsync();
//     if (existing.status === 'granted') return true;

//     const requested = await Calendar.requestCalendarPermissionsAsync();
//     return requested.status === 'granted';
// }

// // 2. Pick a default/writable calendar (often the Google one)
// async function getDefaultCalendarId(): Promise<string | null> {
//     const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

//     // Prefer a writable, non-readonly calendar that looks like a personal/Google calendar
//     const writable =
//         calendars.find(
//             (c) =>
//                 c.allowsModifications &&
//                 (c.source?.type === Calendar.SourceType.LOCAL ||
//                     c.source?.type === Calendar.SourceType.CALDAV)
//         ) ||
//         calendars.find((c) => c.allowsModifications) ||
//         calendars[0];

//     return writable?.id ?? null;
// }

// // 3. Example: sync upcoming meetings from Supabase into device calendar
// export async function syncMeetingsToDeviceCalendar(userId: string) {
//     const hasPerm = await ensureCalendarPermission();
//     if (!hasPerm) {
//         Alert.alert(
//             'Permission required',
//             'Please allow calendar access to sync your meetings to Google Calendar.'
//         );
//         return;
//     }

//     const calendarId = await getDefaultCalendarId();
//     if (!calendarId) {
//         Alert.alert(
//             'No calendar found',
//             'We could not find a writable calendar on this device.'
//         );
//         return;
//     }

//     // Fetch upcoming meetings for this user (adjust table/filters as per your schema)
//     const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

//     const { data: meetings, error } = await supabase
//         .from('meetings')
//         .select('id, title, meeting_date, meeting_time')
//         .eq('user_id', userId)
//         .gte('meeting_date', today)
//         .order('meeting_date', { ascending: true });

//     if (error) {
//         console.error('Error loading meetings for calendar sync', error);
//         Alert.alert('Calendar Sync', 'Failed to load meetings from the server.');
//         return;
//     }

//     if (!meetings || meetings.length === 0) {
//         Alert.alert('Calendar Sync', 'No upcoming meetings to sync.');
//         return;
//     }

//     for (const m of meetings) {
//         const startDate = parse12hToDate(m.meeting_date, m.meeting_time);
//         if (!startDate) continue;

//         // simple 1-hour default duration; adjust as needed
//         const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

//         try {
//             await Calendar.createEventAsync(calendarId, {
//                 title: m.title || 'Meeting',
//                 startDate,
//                 endDate,
//                 timeZone: Platform.OS === 'ios' ? undefined : 'Asia/Kolkata',
//                 notes: 'Synced from Minister Scheduling App',
//             });
//         } catch (e) {
//             console.error('Error creating calendar event for meeting', m.id, e);
//         }
//     }

//     Alert.alert('Calendar Sync', 'Upcoming meetings have been synced to your calendar.');
// }