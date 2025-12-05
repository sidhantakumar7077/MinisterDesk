import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  Calendar,
  ChevronLeft, ChevronRight,
  Clock, FileText,
  MapPin,
  Play,
  Plus,
  Save,
  Square,
  UserPlus,
  Users,
  X
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  DeviceEventEmitter,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { supabase } from '../config';

/* ----------------------------- Types ----------------------------- */
type MeetingRow = {
  id: string;
  title: string;
  description?: string | null;
  meeting_date: string;
  meeting_time?: string | null;
  duration_minutes?: number | null;
  location?: string | null;
  status: 'upcoming' | 'scheduled' | 'active' | 'completed' | 'cancelled';
  category?: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string | null;
  is_active: boolean;
  is_recording: boolean;
  started_at?: string | null;
  ended_at?: string | null;
  attendees?: string[] | null; // 👈 NEW
  updated_at?: string | null;  // 👈 Optional, if table has it
};

const statusesColor: Record<MeetingRow['status'], string> = {
  upcoming: '#f59e0b',
  scheduled: '#1e40af',
  completed: '#059669',
  active: '#dc2626',
  cancelled: '#6b7280',
};

function getCategoryColor(category?: string): string {
  const colors: Record<string, string> = {
    'works': '#f59e0b',
    'law': '#7c3aed',
    'excise': '#1e40af',
    'personal': '#ef4444'
  };
  return category && colors[category] ? colors[category] : '#6b7280';
}

function getPriorityColor(p: MeetingRow['priority']): string {
  switch (p) {
    case 'low': return '#10b981';     // emerald
    case 'medium': return '#f59e0b';  // amber
    case 'high': return '#ea580c';    // orange
    case 'urgent': return '#dc2626';  // red
    default: return '#6b7280';
  }
}

function formatDateNice(s?: string | null) {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit'
  });
}

