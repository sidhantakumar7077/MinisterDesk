import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  Calendar as CalendarIcon,
  ChevronLeft, ChevronRight,
  Clock,
  Flag,
  MapPin
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { supabase } from '../config';

/* ----------------------------- Types & Colors ----------------------------- */

type CalBase = {
  id: string;
  title: string;
  time?: string | null;
  category?: string | null;
  subtitle?: string | null;
  status?: string | null; // for meetings/tours
};

type CalItem = CalBase & { type: 'meeting' | 'tour' | 'task' };

const TYPE_COLOR: Record<CalItem['type'], string> = {
  meeting: '#1e40af',
  tour: '#059669',
  task: '#dc2626',
};

const CATEGORY_COLOR: Record<string, string> = {
  'Works Department': '#1e40af',
  'Law Department': '#7c3aed',
  'Joint Meeting': '#059669',
  'District Visit': '#ea580c',
  'Administrative': '#dc2626',
  'Legislative': '#0891b2',
  'Official Visit': '#2563eb',
  'Inspection Tour': '#7c3aed',
  'Public Event': '#f59e0b',
};

const months = [
  'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December',
];
const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ymd = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const addDays = (d: Date, n: number) => { const copy = new Date(d); copy.setDate(copy.getDate() + n); return copy; };
const clampMonthRange = (d: Date) => ({ from: ymd(startOfMonth(d)), to: ymd(endOfMonth(d)) });

/* -------------------------------- Screen -------------------------------- */

