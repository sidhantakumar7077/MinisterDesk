// app/(tabs)/tour-plan.tsx
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Calendar,
  Car,
  ChevronLeft, ChevronRight,
  Edit,
  MapPin, Plane,
  Plus,
  Train,
  Trash2,
  User
} from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';
import { supabase } from '../config';
import CreateTourPlanModal, { TourPlanForm } from '../CreateTourPlanModal';

type TourPlan = {
  id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  purpose: string | null;
  travel_mode: 'Car' | 'Flight' | 'Train' | 'Helicopter';
  status: 'planned' | 'confirmed' | 'cancelled' | 'completed';
  category: string | null;
  // estimated_budget: string | null;
  accompanied_by: string[] | null;
  // accommodation: string | null;
  // special_requirements: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

const categories = ['Official Visit', 'District Visit', 'Inspection Tour', 'Public Event'];

const showToast = (
  type: 'success' | 'error' | 'info',
  text1: string,
  text2?: string,
  onPress?: () => void
) => Toast.show({ type, text1, text2, position: 'bottom', onPress });

export default function TourPlanScreen() {
  // UI
  const [expandedTour, setExpandedTour] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 🔹 PAGE FILTER date state
  const [filterDate, setFilterDate] = useState<Date>(new Date());
  const isToday = filterDate.toDateString() === new Date().toDateString();

  // Custom calendar modal (kept)
  const [showCalendarFilter, setShowCalendarFilter] = useState(false);
  const [pickerMonth, setPickerMonth] = useState<Date>(new Date());
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Native date picker for filterDate selection
  const [showNativeDatePicker, setShowNativeDatePicker] = useState(false);

  // Data
  const [tours, setTours] = useState<TourPlan[]>([]);
  const [editing, setEditing] = useState<TourPlan | null>(null);

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  // For Undo delete
  const lastDeletedRef = useRef<TourPlan | null>(null);

  // helpers
  const months = useMemo(
    () => ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    []
  );

  const getTravelIcon = (mode: string) => {
    switch (mode) {
      case 'Flight': return <Plane size={16} color="#1e40af" />;
      case 'Train': return <Train size={16} color="#1e40af" />;
      case 'Car': return <Car size={16} color="#1e40af" />;
      default: return <Car size={16} color="#1e40af" />;
    }
  };

  const ymd = (d: Date) => {
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const isValidDateStr = (s?: string) => !!s && !Number.isNaN(new Date(s).getTime());
  const fmt = (s?: string) =>
    isValidDateStr(s)
      ? new Date(s!).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
      : 'Select date';

  // --- page calendar grid for filter ---
  const monthGrid = useMemo(() => {
    const first = new Date(pickerMonth.getFullYear(), pickerMonth.getMonth(), 1);
    const last = new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() + 1, 0);
    const lead = first.getDay();
    const total = last.getDate();
    const cells: { label: string; date?: Date; inactive?: boolean }[] = [];
    for (let i = 0; i < lead; i++) cells.push({ label: '', inactive: true });
    for (let d = 1; d <= total; d++) cells.push({ label: String(d), date: new Date(pickerMonth.getFullYear(), pickerMonth.getMonth(), d) });
    while (cells.length % 7 !== 0) cells.push({ label: '', inactive: true });
    return cells;
  }, [pickerMonth]);

  const calculateDuration = (startDate: string, endDate: string) => {
    if (!isValidDateStr(startDate) || !isValidDateStr(endDate)) return '';
    const s = new Date(startDate), e = new Date(endDate);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return 'Same day';
    if (diff === 1) return '1 day';
    return `${diff} days`;
  };

  // supabase
  async function fetchTours() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tour_plans')
        .select('*')
        .order('start_date', { ascending: true });
      if (error) throw error;
      setTours((data || []) as TourPlan[]);
    } catch (e: any) {
      showToast('error', 'Failed to load tours', e?.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(form: TourPlanForm) {
    const body = {
      title: form.title.trim(),
      destination: form.destination.trim(),
      start_date: form.startDate,
      end_date: form.endDate,
      start_time: form.startTime || null,
      end_time: form.endTime || null,
      purpose: form.purpose || null,
      travel_mode: form.travelMode,
      status: 'planned' as TourPlan['status'],
      category: form.category || null,
      // estimated_budget: form.estimatedBudget || null,
      accompanied_by: form.accompaniedBy ? form.accompaniedBy.split(',').map(s => s.trim()).filter(Boolean) : null,
      // accommodation: form.accommodation || null,
      // special_requirements: form.specialRequirements || null,
      created_by: (await supabase.auth.getUser()).data.user?.id ?? null,
    };
    const { error } = await supabase.from('tour_plans').insert([body]);
    if (error) {
      showToast('error', 'Could not create tour', error.message);
      return;
    }
    await fetchTours();
    setModalVisible(false);
    showToast('success', 'Tour plan created');
  }

  async function handleUpdate(id: string, form: TourPlanForm) {
    const body = {
      title: form.title.trim(),
      destination: form.destination.trim(),
      start_date: form.startDate,
      end_date: form.endDate,
      start_time: form.startTime || null,
      end_time: form.endTime || null,
      purpose: form.purpose || null,
      travel_mode: form.travelMode,
      category: form.category || null,
      // estimated_budget: form.estimatedBudget || null,
      accompanied_by: form.accompaniedBy ? form.accompaniedBy.split(',').map(s => s.trim()).filter(Boolean) : null,
      // accommodation: form.accommodation || null,
      // special_requirements: form.specialRequirements || null,
    };
    const { error } = await supabase.from('tour_plans').update(body).eq('id', id);
    if (error) {
      showToast('error', 'Could not save changes', error.message);
      return;
    }
    await fetchTours();
    setModalVisible(false);
    setEditing(null);
    showToast('success', 'Tour updated');
  }

  async function deleteTour(id: string) {
    const { error } = await supabase.from('tour_plans').delete().eq('id', id);
    if (error) {
      showToast('error', 'Delete failed', error.message);
      return;
    }
    fetchTours();
  }

  // Delete action with Undo (no Alert)
  const handleDeleteWithUndo = async (t: TourPlan) => {
    lastDeletedRef.current = t;
    // Optimistic remove
    setTours(prev => prev.filter(x => x.id !== t.id));
    const { error } = await supabase.from('tour_plans').delete().eq('id', t.id);
    if (error) {
      // rollback
      setTours(prev => [t, ...prev]);
      showToast('error', 'Delete failed', error.message);
      return;
    }
    showToast('info', 'Tour deleted', 'Tap to undo', async () => {
      if (!lastDeletedRef.current) return;
      const payload = {
        ...lastDeletedRef.current,
        created_at: undefined,
        updated_at: undefined,
        id: undefined as unknown as string, // let DB assign id
      };
      const { error: insErr, data } = await supabase
        .from('tour_plans')
        .insert([payload as any])
        .select('*')
        .single();
      if (insErr) {
        showToast('error', 'Undo failed', insErr.message);
      } else {
        setTours(prev => [data as TourPlan, ...prev]);
        showToast('success', 'Restored');
      }
      lastDeletedRef.current = null;
    });
  };

  useEffect(() => {
    fetchTours();
    const channel = supabase
      .channel('tour_plans-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tour_plans' }, () => fetchTours())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Refresh handler
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTours();
    setRefreshing(false);
  };

  // UI actions
  function openCreate() {
    setEditing(null);
    setModalMode('create');
    setModalVisible(true);
  }
  function openEdit(t: TourPlan) {
    setEditing(t);
    setModalMode('edit');
    setModalVisible(true);
  }

  // 🔎 Filter ONLY by start_date == selected filter day
  const filteredTours = useMemo(() => {
    return tours.filter(t => t.start_date?.slice(0, 10) === ymd(filterDate));
  }, [tours, filterDate]);

  // date nav handlers (page filter)
  const navigateFilterDate = (dir: 'prev' | 'next') => {
    const d = new Date(filterDate);
    d.setDate(d.getDate() + (dir === 'prev' ? -1 : 1));
    setFilterDate(d);
  };
  const resetFilterToToday = () => setFilterDate(new Date());

  return (
    <SafeAreaView style={styles.container}>
      {/* Gradient header */}
      <LinearGradient
        colors={['#eef2ff', '#ffffff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerWrap}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tour Plans</Text>
          <TouchableOpacity style={styles.addButton} onPress={openCreate}>
            <Plus size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Date Section */}
        <View style={styles.dateSection}>
          <View style={styles.dateNavigation}>
            <TouchableOpacity onPress={() => navigateFilterDate('prev')} style={styles.dateNavButton}>
              <ChevronLeft size={20} color="#1e40af" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateDisplay}
              onPress={() => setShowNativeDatePicker(true)}       // 👈 native picker
              onLongPress={() => {                                // 👈 hold to open custom calendar (optional)
                setPickerMonth(new Date(filterDate));
                setShowCalendarFilter(true);
              }}
            >
              <Calendar size={16} color="#1e40af" />
              <Text style={styles.dateText}>
                {isToday
                  ? 'Today'
                  : filterDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </Text>
              <Text style={styles.fullDateText}>
                {filterDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigateFilterDate('next')} style={styles.dateNavButton}>
              <ChevronRight size={20} color="#1e40af" />
            </TouchableOpacity>
          </View>

          <View style={styles.dateInfo}>
            <Text style={styles.dateInfoText}>
              {filteredTours.length} tour{filteredTours.length !== 1 ? 's' : ''} for this date
            </Text>
            {!isToday && (
              <TouchableOpacity onPress={resetFilterToToday} style={styles.todayButton}>
                <Text style={styles.todayButtonText}>Go to Today</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading && <View style={{ marginTop: 8, alignItems: 'center' }}><ActivityIndicator /></View>}
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1e40af" colors={['#1e40af']} progressViewOffset={8} />}
        contentContainerStyle={{ paddingBottom: 28 }}
      >
        {/* List (filtered by start_date) */}
        <View style={styles.toursList}>
          {filteredTours.map((tour) => (
            <View key={tour.id} style={styles.tourCard}>
              <View style={styles.tourHeader}>
                <View style={styles.tourTitleSection}>
                  <Text style={styles.tourTitle}>{tour.title}</Text>
                  <View style={styles.tourMeta}>
                    <MapPin size={14} color="#6b7280" />
                    <Text style={styles.tourDestination}>{tour.destination}</Text>
                  </View>
                </View>
              </View>

              {!!tour.purpose && <Text style={styles.tourPurpose}>{tour.purpose}</Text>}

              <View style={styles.tourDetails}>
                <View style={styles.detailRow}>
                  <Calendar size={16} color="#6b7280" />
                  <Text style={styles.detailText}>
                    {fmt(tour.start_date).replace(/, \d{4}$/, '')}
                    {' - '}
                    {fmt(tour.end_date).replace(/, \d{4}$/, '')}
                    {' '}({calculateDuration(tour.start_date, tour.end_date)})
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  {getTravelIcon(tour.travel_mode)}
                  <Text style={styles.expandedText}>{tour.category ?? '—'}</Text>
                </View>

                {!!tour.accompanied_by?.length && (
                  <View style={styles.detailRow}>
                    <User size={16} color="#6b7280" />
                    <Text style={styles.detailText}>
                      {tour.accompanied_by.length} accompanying • {tour.accompanied_by.join(', ')}
                    </Text>
                  </View>
                )}
              </View>

              {/* <TouchableOpacity
                style={styles.expandButton}
                onPress={() => setExpandedTour(expandedTour === tour.id ? null : tour.id)}
              >
                <Text style={styles.expandButtonText}>
                  {expandedTour === tour.id ? 'Show Less' : 'Show More Details'}
                </Text>
                {expandedTour === tour.id ? <ChevronUp size={16} color="#1e40af" /> : <ChevronDown size={16} color="#1e40af" />}
              </TouchableOpacity>

              {expandedTour === tour.id && (
                <View style={styles.expandedContent}>
                  {!!tour.accompanied_by?.length && (
                    <View style={styles.expandedSection}>
                      <Text style={styles.expandedSectionTitle}>Accompanying Team</Text>
                      <Text style={styles.expandedText}>{tour.accompanied_by.join(', ')}</Text>
                    </View>
                  )}
                </View>
              )} */}

              <View style={styles.tourActions}>
                <TouchableOpacity style={styles.editButton} onPress={() => openEdit(tour)}>
                  <Edit size={16} color="#059669" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editButton, { backgroundColor: '#fff0f0', borderColor: '#fecaca' }]}
                  onPress={() => handleDeleteWithUndo(tour)}
                >
                  <Trash2 size={16} color="#dc2626" />
                  <Text style={[styles.editButtonText, { color: '#dc2626' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {filteredTours.length === 0 && !loading && (
            <View style={styles.noTodos}>
              <Text style={styles.noTodosText}>No tour plan found</Text>
              <Text style={styles.noTodosSubtext}>Create your first tour or adjust your filters</Text>
              <TouchableOpacity style={styles.createFirstButton} onPress={openCreate}>
                <Plus size={16} color="#1e40af" />
                <Text style={styles.createFirstButtonText}>Create Tour Plan</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 🔹 Filter Calendar Modal (custom page date filter) */}
        <Modal visible={showCalendarFilter} transparent animationType="fade">
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

              <View style={styles.weekHeaderRow}>
                {daysOfWeek.map(d => <Text key={d} style={styles.weekHeadCell}>{d}</Text>)}
              </View>

              <View style={styles.grid}>
                {monthGrid.map((cell, idx) => {
                  const isTodayCell = cell.date && new Date().toDateString() === cell.date.toDateString();
                  const picked = cell.date && cell.date.toDateString() === filterDate.toDateString();

                  return (
                    <TouchableOpacity
                      key={idx}
                      disabled={cell.inactive}
                      style={[
                        styles.gridCell,
                        cell.inactive && { opacity: 0.25 },
                        isTodayCell && styles.todayCell,
                        picked && { backgroundColor: '#bbf7d0' },
                      ]}
                      onPress={() => {
                        if (cell.date) setFilterDate(cell.date);
                        setShowCalendarFilter(false);
                      }}
                    >
                      <Text style={[styles.gridText, isTodayCell && styles.todayText]}>{cell.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity style={styles.cancelPickerBtn} onPress={() => setShowCalendarFilter(false)}>
                <Text style={styles.cancelPickerText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>

      {/* Native Date Picker for page date filter */}
      {showNativeDatePicker && (
        <DateTimePicker
          mode="date"
          display="default"
          value={filterDate}
          onChange={(event: any, picked?: Date) => {
            // Android fires for dismiss too; iOS returns once.
            setShowNativeDatePicker(false);
            if (picked) {
              const next = new Date(filterDate);
              next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
              setFilterDate(next);
            }
          }}
        />
      )}

      {/* Reusable Create/Edit Modal */}
      <CreateTourPlanModal
        visible={modalVisible}
        mode={modalMode}
        onClose={() => { setModalVisible(false); setEditing(null); }}
        onSubmit={async (form) => {
          if (modalMode === 'edit' && editing) {
            await handleUpdate(editing.id, form);
          } else {
            await handleCreate(form);
          }
        }}
        initial={editing ? {
          title: editing.title,
          destination: editing.destination,
          startDate: editing.start_date,
          endDate: editing.end_date,
          startTime: editing.start_time ?? '9:00 AM',
          endTime: editing.end_time ?? '5:00 PM',
          purpose: editing.purpose ?? '',
          travelMode: editing.travel_mode,
          category: editing.category ?? categories[0],
          // estimatedBudget: editing.estimated_budget ?? '',
          accompaniedBy: (editing.accompanied_by ?? []).join(', '),
          // accommodation: editing.accommodation ?? '',
          // specialRequirements: editing.special_requirements ?? '',
        } : undefined}
        categories={categories}
      />

      {/* Toast portal */}
      <Toast />
    </SafeAreaView>
  );
}

/* Styles — aligned with Home/Tasks modern look */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  headerWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, borderBottomColor: '#e2e8f0', borderBottomWidth: 0.4, },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#0f172a' },
  addButton: {
    width: 46, height: 46, backgroundColor: '#1e40af', borderRadius: 23,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#1e40af', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 8,
  },

  /* Page Date Section (glassy card) */
  dateSection: {
    borderRadius: 16, padding: 12,
  },
  dateNavigation: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  dateNavButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  dateDisplay: {
    alignItems: 'center', backgroundColor: '#f8fafc', paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', gap: 8,
  },
  dateText: { fontSize: 18, fontWeight: '800', color: '#1e40af' },
  fullDateText: { fontSize: 12, color: '#64748b', marginLeft: 8 },
  dateInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  dateInfoText: { fontSize: 13, color: '#64748b' },
  todayButton: { backgroundColor: '#dbeafe', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  todayButtonText: { fontSize: 12, fontWeight: '800', color: '#1e40af' },

  /* List */
  toursList: { paddingHorizontal: 16, paddingTop: 10, gap: 14 },
  tourCard: {
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
  tourHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  tourTitleSection: { flex: 1, marginRight: 12 },
  tourTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  tourMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tourDestination: { fontSize: 14, color: '#6b7280', fontWeight: '700' },

  tourPurpose: { fontSize: 14, color: '#475569', lineHeight: 20, marginBottom: 12 },

  tourDetails: { gap: 8, marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 14, color: '#475569', flex: 1 },

  expandButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 4 },
  expandButtonText: { fontSize: 14, fontWeight: '800', color: '#1e40af' },
  expandedContent: { paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9', marginBottom: 8, gap: 16 },
  expandedSection: { gap: 6 },
  expandedSectionTitle: { fontSize: 14, fontWeight: '900', color: '#374151' },
  expandedText: { fontSize: 14, color: '#475569', lineHeight: 18 },

  tourActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  editButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#f0fdf4', paddingVertical: 12, borderRadius: 10, gap: 6,
    borderWidth: 1, borderColor: '#bbf7d0'
  },
  editButtonText: { fontSize: 14, fontWeight: '900', color: '#059669' },

  /* Filter calendar (page) */
  datePickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  datePickerCard: {
    width: '90%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.25, shadowOffset: { width: 0, height: 8 }, shadowRadius: 16, elevation: 12
  },
  dateHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  monthBtn: { width: 40, height: 40, backgroundColor: '#f1f5f9', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  monthBtnText: { fontSize: 20, fontWeight: '800', color: '#1e40af' },
  monthTitle: { fontSize: 16, fontWeight: '900', color: '#1f2937' },
  weekHeaderRow: { flexDirection: 'row', marginBottom: 8 },
  weekHeadCell: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '900', color: '#6b7280', paddingVertical: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 10, marginBottom: 6 },
  todayCell: { backgroundColor: '#e0ecff' },
  gridText: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  todayText: { color: '#1e40af', fontWeight: '900' },
  cancelPickerBtn: { marginTop: 8, alignSelf: 'center' },
  cancelPickerText: { color: '#1e40af', fontWeight: '800' },

  noTodos: { alignItems: 'center', paddingVertical: 48 },
  noTodosText: { fontSize: 18, fontWeight: '900', color: '#0f172a', marginBottom: 8 },
  noTodosSubtext: { fontSize: 14, color: '#9ca3af', textAlign: 'center', marginBottom: 24 },
  createFirstButton: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 10, backgroundColor: '#e0ecff', gap: 8, borderWidth: 1, borderColor: '#c7d2fe'
  },
  createFirstButtonText: { fontSize: 14, fontWeight: '900', color: '#1e3a8a' },
});