// app/(tabs)/home.tsx
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { BookOpen, Calendar, Car, Clock, FileText, Flag, MapPin, Plane, Train, User, Users } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  DeviceEventEmitter,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';
import { supabase } from '../config';
// ✅ reusable modals
import CreateTaskModal, { CreateTaskForm } from '../CreateTaskModal';
import CreateTourPlanModal, { TourPlanForm } from '../CreateTourPlanModal';
// For Notification
// import * as Notifications from 'expo-notifications';
// import { AppState } from 'react-native';
// import { ensureAndroidChannel } from '../notifications-setup';
// import { scheduleUpcomingAlarms } from '../utils/alarms';

/* -------------------- Types -------------------- */
type MeetingRow = {
  id: string;
  title: string;
  description?: string | null;
  meeting_date: string;          // YYYY-MM-DD
  meeting_time?: string | null;  // "9:00 AM"
  duration_minutes?: number | null;
  location?: string | null;
  status: 'upcoming' | 'scheduled' | 'active' | 'completed' | 'cancelled';
  category?: string | null;
  notes?: string | null;
  is_active: boolean;
  is_recording: boolean;
  started_at?: string | null;
  ended_at?: string | null;
};

type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  username?: string | null;
};

/* -------------------- Helpers -------------------- */
const meetingStatusColor: Record<MeetingRow['status'], string> = {
  upcoming: '#f59e0b',
  scheduled: '#2563eb',
  completed: '#10b981',
  active: '#ef4444',
  cancelled: '#6b7280',
};
const taskStatusColor: Record<'completed' | 'pending', string> = {
  completed: '#10b981',
  pending: '#f59e0b',
};
const tourStatusColor: Record<'planned' | 'confirmed' | 'cancelled' | 'completed', string> = {
  planned: '#2563eb',
  confirmed: '#0ea5e9',
  completed: '#10b981',
  cancelled: '#6b7280',
};

const getCategoryColor = (category?: string): string => {
  const colors: Record<string, string> = {
    'Works Department': '#1e40af',
    'Law Department': '#7c3aed',
    'Joint Meeting': '#059669',
    'Administrative': '#f59e0b',
    'Official Visit': '#059669',
    'District Visit': '#2563eb',
    'Inspection Tour': '#7c3aed',
    'Public Event': '#f59e0b',
  };
  return (category && colors[category]) || '#6b7280';
};

const getPriorityColor = (p?: string) => {
  const map: Record<string, string> = {
    Low: '#6b7280',
    Medium: '#1e40af',
    High: '#f59e0b',
    Urgent: '#ef4444',
  };
  return map[p ?? ''] || '#6b7280';
};

const typeTagStyles = {
  meeting: { bg: '#e0ecff', fg: '#1e40af' },
  task: { bg: '#fff7ed', fg: '#c2410c' },
  tour: { bg: '#eef2ff', fg: '#5b21b6' },
} as const;

const travelIcon = (mode?: string, color = '#6b7280') => {
  switch ((mode || '').toLowerCase()) {
    case 'flight': return <Plane size={14} color={color} />;
    case 'train': return <Train size={14} color={color} />;
    case 'car': return <Car size={14} color={color} />;
    default: return <Car size={14} color={color} />;
  }
};

const showToast = (type: 'success' | 'error' | 'info', text1: string, text2?: string) =>
  Toast.show({ type, text1, text2, position: 'bottom' });