/* ----------------------------- Screen ----------------------------- */
export default function MeetingsScreen() {
  const [meetingList, setMeetingList] = useState<MeetingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [localState, setLocalState] = useState<Record<string, any>>({});

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const isToday = selectedDate.toDateString() === new Date().toDateString();

  const [showCalendarModal, setShowCalendarModal] = useState(false); // kept for follow-up date selection
  const [pickerMonth, setPickerMonth] = useState<Date>(new Date());
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Native date picker for dateNavigation
  const [showNativeDatePicker, setShowNativeDatePicker] = useState(false);

  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notesFor, setNotesFor] = useState<MeetingRow | null>(null);
  const [notesText, setNotesText] = useState('');

  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followFor, setFollowFor] = useState<MeetingRow | null>(null);
  const [followTitle, setFollowTitle] = useState('');
  const [followPurpose, setFollowPurpose] = useState('');
  const [followTime, setFollowTime] = useState('10:00 AM');
  const [followDate, setFollowDate] = useState<string>(''); // YYYY-MM-DD

  /* ----------------------------- Fetch ----------------------------- */
  const fetchMeetings = async () => {
    !refreshing && setLoading(true);
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .order('meeting_date', { ascending: true })
        .order('meeting_time', { ascending: true });

      if (error) throw error;
      setMeetingList((data ?? []) as MeetingRow[]);
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Load failed', text2: e?.message ?? 'Could not fetch meetings.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMeetings();
  };

  useEffect(() => { fetchMeetings(); }, []);
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('meetings:refresh', fetchMeetings);
    return () => sub.remove();
  }, []);

  /* ----------------------------- Helpers ----------------------------- */
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  function getMeetingState(m: MeetingRow) {
    return localState[m.id] ?? m;
  }

  const navigateDate = (dir: 'prev' | 'next') => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + (dir === 'prev' ? -1 : 1));
    setSelectedDate(d);
  };
  const resetToToday = () => setSelectedDate(new Date());

  /* ----------------------------- Calendar Grid ----------------------------- */
  const monthGrid = useMemo(() => {
    const first = new Date(pickerMonth.getFullYear(), pickerMonth.getMonth(), 1);
    const last = new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() + 1, 0);
    const lead = first.getDay();
    const total = last.getDate();
    const cells: { label: string; date?: Date; inactive?: boolean }[] = [];
    for (let i = 0; i < lead; i++) cells.push({ label: '', inactive: true });
    for (let d = 1; d <= total; d++) {
      cells.push({ label: String(d), date: new Date(pickerMonth.getFullYear(), pickerMonth.getMonth(), d) });
    }
    while (cells.length % 7 !== 0) cells.push({ label: '', inactive: true });
    return cells;
  }, [pickerMonth]);

  /* ----------------------------- Filtered list ----------------------------- */
  const filteredMeetings = useMemo(() => {
    return meetingList.filter((m) => {
      const [y, mo, d] = (m.meeting_date ?? '').split('-').map(Number);
      if (!y || !mo || !d) return false;
      return isSameDay(new Date(y, mo - 1, d), selectedDate);
    });
  }, [meetingList, selectedDate]);

  /* ----------------------------- Actions ----------------------------- */
  const startMeeting = async (meetingId: string) => {
    try {
      const { error } = await supabase
        .from('meetings')
        .update({ is_active: true, status: 'active', started_at: new Date().toISOString() })
        .eq('id', meetingId);
      if (error) throw error;

      setLocalState(prev => ({
        ...prev,
        [meetingId]: { ...(prev[meetingId] ?? {}), is_active: true, status: 'active', started_at: new Date().toISOString() },
      }));
      Toast.show({ type: 'success', text1: 'Meeting started' });
      fetchMeetings();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Start failed', text2: e?.message ?? 'Unable to start meeting.' });
    }
  };

  const endMeeting = async (meetingId: string) => {
    try {
      const { error } = await supabase
        .from('meetings')
        .update({ is_active: false, status: 'completed', ended_at: new Date().toISOString() })
        .eq('id', meetingId);
      if (error) throw error;

      setLocalState(prev => ({
        ...prev,
        [meetingId]: { ...(prev[meetingId] ?? {}), is_active: false, status: 'completed', ended_at: new Date().toISOString() },
      }));
      Toast.show({ type: 'success', text1: 'Meeting ended' });
      fetchMeetings();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'End failed', text2: e?.message ?? 'Unable to end meeting.' });
    }
  };

  const openNotes = (m: MeetingRow) => {
    setNotesFor(m);
    setNotesText((localState[m.id]?.notes as string) ?? (m.notes ?? ''));
    setShowNotesModal(true);
  };

  const saveNotes = async () => {
    if (!notesFor) return;
    try {
      const nowIso = new Date().toISOString();
      const { error } = await supabase.from('meetings').update({ notes: notesText }).eq('id', notesFor.id);
      if (error) throw error;
      // keep local echo (also store a local saved timestamp so we can show a date even if table lacks updated_at)
      setLocalState(prev => ({
        ...prev,
        [notesFor.id]: {
          ...(prev[notesFor.id] ?? {}),
          notes: notesText,
          notes_saved_at: nowIso,
        }
      }));
      Toast.show({ type: 'success', text1: 'Notes saved' });
      fetchMeetings();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Save failed', text2: e?.message ?? 'Unable to save notes.' });
    }
  };

  const openFollowUp = (m: MeetingRow) => {
    setFollowFor(m);
    setFollowTitle(`Follow-up: ${m.title}`);
    setFollowPurpose(`Follow-up discussion for ${m.title}`);
    setFollowTime('10:00 AM');
    setFollowDate('');
    setShowFollowUpModal(true);
  };

  const createFollowUp = async () => {
    if (!followTitle.trim() || !followTime.trim() || !followDate) {
      Toast.show({ type: 'info', text1: 'Missing fields', text2: 'Title, Date and Time are required.' });
      return;
    }
    try {
      const { error } = await supabase.from('meetings').insert({
        title: followTitle.trim(),
        description: followPurpose.trim(),
        meeting_date: followDate,
        meeting_time: followTime,
        duration_minutes: 60,
        location: followFor?.location ?? 'TBD',
        status: 'upcoming',
        category: followFor?.category ?? 'Administrative',
        notes: '',
        is_active: false,
        is_recording: false,
      } as any);
      if (error) throw error;

      setShowFollowUpModal(false);
      setFollowFor(null);
      setFollowTitle('');
      setFollowPurpose('');
      setFollowTime('10:00 AM');
      setFollowDate('');
      Toast.show({ type: 'success', text1: 'Follow-up created' });
      fetchMeetings();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Creation failed', text2: e?.message ?? 'Unable to create follow-up.' });
    }
  };

  /* ----------------------------- UI ----------------------------- */
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1e40af"
            colors={['#1e40af']}
            progressViewOffset={8}
          />
        }
      >
        {/* Gradient Header */}
        <LinearGradient
          colors={['#eef2ff', '#ffffff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.3, y: 1 }}
          style={styles.headerWrap}
        >
          <View style={styles.header}>
            <View>
              {/* <Text style={styles.kicker}>Meetings</Text> */}
              <Text style={styles.headerTitle}>Meetings</Text>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={() => router.push('/meeting-request')}>
              <Plus size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Date strip */}
          <View style={styles.dateNavigation}>
            <TouchableOpacity onPress={() => navigateDate('prev')} style={styles.dateNavButton}>
              <ChevronLeft size={20} color="#1e40af" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateDisplay}
              onPress={() => setShowNativeDatePicker(true)}
            >
              <Calendar size={16} color="#1e40af" />
              <Text style={styles.dateText}>
                {isToday
                  ? 'Today'
                  : selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </Text>
              <Text style={styles.fullDateText}>
                {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigateDate('next')} style={styles.dateNavButton}>
              <ChevronRight size={20} color="#1e40af" />
            </TouchableOpacity>
          </View>

          <View style={styles.dateInfo}>
            <Text style={styles.dateInfoText}>
              {filteredMeetings.length} meeting{filteredMeetings.length !== 1 ? 's' : ''} for this date
            </Text>
            {!isToday && (
              <TouchableOpacity onPress={resetToToday} style={styles.todayButton}>
                <Text style={styles.todayButtonText}>Go to Today</Text>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        {/* Meetings List */}
        <View style={styles.meetingsList}>
          {filteredMeetings.length > 0 ? (
            filteredMeetings.map((meeting) => {
              const st = getMeetingState(meeting);
              const isActive = !!st.is_active;
              const statusKey = (st.status || meeting.status) as MeetingRow['status'];
              const statusColor = statusesColor[statusKey];

              const [y, mo, d] = (meeting.meeting_date ?? '').split('-').map(Number);
              const displayDate = y && mo && d ? new Date(y, mo - 1, d) : null;

              return (
                <View key={meeting.id} style={[styles.meetingCard, isActive && styles.activeMeetingCard]}>
                  <View style={styles.meetingHeaderRow}>
                    <View style={styles.leftHead}>
                      <Text style={styles.meetingTitle}>{meeting.title}</Text>
                      <View style={styles.statusWrap}>
                        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                        <Text style={[styles.statusText, { color: statusColor }]}>
                          {String(statusKey).toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {/* Right badges: category + priority */}
                    <View style={styles.rightBadges}>
                      <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(meeting.category ?? undefined) }]}>
                        <Text style={styles.categoryText}>{meeting.category || 'General'}</Text>
                      </View>
                      <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(meeting.priority) }]}>
                        <Text style={styles.priorityText}>{meeting.priority.toUpperCase()}</Text>
                      </View>
                    </View>
                  </View>

                  {!!meeting.description && <Text style={styles.desc}>{meeting.description}</Text>}

                  {displayDate && (
                    <View style={styles.infoRow}>
                      <Calendar size={16} color="#6b7280" />
                      <Text style={styles.infoText}>
                        {displayDate.toLocaleDateString('en-US', {
                          weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </Text>
                    </View>
                  )}

                  <View style={styles.infoRow}>
                    <Clock size={16} color="#6b7280" />
                    <Text style={styles.infoText}>
                      {meeting.meeting_time ? meeting.meeting_time : '—'}{' '}
                      {meeting.duration_minutes ? `(${Math.round(meeting.duration_minutes)} min)` : ''}
                    </Text>
                  </View>

                  {!!meeting.location && (
                    <View style={styles.infoRow}>
                      <MapPin size={16} color="#6b7280" />
                      <Text style={styles.infoText}>{meeting.location}</Text>
                    </View>
                  )}

                  {!!meeting.attendees && meeting.attendees.length > 0 && (
                    <View style={styles.infoRow}>
                      <Users size={16} color="#6b7280" />
                      <Text style={styles.infoText}>
                        {meeting.attendees.join(', ')}
                      </Text>
                    </View>
                  )}

                  <View style={styles.actionsRow}>
                    {(meeting.status === 'upcoming' || isActive) && (
                      !isActive ? (
                        <TouchableOpacity style={styles.startBtn} onPress={() => startMeeting(meeting.id)}>
                          <Play size={16} color="#fff" />
                          <Text style={styles.startBtnText}>Start</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity style={styles.endBtn} onPress={() => endMeeting(meeting.id)}>
                          <Square size={16} color="#fff" />
                          <Text style={styles.endBtnText}>End</Text>
                        </TouchableOpacity>
                      )
                    )}

                    <TouchableOpacity style={styles.followBtn} onPress={() => openFollowUp(meeting)}>
                      <UserPlus size={16} color="#059669" />
                      <Text style={styles.followBtnText}>Follow-up</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.notesBtn} onPress={() => openNotes(meeting)}>
                      <FileText size={16} color="#1e40af" />
                      <Text style={styles.notesBtnText}>Notes</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.noTodos}>
              <Text style={styles.noTodosText}>No meetings found</Text>
              <Text style={styles.noTodosSubtext}>Create your first meetings or adjust your filters</Text>
              <TouchableOpacity style={styles.createFirstButton} onPress={() => router.push('/meeting-request')}>
                <Plus size={16} color="#1e40af" />
                <Text style={styles.createFirstButtonText}>Create Meeting</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Notes Modal */}
        <Modal visible={showNotesModal} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Meeting Notes</Text>
              <TouchableOpacity onPress={() => setShowNotesModal(false)}>
                <X size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalSubtitle}>{notesFor?.title}</Text>
              <TextInput
                style={styles.notesInput}
                multiline
                placeholder="Add notes…"
                value={notesText}
                onChangeText={setNotesText}
                textAlignVertical="top"
                placeholderTextColor="#9ca3af"
              />

              {/* 👇 Show last saved notes preview with date, if any */}
              {!!notesFor && ((localState[notesFor.id]?.notes ?? notesFor.notes)?.trim()?.length > 0) && (
                <View style={styles.savedNotesBox}>
                  <Text style={styles.savedNotesLabel}>
                    Last saved {formatDateNice(
                      localState[notesFor.id]?.notes_saved_at ||
                      notesFor.updated_at ||
                      notesFor.ended_at ||
                      notesFor.meeting_date
                    )}
                  </Text>
                  <Text style={styles.savedNotesText}>
                    {localState[notesFor.id]?.notes ?? notesFor.notes}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.modalFooterRow}>
              <TouchableOpacity style={styles.primaryBtn} onPress={saveNotes}>
                <Save size={16} color="#fff" />
                <Text style={styles.primaryBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>

        {/* Follow-up Modal */}
        <Modal visible={showFollowUpModal} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Follow-up</Text>
              <TouchableOpacity onPress={() => setShowFollowUpModal(false)}>
                <X size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 16 }} style={styles.modalBody}>
              <Text style={styles.modalSubtitle}>{followFor?.title}</Text>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.input}
                  value={followTitle}
                  onChangeText={setFollowTitle}
                  placeholder="Follow-up title"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Purpose</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={followPurpose}
                  onChangeText={setFollowPurpose}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  placeholder="What will be discussed?"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Date *</Text>
                  <TouchableOpacity
                    style={styles.selector}
                    onPress={() => {
                      setPickerMonth(new Date());
                      setShowCalendarModal(true);
                    }}
                  >
                    <Calendar size={16} color="#6b7280" />
                    <Text style={styles.selectorText}>{followDate || 'Select date'}</Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Time *</Text>
                  <View style={styles.selector}>
                    <Clock size={16} color="#6b7280" />
                    <TextInput
                      style={styles.selectorTextInput}
                      value={followTime}
                      onChangeText={setFollowTime}
                      placeholder="e.g. 10:30 AM"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={createFollowUp}>
                <Save size={16} color="#fff" />
                <Text style={styles.primaryBtnText}>Create Follow-up</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Shared Calendar Modal (kept for follow-up date selection) */}
        <Modal visible={showCalendarModal} transparent animationType="fade">
          <View style={styles.datePickerOverlay}>
            <View style={styles.datePickerCard}>
              <View style={styles.dateHeader}>
                <TouchableOpacity
                  style={styles.monthBtn}
                  onPress={() => {
                    const d = new Date(pickerMonth);
                    d.setMonth(d.getMonth() - 1);
                    setPickerMonth(d);
                  }}
                >
                  <Text style={styles.monthBtnText}>‹</Text>
                </TouchableOpacity>

                <Text style={styles.monthTitle}>
                  {pickerMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                </Text>

                <TouchableOpacity
                  style={styles.monthBtn}
                  onPress={() => {
                    const d = new Date(pickerMonth);
                    d.setMonth(d.getMonth() + 1);
                    setPickerMonth(d);
                  }}
                >
                  <Text style={styles.monthBtnText}>›</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.weekHeader}>
                {daysOfWeek.map(d => (
                  <Text key={d} style={styles.weekHeadCell}>{d}</Text>
                ))}
              </View>

              <View style={styles.grid}>
                {monthGrid.map((cell, idx) => {
                  const isTodayCell = cell.date && new Date().toDateString() === cell.date.toDateString();
                  const pickedFollow =
                    cell.date && showFollowUpModal && followDate &&
                    cell.date.toISOString().slice(0, 10) === followDate;

                  return (
                    <TouchableOpacity
                      key={idx}
                      disabled={cell.inactive}
                      style={[
                        styles.gridCell,
                        cell.inactive && { opacity: 0.25 },
                        isTodayCell && styles.todayCell,
                        pickedFollow && { backgroundColor: '#bbf7d0' },
                      ]}
                      onPress={() => {
                        if (showFollowUpModal) {
                          if (cell.date) {
                            const yyyy = cell.date.getFullYear();
                            const mm = String(cell.date.getMonth() + 1).padStart(2, '0');
                            const dd = String(cell.date.getDate()).padStart(2, '0');
                            setFollowDate(`${yyyy}-${mm}-${dd}`);
                          }
                        } else {
                          if (cell.date) setSelectedDate(cell.date);
                        }
                        setShowCalendarModal(false);
                      }}
                    >
                      <Text style={[styles.gridText, isTodayCell && styles.todayText]}>{cell.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity style={styles.cancelPickerBtn} onPress={() => setShowCalendarModal(false)}>
                <Text style={styles.cancelPickerText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Native Date Picker for dateNavigation */}
        {showNativeDatePicker && (
          <DateTimePicker
            mode="date"
            display="default"
            value={selectedDate}
            onChange={(event, picked) => {
              setShowNativeDatePicker(false);
              if (picked) {
                const next = new Date(selectedDate);
                next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
                setSelectedDate(next);
              }
            }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ----------------------------- Styles ----------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  headerWrap: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { fontSize: 12, fontWeight: '700', letterSpacing: 1, color: '#1e40af', textTransform: 'uppercase' },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#1f2937' },
  addButton: {
    width: 48, height: 48, backgroundColor: '#1e40af', borderRadius: 24,
    justifyContent: 'center', alignItems: 'center', elevation: 8,
  },

  dateNavigation: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14,
  },
  dateNavButton: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#eef2ff',
    justifyContent: 'center', alignItems: 'center',
  },
  dateDisplay: {
    alignItems: 'center', backgroundColor: '#f8fafc', paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', gap: 8,
  },
  dateText: { fontSize: 18, fontWeight: '800', color: '#1e40af' },
  fullDateText: { fontSize: 12, color: '#6b7280', marginLeft: 8 },

  dateInfo: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateInfoText: { fontSize: 14, color: '#6b7280' },
  todayButton: { backgroundColor: '#dbeafe', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  todayButtonText: { fontSize: 12, fontWeight: '700', color: '#1e40af' },

  meetingsList: { paddingHorizontal: 20, paddingVertical: 16, gap: 16 },

  meetingCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
    borderLeftWidth: 4, borderLeftColor: '#e2e8f0',
  },
  activeMeetingCard: { borderLeftColor: '#dc2626' },

  meetingHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  leftHead: { flex: 1, marginRight: 12 },
  meetingTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 4 },

  statusWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#6b7280' },
  statusText: { fontSize: 12, fontWeight: '900' },

  rightBadges: { alignItems: 'flex-end', gap: 6 },
  categoryBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  categoryText: { fontSize: 12, fontWeight: '800', color: '#fff' },

  priorityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  priorityText: { fontSize: 10, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },

  desc: { fontSize: 14, color: '#6b7280', lineHeight: 20, marginBottom: 12 },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  infoText: { fontSize: 14, color: '#6b7280', flex: 1 },

  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  startBtn: { flexDirection: 'row', gap: 6, backgroundColor: '#059669', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, alignItems: 'center' },
  startBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  endBtn: { flexDirection: 'row', gap: 6, backgroundColor: '#dc2626', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, alignItems: 'center' },
  endBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  followBtn: { flex: 1, flexDirection: 'row', gap: 6, borderWidth: 1, borderColor: '#bbf7d0', backgroundColor: '#f0fdf4', paddingVertical: 10, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  followBtnText: { color: '#059669', fontWeight: '800', fontSize: 14 },
  notesBtn: { flex: 1, flexDirection: 'row', gap: 6, borderWidth: 1, borderColor: '#bfdbfe', backgroundColor: '#eff6ff', paddingVertical: 10, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  notesBtnText: { color: '#1e40af', fontWeight: '800', fontSize: 14 },

  noTodos: { alignItems: 'center', paddingVertical: 48 },
  noTodosText: { fontSize: 18, fontWeight: '900', color: '#0f172a', marginBottom: 8 },
  noTodosSubtext: { fontSize: 14, color: '#9ca3af', textAlign: 'center', marginBottom: 24 },
  createFirstButton: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 10, backgroundColor: '#e0ecff', gap: 8, borderWidth: 1, borderColor: '#c7d2fe'
  },
  createFirstButtonText: { fontSize: 14, fontWeight: '900', color: '#1e3a8a' },

  /* Modals */
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1f2937' },
  modalBody: { padding: 20 },
  modalSubtitle: { fontSize: 14, color: '#6b7280', marginBottom: 12 },

  notesInput: { minHeight: 160, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, padding: 12, fontSize: 16, color: '#1f2937' },
  /* Saved notes preview */
  savedNotesBox: { marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e5e7eb' },
  savedNotesLabel: { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 6 },
  savedNotesText: { fontSize: 14, color: '#374151', lineHeight: 20 },

  modalFooterRow: { padding: 20, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  primaryBtn: {
    flexDirection: 'row', gap: 8, backgroundColor: '#1e40af',
    justifyContent: 'center', alignItems: 'center',
    paddingVertical: 12, borderRadius: 10, marginTop: 8,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  /* Date picker overlay (custom follow-up calendar) */
  datePickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  datePickerCard: {
    width: '90%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.25, shadowOffset: { width: 0, height: 8 }, shadowRadius: 16, elevation: 12,
  },
  dateHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  monthBtn: { width: 40, height: 40, backgroundColor: '#f1f5f9', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  monthBtnText: { fontSize: 20, fontWeight: '800', color: '#1e40af' },
  monthTitle: { fontSize: 16, fontWeight: '800', color: '#1f2937' },

  weekHeader: { flexDirection: 'row', marginBottom: 8 },
  weekHeadCell: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700', color: '#6b7280', paddingVertical: 4 },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 10, marginBottom: 6 },
  todayCell: { backgroundColor: '#e0ecff' },
  gridText: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  todayText: { color: '#1e40af', fontWeight: '800' },
  cancelPickerBtn: { marginTop: 8, alignSelf: 'center' },
  cancelPickerText: { color: '#1e40af', fontWeight: '800' },

  /* Follow-up form */
  formGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 16, color: '#1f2937', backgroundColor: '#fff',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  formRow: { flexDirection: 'row', gap: 12 },
  selector: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 12, gap: 8, backgroundColor: '#fff',
  },
  selectorText: { fontSize: 16, color: '#1f2937', flex: 1 },
  selectorTextInput: { fontSize: 16, color: '#1f2937', flex: 1 },
});