export default function CalendarScreen() {
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [cursor, setCursor] = useState<Date>(new Date());       // which month we're viewing
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');

  // YYYY-MM-DD -> CalItem[]
  const [byDate, setByDate] = useState<Record<string, CalItem[]>>({});

  /* ----------------------------- Month / Week Grids ----------------------------- */

  const monthDays = useMemo(() => {
    const first = startOfMonth(cursor);
    const last = endOfMonth(cursor);
    const pad = first.getDay();
    const cells: { label: string; inMonth: boolean; date?: Date }[] = [];
    for (let i = 0; i < pad; i++) cells.push({ label: '', inMonth: false });
    for (let d = 1; d <= last.getDate(); d++) {
      cells.push({ label: String(d), inMonth: true, date: new Date(cursor.getFullYear(), cursor.getMonth(), d) });
    }
    while (cells.length % 7 !== 0) cells.push({ label: '', inMonth: false });
    return cells;
  }, [cursor]);

  const weekDays = useMemo(() => {
    const base = new Date(selectedDate);
    const day = base.getDay();
    const start = addDays(base, -day);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDate]);

  /* ----------------------------- Fetch & Map ----------------------------- */

  async function fetchAll() {
    try {
      setLoading(true);
      setErrorText('');
      const { from, to } = clampMonthRange(cursor);

      // fetch meetings in month
      const MEETINGS_COLUMNS = 'id,title,meeting_date,meeting_time,category,status,location';
      const { data: meetings, error: mErr } = await supabase
        .from('meetings')
        .select(MEETINGS_COLUMNS)
        .gte('meeting_date', from)
        .lte('meeting_date', to);
      if (mErr) throw mErr;

      // fetch tasks in month
      const TASKS_COLUMNS = 'id,title,due_date,priority,assigned_to';
      const { data: tasks, error: tErr } = await supabase
        .from('tasks')
        .select(TASKS_COLUMNS)
        .gte('due_date', from)
        .lte('due_date', to);
      if (tErr) throw tErr;

      // fetch tours that START in this month (NOT spanning)
      const TOURS_COLUMNS = 'id,title,start_date,end_date,travel_mode,category,destination,status,estimated_budget';
      const { data: tours, error: tourErr } = await supabase
        .from('tour_plans')
        .select(TOURS_COLUMNS)
        .gte('start_date', from)
        .lte('start_date', to);
      if (tourErr) throw tourErr;

      // Build map with a per-day de-dupe set
      const map: Record<string, CalItem[]> = {};
      const seen = new Set<string>(); // key = `${date}|${type}|${id}`

      const add = (dateKey: string, item: CalItem) => {
        const k = `${dateKey}|${item.type}|${item.id}`;
        if (seen.has(k)) return;     // prevent double data
        seen.add(k);
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(item);
      };

      (meetings || []).forEach((m: any) => {
        const key = m.meeting_date;
        add(key, {
          id: m.id,
          title: m.title,
          time: m.meeting_time,
          category: m.category,
          subtitle: m.location,
          status: m.status,       // status chip
          type: 'meeting',
        });
      });

      (tasks || []).forEach((task: any) => {
        const key = task.due_date;
        add(key, {
          id: task.id,
          title: task.title,
          time: null,
          category: task.priority || null,    // use priority as category chip
          subtitle: task.assigned_to ? `Assigned to ${task.assigned_to}` : 'Task',
          type: 'task',
        });
      });

      // TOURS by start date only
      (tours || []).forEach((tr: any) => {
        const key = tr.start_date;
        add(key, {
          id: tr.id,
          title: tr.title,
          time: null,
          category: tr.category || tr.travel_mode, // category chip
          subtitle: tr.destination ? `→ ${tr.destination}` : 'Tour Plan',
          status: tr.status,
          type: 'tour',
        });
      });

      setByDate(map);
    } catch (e: any) {
      setErrorText(e?.message ?? 'Failed to load calendar items.');
      Toast.show({ type: 'error', text1: 'Error', text2: e?.message ?? 'Failed to load calendar items.' });
    } finally {
      setLoading(false);
    }
  }

  // Initial + month changes
  useEffect(() => { fetchAll(); }, [cursor]);

  // Realtime → just refetch; dedupe keeps it clean
  useEffect(() => {
    const chMeet = supabase
      .channel('rt-meetings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings' }, fetchAll)
      .subscribe();
    const chTours = supabase
      .channel('rt-tours')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tour_plans' }, fetchAll)
      .subscribe();
    const chTasks = supabase
      .channel('rt-tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchAll)
      .subscribe();

    return () => {
      supabase.removeChannel(chMeet);
      supabase.removeChannel(chTours);
      supabase.removeChannel(chTasks);
    };
  }, []);

  /* ----------------------------- UI helpers ----------------------------- */

  const itemsForDate = (d: Date) => byDate[ymd(d)] || [];
  const itemsForSelected = itemsForDate(selectedDate);
  const dotCountForDay = (d?: Date) => (d ? itemsForDate(d).length : 0);

  /* ----------------------------- Renderers ----------------------------- */

  const MonthView = () => (
    <View style={styles.monthCard}>
      <View style={styles.weekHeader}>
        {daysOfWeek.map((dow) => (
          <Text key={dow} style={styles.weekHeadText}>{dow}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {monthDays.map((cell, idx) => {
          const isToday = cell.date && cell.date.toDateString() === new Date().toDateString();
          const isSelected = cell.date && selectedDate.toDateString() === cell.date.toDateString();
          const cnt = cell.date ? dotCountForDay(cell.date) : 0;

          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.dayCell,
                !cell.inMonth && { opacity: 0.35 },
                isSelected && styles.daySelected,
                isToday && !isSelected && styles.dayToday,
              ]}
              disabled={!cell.inMonth}
              onPress={() => cell.date && setSelectedDate(cell.date)}
            >
              <Text
                style={[
                  styles.dayNum,
                  isSelected && { color: '#fff' },
                  isToday && !isSelected && { color: '#fff' },
                ]}
              >
                {cell.label}
              </Text>

              {/* three dots max (typed colors), +N overflow */}
              {cnt > 0 && (
                <View style={styles.dotRow}>
                  {itemsForDate(cell.date!).slice(0, 3).map((it, i) => (
                    <View key={i} style={[styles.dot, { backgroundColor: TYPE_COLOR[it.type] }]} />
                  ))}
                  {cnt > 3 && <Text style={styles.dotMore}>+{cnt - 3}</Text>}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const WeekView = () => (
    <View style={styles.weekCard}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 6 }}>
        {weekDays.map((d) => {
          const isToday = d.toDateString() === new Date().toDateString();
          const isSelected = selectedDate.toDateString() === d.toDateString();
          const items = itemsForDate(d);

          return (
            <TouchableOpacity
              key={d.toISOString()}
              style={[
                styles.weekCol,
                isSelected && { backgroundColor: '#1e40af' },
                isToday && !isSelected && { backgroundColor: '#f59e0b' },
              ]}
              onPress={() => setSelectedDate(d)}
            >
              <Text style={[styles.weekColDow, (isSelected || isToday) && { color: '#fff' }]}>{daysOfWeek[d.getDay()]}</Text>
              <Text style={[styles.weekColDate, (isSelected || isToday) && { color: '#fff' }]}>{d.getDate()}</Text>

              <View style={{ width: '100%', gap: 6, marginTop: 8 }}>
                {items.slice(0, 3).map((it) => (
                  <View key={it.type + it.id} style={[styles.miniPill, { backgroundColor: TYPE_COLOR[it.type] }]}>
                    <Text style={styles.miniPillText} numberOfLines={1}>{it.title}</Text>
                  </View>
                ))}
                {items.length > 3 && <Text style={[styles.moreText, (isSelected || isToday) && { color: '#fff' }]}>+{items.length - 3} more</Text>}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  /* -------------------------------- Render -------------------------------- */

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header + gradient */}
        <LinearGradient colors={['#eef2ff', '#ffffff']} start={{ x: 0, y: 0 }} end={{ x: 0.3, y: 1 }} style={styles.headerWrap}>
          <View style={styles.header}>
            <View>
              <Text style={styles.kicker}>Schedule</Text>
              <Text style={styles.title}>{months[cursor.getMonth()]} {cursor.getFullYear()}</Text>
            </View>
            <View style={styles.navRow}>
              <TouchableOpacity style={styles.navBtn} onPress={() => { const d = new Date(cursor); d.setMonth(d.getMonth() - 1); setCursor(d); }}>
                <ChevronLeft size={18} color="#1e40af" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.navBtn} onPress={() => { const d = new Date(cursor); d.setMonth(d.getMonth() + 1); setCursor(d); }}>
                <ChevronRight size={18} color="#1e40af" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Segment */}
          <View style={styles.toolbar}>
            <View style={styles.segment}>
              <TouchableOpacity style={[styles.segmentBtn, viewMode === 'month' && styles.segmentActive]} onPress={() => setViewMode('month')}>
                <Text style={[styles.segmentText, viewMode === 'month' && styles.segmentTextActive]}>Month</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.segmentBtn, viewMode === 'week' && styles.segmentActive]} onPress={() => setViewMode('week')}>
                <Text style={[styles.segmentText, viewMode === 'week' && styles.segmentTextActive]}>Week</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Calendar */}
        {viewMode === 'month' ? <MonthView /> : <WeekView />}

        {loading && (
          <View style={{ paddingVertical: 16 }}>
            <ActivityIndicator />
          </View>
        )}
        {!!errorText && <Text style={{ color: '#dc2626', marginHorizontal: 20, marginBottom: 10 }}>{errorText}</Text>}

        {/* Selected Day Summary */}
        <View style={styles.dayHeaderCard}>
          <CalendarIcon size={18} color="#1e40af" />
          <Text style={styles.dayHeaderText}>
            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </Text>
          <View style={styles.countPills}>
            <View style={[styles.countPill, { backgroundColor: TYPE_COLOR.meeting }]}><Text style={styles.countPillText}>{(itemsForSelected.filter(i => i.type === 'meeting')).length} M</Text></View>
            <View style={[styles.countPill, { backgroundColor: TYPE_COLOR.tour }]}><Text style={styles.countPillText}>{(itemsForSelected.filter(i => i.type === 'tour')).length} T</Text></View>
            <View style={[styles.countPill, { backgroundColor: TYPE_COLOR.task }]}><Text style={styles.countPillText}>{(itemsForSelected.filter(i => i.type === 'task')).length} TK</Text></View>
          </View>
        </View>

        {/* Items list */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 24 }}>
          {itemsForSelected.length > 0 ? (
            itemsForSelected.map((it) => {
              const catColor = it.category ? (CATEGORY_COLOR[it.category] || TYPE_COLOR[it.type]) : TYPE_COLOR[it.type];
              return (
                <TouchableOpacity
                  key={it.type + it.id}
                  style={[styles.card, { borderLeftColor: TYPE_COLOR[it.type] }]}
                  onPress={() => {
                    if (it.type === 'meeting') router.push('/meetings');
                    if (it.type === 'tour') router.push('/tour-plan');
                    if (it.type === 'task') router.push('/tasks');
                  }}
                >
                  <View style={[styles.typeBadge, { backgroundColor: TYPE_COLOR[it.type] }]}>
                    <Text style={styles.typeBadgeText}>{it.type.toUpperCase()}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{it.title}</Text>

                    <View style={styles.row}>
                      {it.time && (
                        <View style={styles.rowChip}>
                          <Clock size={14} color="#6b7280" />
                          <Text style={styles.rowText}>{it.time}</Text>
                        </View>
                      )}
                      {!!it.subtitle && (
                        <View style={styles.rowChip}>
                          <MapPin size={14} color="#6b7280" />
                          <Text style={styles.rowText} numberOfLines={1}>{it.subtitle}</Text>
                        </View>
                      )}
                      {!!it.status && (
                        <View style={[styles.rowChip, { borderColor: TYPE_COLOR[it.type], backgroundColor: '#fff' }]}>
                          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: TYPE_COLOR[it.type] }} />
                          <Text style={[styles.rowText, { color: TYPE_COLOR[it.type], fontWeight: '800' }]}>{String(it.status).toUpperCase()}</Text>
                        </View>
                      )}
                    </View>

                    {!!it.category && (
                      <View style={[styles.categoryTag, { backgroundColor: catColor }]}>
                        {/* priority flag appears for tasks */}
                        {it.type === 'task' && <Flag size={12} color="#fff" />}
                        <Text style={styles.categoryText}>{it.category}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No items for this date</Text>
              <Text style={styles.emptySub}>Meetings, tours (by start date), and tasks will appear here.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* -------------------------------- Styles -------------------------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  headerWrap: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eef2f7' },
  header: {
    paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  kicker: { fontSize: 12, fontWeight: '700', letterSpacing: 1, color: '#1e40af', marginBottom: 2, textTransform: 'uppercase' },
  title: { fontSize: 26, fontWeight: '800', color: '#0f172a' },

  toolbar: { paddingTop: 8, paddingBottom: 8 },
  segment: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4, gap: 6, alignSelf: 'flex-start' },
  segmentBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  segmentActive: { backgroundColor: '#1e40af' },
  segmentText: { fontSize: 13, fontWeight: '800', color: '#64748b' },
  segmentTextActive: { color: '#fff' },

  navRow: { flexDirection: 'row', gap: 8 },
  navBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' },

  monthCard: {
    backgroundColor: '#ffffff', borderRadius: 16, margin: 20, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6
  },
  weekHeader: { flexDirection: 'row', marginBottom: 8 },
  weekHeadText: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '800', color: '#94a3b8', letterSpacing: 0.3 },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center',
    marginVertical: 6, borderRadius: 12,
  },
  dayNum: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  daySelected: { backgroundColor: '#1e40af' },
  dayToday: { backgroundColor: '#f59e0b' },
  dotRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotMore: { fontSize: 10, fontWeight: '900', color: '#64748b' },

  weekCard: {
    backgroundColor: '#ffffff', borderRadius: 16, marginHorizontal: 20, marginTop: 16, marginBottom: 12,
    paddingVertical: 12, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6
  },
  weekCol: {
    width: 120, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 10,
    backgroundColor: '#f8fafc', alignItems: 'center',
  },
  weekColDow: { fontSize: 12, fontWeight: '800', color: '#64748b' },
  weekColDate: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginTop: 4 },

  miniPill: { borderRadius: 6, paddingVertical: 4, paddingHorizontal: 6 },
  miniPillText: { fontSize: 11, fontWeight: '900', color: '#fff' },
  moreText: { fontSize: 12, fontWeight: '700', color: '#64748b', textAlign: 'center' },

  dayHeaderCard: {
    marginHorizontal: 20, marginTop: 8, marginBottom: 12, backgroundColor: '#fff',
    padding: 14, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6
  },
  dayHeaderText: { fontSize: 15, fontWeight: '800', color: '#0f172a', flex: 1 },
  countPills: { flexDirection: 'row', gap: 6 },
  countPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  countPillText: { fontSize: 10, fontWeight: '900', color: '#fff', letterSpacing: 0.4 },

  card: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', gap: 12,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5,
    borderLeftWidth: 4, borderLeftColor: '#e2e8f0'
  },
  typeBadge: { height: 26, borderRadius: 8, paddingHorizontal: 8, alignSelf: 'flex-start', justifyContent: 'center' },
  typeBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 8 },
  rowChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#f8fafc', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, borderWidth: 1, borderColor: '#eef2f7'
  },
  rowText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  categoryTag: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, flexDirection: 'row', gap: 6 },
  categoryText: { color: '#fff', fontSize: 11, fontWeight: '900' },

  empty: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 28, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#475569', marginBottom: 6 },
  emptySub: { fontSize: 13, color: '#94a3b8', marginBottom: 14, textAlign: 'center' },
});