/* -------------------- Component -------------------- */
export default function HomeScreen() {
  /* -------------------- Data -------------------- */
  const [meetingList, setMeetingList] = useState<MeetingRow[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // local overlay (if you overlay edits)
  const [localState, setLocalState] = useState<Record<string, Partial<MeetingRow>>>({});

  // null = show all today's lists; otherwise filter to one list
  const [selectedFilter, setSelectedFilter] = useState<'meetings' | 'tasks' | 'tours' | null>(null);

  // Modals
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [tourModalVisible, setTourModalVisible] = useState(false);

  /* -------------------- Fetch -------------------- */
  const fetchAll = async () => {
    !refreshing && setLoading(true);
    const [meetingsRes, tasksRes, toursRes] = await Promise.all([
      supabase.from('meetings').select('*').order('meeting_date', { ascending: true }).order('meeting_time', { ascending: true }),
      supabase.from('tasks').select('*'),
      supabase.from('tour_plans').select('*'),
    ]);

    if (meetingsRes.error) showToast('error', 'Meetings Error', meetingsRes.error.message);
    if (tasksRes.error) showToast('error', 'Tasks Error', tasksRes.error.message);
    if (toursRes.error) showToast('error', 'Tours Error', toursRes.error.message);

    const meetings = (meetingsRes.data ?? []) as MeetingRow[];
    const tasks = tasksRes.data ?? [];
    const tours = toursRes.data ?? [];

    setMeetingList(meetings);
    setTasks(tasks);
    setTours(tours);

    // ↓ schedule alarms for items starting within 15 minutes
    // await scheduleUpcomingAlarms({ meetings, tasks, tours });

    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = async () => { setRefreshing(true); await fetchAll(); };

  useFocusEffect(
    React.useCallback(() => {
      fetchAll();
    }, [])
  );

  /* -------------------- Auth / Profile -------------------- */
  const [profile, setProfile] = useState<Profile>({ id: '', name: 'New User', email: '', role: 'staff' });
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth.user?.id;
        const uemail = auth.user?.email ?? '';
        if (!uid) { router.replace('/(auth)/login'); return; }
        const { data: row } = await supabase.from('users')
          .select('id, name, email, role, username').eq('id', uid).maybeSingle();
        if (mounted) {
          setProfile({
            id: uid,
            name: row?.name ?? auth.user?.user_metadata?.full_name ?? 'New User',
            email: row?.email ?? uemail,
            role: row?.role ?? 'staff',
            username: row?.username ?? null,
          });
        }
      } catch (e: any) {
        showToast('error', 'Profile Error', e?.message ?? 'Failed to load profile');
      } finally { if (mounted) setLoadingProfile(false); }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('meetings:refresh', fetchAll);
    return () => sub.remove();
  }, []);

  // For Notification
  // useEffect(() => {
  //   (async () => {
  //     await ensureAndroidChannel();
  //     const { status } = await Notifications.getPermissionsAsync();
  //     if (status !== 'granted') {
  //       await Notifications.requestPermissionsAsync();
  //     }
  //   })();
  // }, []);

  // useEffect(() => {
  //   let interval: any;
  //   const onChange = (state: string) => {
  //     if (state === 'active') {
  //       // check every 60s
  //       interval = setInterval(() => {
  //         scheduleUpcomingAlarms({
  //           meetings: meetingList,
  //           tasks,
  //           tours,
  //         });
  //       }, 60_000);
  //     } else {
  //       if (interval) clearInterval(interval);
  //     }
  //   };
  //   const sub = AppState.addEventListener('change', onChange);
  //   onChange('active');
  //   return () => {
  //     sub.remove();
  //     if (interval) clearInterval(interval);
  //   };
  // }, [meetingList, tasks, tours]);

  /* -------------------- Today helpers & counts -------------------- */
  const todayYMD = useMemo(() => {
    const d = new Date(); const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const isTodayByAny = (row: any, fields: string[]) => {
    for (const f of fields) if (row?.[f] && String(row[f]).slice(0, 10) === todayYMD) return true;
    return false;
  };

  const todaysMeetings = useMemo(
    () => meetingList.filter(m => m.meeting_date === todayYMD),
    [meetingList, todayYMD]
  );
  const todaysTasks = useMemo(
    () => (tasks || []).filter(t => isTodayByAny(t, ['task_date', 'due_date', 'date'])),
    [tasks, todayYMD]
  );
  const todaysTours = useMemo(
    () => (tours || []).filter(t => isTodayByAny(t, ['tour_date', 'start_date', 'date'])),
    [tours, todayYMD]
  );

  const allEmptyToday =
    todaysMeetings.length === 0 &&
    todaysTasks.length === 0 &&
    todaysTours.length === 0;

  const statMeetings = todaysMeetings.length.toString();
  const statTasks = todaysTasks.length.toString();
  const statTours = todaysTours.length.toString();

  function getState(m: MeetingRow) { return { ...m, ...(localState[m.id] || {}) }; }

  /* -------------------- Task modal handlers -------------------- */
  const openCreateTask = () => setTaskModalVisible(true);

  const handleCreateTaskSubmit = async (form: CreateTaskForm) => {
    try {
      const payload = {
        title: form.title,
        description: form.description ?? null,
        priority: form.priority,
        due_date: form.dueDate ?? todayYMD,     // DB column
        // assigned_to: form.assignedTo ?? null,
        category: form.category,
      };

      // optimistic add when today's due date
      if ((form.dueDate ?? todayYMD) === todayYMD) {
        const tempId = `temp-${Date.now()}`;
        setTasks((prev) => [{ id: tempId, ...payload }, ...prev]);
      }

      const { error } = await supabase.from('tasks').insert(payload);
      if (error) {
        showToast('error', 'Could not create task', error.message);
      } else {
        showToast('success', 'Task created');
      }

      await fetchAll();
      setTaskModalVisible(false);
    } catch (e: any) {
      showToast('error', 'Error', e?.message ?? 'Failed to create task');
    }
  };

  /* -------------------- Tour modal handlers -------------------- */
  const openCreateTour = () => setTourModalVisible(true);

  const handleCreateTourSubmit = async (form: TourPlanForm) => {
    try {
      const body = {
        title: form.title.trim(),
        destination: form.destination.trim(),
        start_date: form.startDate || todayYMD,
        end_date: form.endDate || form.startDate || todayYMD,
        start_time: form.startTime || null,
        end_time: form.endTime || null,
        purpose: form.purpose || null,
        travel_mode: form.travelMode,
        status: 'planned' as const,
        category: form.category || null,
        // estimated_budget: form.estimatedBudget || null,
        accompanied_by: form.accompaniedBy ? form.accompaniedBy.split(',').map(s => s.trim()).filter(Boolean) : null,
        // accommodation: form.accommodation || null,
        // special_requirements: form.specialRequirements || null,
        created_by: (await supabase.auth.getUser()).data.user?.id ?? null,
      };

      if ((body.start_date ?? todayYMD) === todayYMD) {
        const tempId = `temp-tour-${Date.now()}`;
        setTours((prev) => [{ id: tempId, ...body }, ...prev]);
      }

      const { error } = await supabase.from('tour_plans').insert([body]);
      if (error) {
        showToast('error', 'Could not create tour', error.message);
      } else {
        showToast('success', 'Tour plan created');
      }

      await fetchAll();
      setTourModalVisible(false);
    } catch (e: any) {
      showToast('error', 'Error', e?.message ?? 'Failed to create tour plan');
    }
  };

  /* -------------------- UI -------------------- */
  const toggleFilter = (key: 'meetings' | 'tasks' | 'tours') => {
    setSelectedFilter(prev => (prev === key ? null : key));
  };

  const showMeetings = selectedFilter === null || selectedFilter === 'meetings';
  const showTasks = selectedFilter === null || selectedFilter === 'tasks';
  const showTours = selectedFilter === null || selectedFilter === 'tours';

  const initials = (profile?.name ?? 'N U')
    .split(' ')
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase())
    .join('');

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient
        colors={['#eef2ff', '#ffffff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerWrap}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            {/* <Text style={styles.kicker}>Welcome back,</Text> */}
            <Text style={styles.userName}>Sambit Garnayak</Text>
            <View style={styles.roleRow}>
              <Text style={styles.userRole}>P.S. to {profile.role}</Text>
              <View style={styles.dividerDot} />
              <Text style={styles.signature}>{profile.name}</Text>
            </View>
          </View>

          {/* <View style={styles.rightHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTxt}>{initials || 'NU'}</Text>
            </View>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => showToast('info', 'No new notifications')}
            >
              <Bell size={22} color="#1e3a8a" />
              <View style={styles.notificationBadge}><Text style={styles.notificationCount}>3</Text></View>
            </TouchableOpacity>
          </View> */}
        </View>

        {/* Filter Chips */}
        <View style={styles.filterChips}>
          <Pressable
            onPress={() => setSelectedFilter(null)}
            style={[styles.chip, selectedFilter === null && styles.chipActiveSlate]}
          >
            <Users size={14} color={selectedFilter === null ? '#fff' : '#334155'} />
            <Text style={[styles.chipTxt, selectedFilter === null && styles.chipTxtActive]}>All</Text>
          </Pressable>
          <Pressable
            onPress={() => toggleFilter('meetings')}
            style={[styles.chip, selectedFilter === 'meetings' && styles.chipActiveBlue]}
          >
            <Calendar size={14} color={selectedFilter === 'meetings' ? '#fff' : '#1e3a8a'} />
            <Text style={[styles.chipTxt, selectedFilter === 'meetings' && styles.chipTxtActive]}>Meetings</Text>
          </Pressable>
          <Pressable
            onPress={() => toggleFilter('tasks')}
            style={[styles.chip, selectedFilter === 'tasks' && styles.chipActiveAmber]}
          >
            <Clock size={14} color={selectedFilter === 'tasks' ? '#fff' : '#a16207'} />
            <Text style={[styles.chipTxt, selectedFilter === 'tasks' && styles.chipTxtActive]}>Tasks</Text>
          </Pressable>
          <Pressable
            onPress={() => toggleFilter('tours')}
            style={[styles.chip, selectedFilter === 'tours' && styles.chipActiveGreen]}
          >
            <BookOpen size={14} color={selectedFilter === 'tours' ? '#fff' : '#065f46'} />
            <Text style={[styles.chipTxt, selectedFilter === 'tours' && styles.chipTxtActive]}>Tours</Text>
          </Pressable>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatCard
            value={statMeetings}
            label="Meetings"
            icon={<Calendar size={18} color="#1e40af" />}
            gradient={['#ffffff', '#e0ecff']}
            active={selectedFilter === 'meetings'}
            onPress={() => toggleFilter('meetings')}
          />
          <StatCard
            value={statTasks}
            label="Tasks"
            icon={<Clock size={18} color="#b45309" />}
            gradient={['#ffffff', '#fff0d6']}
            active={selectedFilter === 'tasks'}
            onPress={() => toggleFilter('tasks')}
          />
          <StatCard
            value={statTours}
            label="Tours"
            icon={<BookOpen size={18} color="#6d28d9" />}
            gradient={['#ffffff', '#efe9ff']}
            active={selectedFilter === 'tours'}
            onPress={() => toggleFilter('tours')}
          />
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 28 }}
      >
        <View style={styles.meetingsList}>

          {loading && (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <ActivityIndicator />
              <Text style={{ color: '#6b7280', marginTop: 8 }}>Loading today’s items…</Text>
            </View>
          )}

          {!loading && selectedFilter === null && allEmptyToday && (
            <EmptyState />
          )}

          {selectedFilter === 'meetings' && !(todaysMeetings.length > 0) && (
            <View style={styles.noResults}>
              <LinearGradient colors={['#f8fafc', '#eef2ff']} style={styles.emptyGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={styles.noResultsEmoji}>🎉</Text>
                <Text style={styles.noResultsText}>You’re all caught up</Text>
                <Text style={styles.noResultsSub}>No Meeting scheduled for today</Text>
              </LinearGradient>
            </View>
          )}

          {selectedFilter === 'tasks' && !(todaysMeetings.length > 0) && (
            <View style={styles.noResults}>
              <LinearGradient colors={['#f8fafc', '#eef2ff']} style={styles.emptyGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={styles.noResultsEmoji}>🎉</Text>
                <Text style={styles.noResultsText}>You’re all caught up</Text>
                <Text style={styles.noResultsSub}>No Task scheduled for today</Text>
              </LinearGradient>
            </View>
          )}

          {selectedFilter === 'tours' && !(todaysMeetings.length > 0) && (
            <View style={styles.noResults}>
              <LinearGradient colors={['#f8fafc', '#eef2ff']} style={styles.emptyGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={styles.noResultsEmoji}>🎉</Text>
                <Text style={styles.noResultsText}>You’re all caught up</Text>
                <Text style={styles.noResultsSub}>No Tour Plan scheduled for today</Text>
              </LinearGradient>
            </View>
          )}

          {!loading && (
            <>
              {/* Meetings (today) */}
              {showMeetings && todaysMeetings.length > 0 && (
                <>
                  <SectionHeader title="Today’s Meetings" />
                  {todaysMeetings.map((meeting) => {
                    const st = getState(meeting);
                    const statusKey = (st.status || meeting.status) as MeetingRow['status'];
                    const sColor = meetingStatusColor[statusKey];
                    const [y, mo, d] = (meeting.meeting_date ?? '').split('-').map(Number);
                    const displayDate = y && mo && d ? new Date(y, mo - 1, d) : null;

                    return (
                      <TouchableOpacity
                        key={meeting.id}
                        activeOpacity={0.9}
                        onPress={() => router.push({ pathname: '/(tabs)/meetings', params: { id: meeting.id } })}
                      >
                        <View style={styles.card}>
                          <View style={styles.topRow}>
                            <View style={[styles.typeTag, { backgroundColor: typeTagStyles.meeting.bg }]}>
                              <Text style={[styles.typeTagText, { color: typeTagStyles.meeting.fg }]}>Meeting</Text>
                            </View>
                            <View style={[styles.statusChip, { borderColor: sColor, backgroundColor: '#fff' }]}>
                              <View style={[styles.statusDot, { backgroundColor: sColor }]} />
                              <Text style={[styles.statusChipText, { color: sColor }]}>{String(statusKey).toUpperCase()}</Text>
                            </View>
                          </View>

                          <View style={styles.meetingHeaderRow}>
                            <View style={styles.leftHead}>
                              <Text style={styles.meetingTitle}>{meeting.title}</Text>
                            </View>
                            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(meeting.category ?? undefined) }]}>
                              <Text style={styles.categoryText}>{meeting.category || 'General'}</Text>
                            </View>
                          </View>

                          {!!meeting.description && <Text style={styles.desc}>{meeting.description}</Text>}

                          <View style={styles.infoRow}>
                            <Calendar size={16} color="#6b7280" />
                            <Text style={styles.infoText}>
                              {displayDate
                                ? displayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                                : '—'}
                            </Text>
                          </View>

                          <View style={styles.infoRow}>
                            <Clock size={16} color="#6b7280" />
                            <Text style={styles.infoText}>
                              {meeting.meeting_time ? meeting.meeting_time : '—'} {meeting.duration_minutes ? `(${Math.round(meeting.duration_minutes)} min)` : ''}
                            </Text>
                          </View>

                          {!!meeting.location && (
                            <View style={styles.infoRow}>
                              <MapPin size={16} color="#6b7280" />
                              <Text style={styles.infoText}>{meeting.location}</Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}

              {/* Tasks (today) */}
              {showTasks && todaysTasks.length > 0 && (
                <>
                  <SectionHeader title="Today’s Tasks" />
                  {todaysTasks.map((t: any) => {
                    const when = t.task_date || t.due_date || t.date || '';
                    const label = t.title || t.name || t.subject || 'Untitled Task';
                    const completed = !!t.completed;
                    const statusKey: 'completed' | 'pending' = completed ? 'completed' : 'pending';
                    const sColor = taskStatusColor[statusKey];
                    return (
                      <TouchableOpacity
                        key={t.id}
                        activeOpacity={0.9}
                        onPress={() => router.push({ pathname: '/(tabs)/tasks', params: { id: t.id } })}
                      >
                        <View style={styles.card}>
                          <View style={styles.topRow}>
                            <View style={[styles.typeTag, { backgroundColor: typeTagStyles.task.bg }]}>
                              <Text style={[styles.typeTagText, { color: typeTagStyles.task.fg }]}>Task</Text>
                            </View>
                            <View style={[styles.statusChip, { borderColor: sColor, backgroundColor: '#fff' }]}>
                              <View style={[styles.statusDot, { backgroundColor: sColor }]} />
                              <Text style={[styles.statusChipText, { color: sColor }]}>{statusKey.toUpperCase()}</Text>
                            </View>
                          </View>

                          <View style={[styles.meetingHeaderRow, { marginBottom: 8 }]}>
                            <Text style={styles.meetingTitle}>{label}</Text>
                          </View>

                          {!!t.description && <Text style={styles.desc}>{t.description}</Text>}

                          <View style={styles.metaRowWrap}>
                            {!!t.priority && (
                              <View style={[styles.metaChip, { backgroundColor: getPriorityColor(t.priority) }]}>
                                <Flag size={12} color="#fff" />
                                <Text style={styles.metaChipText}>{t.priority}</Text>
                              </View>
                            )}
                            {!!t.category && (
                              <View style={[styles.metaChipSoft, { backgroundColor: '#f3f4f6' }]}>
                                <Text style={[styles.metaChipSoftText]}>{t.category}</Text>
                              </View>
                            )}
                            {!!t.assigned_to && (
                              <View style={[styles.metaChipSoft, { backgroundColor: '#f3f4f6' }]}>
                                <User size={12} color="#6b7280" />
                                <Text style={styles.metaChipSoftText}>{t.assigned_to}</Text>
                              </View>
                            )}
                          </View>

                          {when ? (
                            <View style={styles.infoRow}>
                              <Calendar size={16} color="#6b7280" />
                              <Text style={styles.infoText}>{String(when)}</Text>
                            </View>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}

              {/* Tours (today) */}
              {showTours && todaysTours.length > 0 && (
                <>
                  <SectionHeader title="Today’s Tours" />
                  {todaysTours.map((tr: any) => {
                    const when = tr.tour_date || tr.start_date || tr.date || '';
                    const label = tr.title || tr.name || 'Tour Plan';
                    const tStatus: 'planned' | 'confirmed' | 'cancelled' | 'completed' =
                      (tr.status || 'planned').toLowerCase();
                    const sColor = tourStatusColor[tStatus];
                    return (
                      <TouchableOpacity
                        key={tr.id}
                        activeOpacity={0.9}
                        onPress={() => router.push({ pathname: '/(tabs)/tour-plan', params: { id: tr.id } })}
                      >
                        <View style={styles.card}>
                          <View style={styles.topRow}>
                            <View style={[styles.typeTag, { backgroundColor: typeTagStyles.tour.bg }]}>
                              <Text style={[styles.typeTagText, { color: typeTagStyles.tour.fg }]}>Tour</Text>
                            </View>
                            <View style={[styles.statusChip, { borderColor: sColor, backgroundColor: '#fff' }]}>
                              <View style={[styles.statusDot, { backgroundColor: sColor }]} />
                              <Text style={[styles.statusChipText, { color: sColor }]}>{tStatus.toUpperCase()}</Text>
                            </View>
                          </View>

                          <View style={[styles.meetingHeaderRow, { marginBottom: 8 }]}>
                            <Text style={styles.meetingTitle}>{label}</Text>
                            {!!tr.category && (
                              <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(tr.category) }]}>
                                <Text style={styles.categoryText}>{tr.category}</Text>
                              </View>
                            )}
                          </View>

                          {!!tr.purpose && <Text style={styles.desc}>{tr.purpose}</Text>}

                          <View style={styles.metaRowWrap}>
                            {!!tr.destination && (
                              <View style={[styles.metaChipSoft, { backgroundColor: '#f3f4f6' }]}>
                                <MapPin size={12} color="#6b7280" />
                                <Text style={styles.metaChipSoftText}>{tr.destination}</Text>
                              </View>
                            )}
                            {!!tr.travel_mode && (
                              <View style={[styles.metaChipSoft, { backgroundColor: '#eef2ff', borderColor: '#c7d2fe', borderWidth: 1 }]}>
                                {travelIcon(tr.travel_mode, '#4f46e5')}
                                <Text style={[styles.metaChipSoftText, { color: '#4f46e5' }]}>{tr.travel_mode}</Text>
                              </View>
                            )}
                            {/* {!!tr.estimated_budget && (
                              <View style={[styles.metaChipSoft, { backgroundColor: '#ecfeff', borderColor: '#a5f3fc', borderWidth: 1 }]}>
                                <Text style={[styles.metaChipSoftText, { color: '#0e7490' }]}>{tr.estimated_budget}</Text>
                              </View>
                            )} */}
                          </View>

                          {when ? (
                            <View style={styles.infoRow}>
                              <Calendar size={16} color="#6b7280" />
                              {tr.start_date && tr.end_date ? (
                                <Text style={styles.infoText}>
                                  {String(tr.start_date)} – {String(tr.end_date)}
                                </Text>
                              ) : (
                                <Text style={styles.infoText}>{String(when)}</Text>
                              )}
                            </View>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
        <SectionHeader title="Quick Actions" />
        <View style={styles.quickActionsRow}>
          <ActionButton
            label="New Meeting"
            icon={<Users size={18} color="#ffffff" />}
            onPress={() => router.push('/meeting-request')}
          />
          <ActionButton
            label="New Task"
            icon={<BookOpen size={18} color="#ffffff" />}
            onPress={() => setTaskModalVisible(true)}
          />
          <ActionButton
            label="New Tour"
            icon={<FileText size={18} color="#ffffff" />}
            onPress={() => setTourModalVisible(true)}
          />
        </View>
      </View>

      {/* Reusable Create/Edit Task Modal — CREATE mode */}
      <CreateTaskModal
        visible={taskModalVisible}
        mode="create"
        onClose={() => setTaskModalVisible(false)}
        onSubmit={handleCreateTaskSubmit}
        defaultDueDate={todayYMD}
      />

      {/* Reusable Create/Edit Tour Modal — CREATE mode */}
      <CreateTourPlanModal
        visible={tourModalVisible}
        mode="create"
        onClose={() => setTourModalVisible(false)}
        onSubmit={handleCreateTourSubmit}
      />

      {/* Toast portal */}
      <Toast />
    </View>
  );
}

/* ----------------- Small presentational pieces ----------------- */
const SectionHeader = ({ title }: { title: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 }}>
    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#1e40af', marginRight: 8 }} />
    <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a' }}>{title}</Text>
  </View>
);

const EmptyState = () => (
  <View style={styles.noResults}>
    <LinearGradient colors={['#f8fafc', '#eef2ff']} style={styles.emptyGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <Text style={styles.noResultsEmoji}>🎉</Text>
      <Text style={styles.noResultsText}>You’re all caught up</Text>
      <Text style={styles.noResultsSub}>Nothing scheduled for today</Text>
    </LinearGradient>
  </View>
);

const StatCard = ({
  value,
  label,
  icon,
  gradient,
  active,
  onPress,
}: {
  value: string;
  label: string;
  icon: React.ReactNode;
  gradient: readonly [string, string];
  active?: boolean;
  onPress?: () => void;
}) => (
  <Pressable onPress={onPress} style={{ flex: 1 }}>
    <LinearGradient colors={gradient} style={[styles.statCardModern, active && styles.statCardActive]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <View style={styles.statIconModern}>{icon}</View>
      <Text style={styles.statValueModern}>{value}</Text>
      <Text style={styles.statLabelModern}>{label}</Text>
    </LinearGradient>
  </Pressable>
);

const ActionButton = ({ label, icon, onPress }: { label: string; icon: React.ReactNode; onPress: () => void; }) => (
  <Pressable
    style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
    onPress={onPress}
  >
    <LinearGradient
      colors={['#1e3a8a', '#2563eb']}
      style={styles.actionIconCircle}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {icon}
    </LinearGradient>
    <Text style={styles.actionLabel}>{label}</Text>
  </Pressable>
);

/* ----------------- styles ----------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  /* header (modern) */
  headerWrap: { paddingBottom: 10, paddingTop: 8, paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerContent: { flex: 1, paddingRight: 12 },
  kicker: { fontSize: 12, color: '#64748b', fontWeight: '700', letterSpacing: 0.3 },
  userName: { fontSize: 22, fontWeight: '900', color: '#0f172a', marginTop: 2 },
  roleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  userRole: { fontSize: 12, color: '#64748b', fontWeight: '700' },
  dividerDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#cbd5e1', marginHorizontal: 8 },
  signature: { fontSize: 12, color: '#111827', fontWeight: '800' },

  rightHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#e0ecff',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#c7d2fe'
  },
  avatarTxt: { fontSize: 14, fontWeight: '900', color: '#1e3a8a' },

  notificationButton: { position: 'relative', width: 44, height: 44, borderRadius: 22, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  notificationBadge: { position: 'absolute', top: 4, right: 4, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center' },
  notificationCount: { fontSize: 10, fontWeight: '800', color: '#ffffff' },

  /* chips */
  filterChips: { flexDirection: 'row', gap: 8, marginTop: 12 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0'
  },
  chipActiveBlue: { backgroundColor: '#1e3a8a', borderColor: '#1e3a8a' },
  chipActiveAmber: { backgroundColor: '#b45309', borderColor: '#b45309' },
  chipActiveGreen: { backgroundColor: '#065f46', borderColor: '#065f46' },
  chipActiveSlate: { backgroundColor: '#334155', borderColor: '#334155' },
  chipTxt: { fontSize: 12, fontWeight: '800', color: '#0f172a' },
  chipTxtActive: { color: '#fff' },

  /* stats (modern) */
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  statCardModern: {
    // flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statCardActive: { borderColor: '#1e40af' },
  statIconModern: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6
  },
  statValueModern: { fontSize: 22, fontWeight: '900', color: '#0f172a', marginBottom: 2 },
  statLabelModern: { fontSize: 11, fontWeight: '800', color: '#64748b' },

  /* list */
  meetingsList: { paddingHorizontal: 16, paddingTop: 10, gap: 14 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 10,
  },

  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  typeTagText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },

  meetingHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  leftHead: { flex: 1, marginRight: 12 },
  meetingTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 4 },

  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#6b7280' },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusChipText: { fontSize: 11, fontWeight: '900' },

  categoryBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  categoryText: { fontSize: 11, fontWeight: '900', color: '#fff' },

  desc: { fontSize: 14, color: '#475569', lineHeight: 20, marginBottom: 12 },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  infoText: { fontSize: 14, color: '#475569', flex: 1 },

  metaRowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  metaChipText: { fontSize: 12, color: '#fff', fontWeight: '800' },
  metaChipSoft: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
    borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f8fafc'
  },
  metaChipSoftText: { fontSize: 12, color: '#334155', fontWeight: '800' },

  noResults: { alignItems: 'center', paddingVertical: 40 },
  noResultsEmoji: { fontSize: 44, marginBottom: 6 },
  noResultsText: { fontSize: 18, fontWeight: '900', color: '#0f172a', marginBottom: 2 },
  noResultsSub: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  emptyGradient: { width: '100%', paddingVertical: 28, borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },

  /* Quick Actions */
  quickActionsSection: { paddingHorizontal: 16, paddingVertical: 8 },
  quickActionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2, gap: 8 },
  actionBtn: {
    flex: 1,
    backgroundColor: '#1e40af',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  actionBtnPressed: { transform: [{ scale: 0.98 }], opacity: 0.96 },
  actionIconCircle: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)'
  },
  actionLabel: { fontSize: 12, fontWeight: '900', color: '#ffffff', textAlign: 'center', letterSpacing: 0.2 },
});