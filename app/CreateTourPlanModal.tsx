// components/CreateTourPlanModal.tsx
import {
    Calendar,
    Car,
    Clock,
    Plane,
    Save,
    Train,
    X
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Modal, SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export type TourPlanForm = {
  title: string;
  destination: string;
  startDate: string;     // YYYY-MM-DD
  endDate: string;       // YYYY-MM-DD
  startTime: string;     // "9:00 AM"
  endTime: string;       // "5:00 PM"
  purpose: string;
  travelMode: 'Car' | 'Flight' | 'Train' | 'Helicopter';
  category: string;
  estimatedBudget: string;
  accompaniedBy: string; // comma separated
  accommodation: string;
  specialRequirements: string;
};

type Props = {
  visible: boolean;
  mode: 'create' | 'edit';
  onClose: () => void;
  onSubmit: (form: TourPlanForm) => Promise<void> | void;
  initial?: Partial<TourPlanForm>;
  submitLabel?: string;
  categories?: string[];
  loading?: boolean;
};

const travelModes = ['Car', 'Flight', 'Train', 'Helicopter'] as const;

const defaultCategories = [
  'Official Visit',
  'District Visit',
  'Inspection Tour',
  'Public Event',
];

const ymd = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const isValidDateStr = (s?: string) => !!s && !Number.isNaN(new Date(s).getTime());
const fmt = (s?: string) =>
  isValidDateStr(s)
    ? new Date(s!).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    : 'Select date';

export default function CreateTourPlanModal({
  visible,
  mode,
  onClose,
  onSubmit,
  initial,
  submitLabel,
  categories = defaultCategories,
  loading,
}: Props) {

  // Build a fresh form object from props (used on mount & when opening)
  const buildInitialForm = (seed?: Partial<TourPlanForm>): TourPlanForm => {
    const safeCategory =
      (seed?.category && categories.includes(seed.category) ? seed.category : categories[0]) || categories[0];

    const safeTravelMode =
      (seed?.travelMode as TourPlanForm['travelMode']) ?? 'Car';

    return {
      title: seed?.title ?? '',
      destination: seed?.destination ?? '',
      startDate: seed?.startDate ?? '',
      endDate: seed?.endDate ?? '',
      startTime: seed?.startTime ?? '9:00 AM',
      endTime: seed?.endTime ?? '5:00 PM',
      purpose: seed?.purpose ?? '',
      travelMode: safeTravelMode,
      category: safeCategory,
      estimatedBudget: seed?.estimatedBudget ?? '',
      accompaniedBy: seed?.accompaniedBy ?? '',
      accommodation: seed?.accommodation ?? '',
      specialRequirements: seed?.specialRequirements ?? '',
    };
  };

  const [form, setForm] = useState<TourPlanForm>(buildInitialForm(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'start' | 'end'>('start');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // 🔁 Rehydrate the form whenever the modal becomes visible,
  // or when mode/initial/categories change.
  useEffect(() => {
    if (visible) {
      setForm(buildInitialForm(initial));
      setErrors({});
      // default the embedded calendar to whichever date we’re picking, if present
      const pick = (datePickerMode === 'end' ? form.endDate : form.startDate);
      setSelectedDate(isValidDateStr(pick) ? new Date(pick) : new Date());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, mode, initial, categories]);

  const months = useMemo(
    () => ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    []
  );

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days: { day: string | ''; isCurrentMonth: boolean; date: number | null }[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push({ day: '', isCurrentMonth: false, date: null });
    for (let day = 1; day <= daysInMonth; day++) days.push({ day: String(day), isCurrentMonth: true, date: day });
    return days;
  };
  const days = getDaysInMonth(selectedDate);

  const navigateMonthForm = (dir: 'prev' | 'next') => {
    const d = new Date(selectedDate);
    d.setMonth(d.getMonth() + (dir === 'prev' ? -1 : 1));
    setSelectedDate(d);
  };

  const handleDateSelectForm = (date: Date) => {
    const val = ymd(date);
    if (datePickerMode === 'start') updateField('startDate', val);
    else updateField('endDate', val);
    setShowDatePicker(false);
  };

  const updateField = (field: keyof TourPlanForm, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.destination.trim()) errs.destination = 'Destination is required';
    if (!form.startDate) errs.startDate = 'Start date is required';
    if (!form.endDate) errs.endDate = 'End date is required';
    if (isValidDateStr(form.startDate) && isValidDateStr(form.endDate)) {
      if (new Date(form.endDate) < new Date(form.startDate)) errs.endDate = 'End date must be after start date';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const getTravelIcon = (mode: string, active = false) => {
    const color = active ? '#ffffff' : '#1e40af';
    switch (mode) {
      case 'Flight': return <Plane size={16} color={color} />;
      case 'Train': return <Train size={16} color={color} />;
      case 'Car': return <Car size={16} color={color} />;
      default: return <Car size={16} color={color} />;
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    await onSubmit(form);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{mode === 'edit' ? 'Edit Tour Plan' : 'Create Tour Plan'}</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
          {/* Basic Information */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tour Title *</Text>
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                placeholder="e.g., Infrastructure Review Tour"
                value={form.title}
                onChangeText={(t) => updateField('title', t)}
                placeholderTextColor="#9ca3af"
              />
              {!!errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Destination *</Text>
              <TextInput
                style={[styles.input, errors.destination && styles.inputError]}
                placeholder="e.g., Sambalpur, Jharsuguda, Sundargarh"
                value={form.destination}
                onChangeText={(t) => updateField('destination', t)}
                placeholderTextColor="#9ca3af"
              />
              {!!errors.destination && <Text style={styles.errorText}>{errors.destination}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Purpose</Text>
              <TextInput
                style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                placeholder="Describe the purpose"
                value={form.purpose}
                onChangeText={(t) => updateField('purpose', t)}
                multiline
                numberOfLines={3}
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          {/* Schedule */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Schedule</Text>

            <View style={styles.scheduleContainer}>
              {/* Start */}
              <View style={styles.scheduleCard}>
                <View style={styles.scheduleCardHeader}>
                  <View style={styles.scheduleIconContainer}>
                    <Calendar size={18} color="#059669" />
                  </View>
                  <Text style={styles.scheduleCardTitle}>Departure</Text>
                </View>

                <TouchableOpacity
                  style={[styles.dateSelector, errors.startDate && styles.inputError]}
                  onPress={() => { setDatePickerMode('start'); setShowDatePicker(true); }}
                >
                  <View style={styles.dateSelectorContent}>
                    <Calendar size={16} color="#6b7280" />
                    <Text style={[styles.dateSelectorText, !form.startDate && styles.placeholderText]}>
                      {fmt(form.startDate)}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.timeInputWrapper}>
                  <View style={styles.timeInputIcon}><Clock size={16} color="#6b7280" /></View>
                  <TextInput
                    style={styles.customTimeInput}
                    placeholder="9:00 AM"
                    value={form.startTime}
                    onChangeText={(t) => updateField('startTime', t)}
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                {!!errors.startDate && <Text style={styles.scheduleErrorText}>{errors.startDate}</Text>}
              </View>

              {/* Arrow + End */}
              <View style={styles.arrowSeparator}><View style={styles.arrowLine} /><View style={styles.arrowHead} /></View>

              <View style={styles.scheduleCard}>
                <View style={styles.scheduleCardHeader}>
                  <View style={[styles.scheduleIconContainer, { backgroundColor: '#dc262615' }]}>
                    <Calendar size={18} color="#dc2626" />
                  </View>
                  <Text style={styles.scheduleCardTitle}>Return</Text>
                </View>

                <TouchableOpacity
                  style={[styles.dateSelector, errors.endDate && styles.inputError]}
                  onPress={() => { setDatePickerMode('end'); setShowDatePicker(true); }}
                >
                  <View style={styles.dateSelectorContent}>
                    <Calendar size={16} color="#6b7280" />
                    <Text style={[styles.dateSelectorText, !form.endDate && styles.placeholderText]}>
                      {fmt(form.endDate)}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.timeInputWrapper}>
                  <View style={styles.timeInputIcon}><Clock size={16} color="#6b7280" /></View>
                  <TextInput
                    style={styles.customTimeInput}
                    placeholder="5:00 PM"
                    value={form.endTime}
                    onChangeText={(t) => updateField('endTime', t)}
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                {!!errors.endDate && <Text style={styles.scheduleErrorText}>{errors.endDate}</Text>}
              </View>
            </View>
          </View>

          {/* Travel + Category */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Travel Details</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Travel Mode</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
                {travelModes.map((mode) => {
                  const active = form.travelMode === mode;
                  return (
                    <TouchableOpacity
                      key={mode}
                      style={[styles.optionChip, active && styles.selectedOptionChip]}
                      onPress={() => updateField('travelMode', mode)}
                    >
                      {getTravelIcon(mode, active)}
                      <Text style={[styles.optionChipText, active && styles.selectedOptionChipText]}>{mode}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
                {categories.map((c) => {
                  const active = form.category === c;
                  return (
                    <TouchableOpacity
                      key={c}
                      style={[styles.categoryChip, active && styles.selectedCategoryChip]}
                      onPress={() => updateField('category', c)}
                    >
                      <Text style={[styles.categoryChipText, active && styles.selectedCategoryChipText]}>{c}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Estimated Budget</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., ₹2,50,000"
                value={form.estimatedBudget}
                onChangeText={(t) => updateField('estimatedBudget', t)}
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          {/* Additional */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Additional Details</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Accompanied By</Text>
              <TextInput
                style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]}
                placeholder="Comma-separated names"
                value={form.accompaniedBy}
                onChangeText={(t) => updateField('accompaniedBy', t)}
                multiline
                numberOfLines={2}
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Accommodation</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Hotel Sheetal, Sambalpur"
                value={form.accommodation}
                onChangeText={(t) => updateField('accommodation', t)}
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Special Requirements</Text>
              <TextInput
                style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                placeholder="Any special arrangements or requirements"
                value={form.specialRequirements}
                onChangeText={(t) => updateField('specialRequirements', t)}
                multiline
                numberOfLines={3}
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={!!loading}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={!!loading}>
            <Save size={16} color="#ffffff" />
            <Text style={styles.submitButtonText}>
              {submitLabel ?? (mode === 'edit' ? 'Save Changes' : 'Create Tour Plan')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Inline date picker (custom) */}
      <Modal visible={showDatePicker} transparent animationType="fade">
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerContainer}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>Select {datePickerMode === 'start' ? 'Departure' : 'Return'} Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}><X size={24} color="#6b7280" /></TouchableOpacity>
            </View>

            <View style={styles.monthNavigation}>
              <TouchableOpacity onPress={() => navigateMonthForm('prev')} style={styles.navButton}><Text style={styles.navButtonText}>‹</Text></TouchableOpacity>
              <Text style={styles.monthText}>{months[selectedDate.getMonth()]} {selectedDate.getFullYear()}</Text>
              <TouchableOpacity onPress={() => navigateMonthForm('next')} style={styles.navButton}><Text style={styles.navButtonText}>›</Text></TouchableOpacity>
            </View>

            <View style={styles.calendarContainer}>
              <View style={styles.weekHeader}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <Text key={d} style={styles.dayHeader}>{d}</Text>)}
              </View>
              <View style={styles.calendar}>
                {days.map((day, idx) => {
                  const d = day.date ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day.date) : null;
                  const isTodayCell = d && d.toDateString() === new Date().toDateString();
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.dayCell, !day.isCurrentMonth && styles.inactiveDayCell, isTodayCell && styles.todayDayCell]}
                      disabled={!day.isCurrentMonth}
                      onPress={() => d && handleDateSelectForm(d)}
                    >
                      <Text style={[styles.dayText, !day.isCurrentMonth && styles.inactiveDayText, isTodayCell && styles.todayDayText]}>
                        {day.day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

/* Local styles unchanged ... */
const styles = StyleSheet.create({
  modalContainer: { flex: 1, backgroundColor: '#ffffff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  modalContent: { flex: 1, paddingHorizontal: 20, paddingVertical: 16 },

  formSection: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 16 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#1f2937' },
  inputError: { borderColor: '#dc2626', backgroundColor: '#fef2f2' },
  errorText: { fontSize: 12, color: '#dc2626', marginTop: 4, marginLeft: 4 },

  scheduleContainer: { gap: 16 },
  scheduleCard: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  scheduleCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  scheduleIconContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#05966915', justifyContent: 'center', alignItems: 'center' },
  scheduleCardTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
  dateSelector: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, padding: 16, marginBottom: 12 },
  dateSelectorContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateSelectorText: { fontSize: 16, fontWeight: '600', color: '#1f2937', flex: 1 },
  placeholderText: { color: '#9ca3af', fontWeight: '400' },
  timeInputWrapper: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  timeInputIcon: { marginRight: 12 },
  customTimeInput: { flex: 1, fontSize: 16, fontWeight: '500', color: '#1f2937' },
  scheduleErrorText: { fontSize: 12, color: '#dc2626', marginTop: 8, marginLeft: 4 },
  arrowSeparator: { alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  arrowLine: { width: 2, height: 20, backgroundColor: '#d1d5db', marginBottom: 4 },
  arrowHead: { width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#d1d5db' },

  optionsScroll: { flexDirection: 'row' },
  optionChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0', gap: 6 },
  selectedOptionChip: { backgroundColor: '#1e40af', borderColor: '#1e40af' },
  optionChipText: { fontSize: 14, fontWeight: '500', color: '#6b7280' },
  selectedOptionChipText: { color: '#ffffff' },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  selectedCategoryChip: { backgroundColor: '#059669', borderColor: '#059669' },
  categoryChipText: { fontSize: 14, fontWeight: '500', color: '#6b7280' },
  selectedCategoryChipText: { color: '#ffffff' },

  modalFooter: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0', gap: 12 },
  cancelButton: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#f3f4f6', alignItems: 'center' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#6b7280' },
  submitButton: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, backgroundColor: '#1e40af', gap: 8 },
  submitButtonText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },

  /* Embedded date picker styles */
  datePickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  datePickerContainer: { backgroundColor: '#ffffff', borderRadius: 20, padding: 24, margin: 20, width: '90%', maxWidth: 400 },
  datePickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  datePickerTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
  monthNavigation: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  navButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20, backgroundColor: '#f1f5f9' },
  navButtonText: { fontSize: 20, fontWeight: '600', color: '#1e40af' },
  monthText: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
  calendarContainer: { backgroundColor: '#ffffff' },
  weekHeader: { flexDirection: 'row', marginBottom: 16 },
  dayHeader: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: '#6b7280', paddingVertical: 8 },
  calendar: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderRadius: 8 },
  inactiveDayCell: { opacity: 0.3 },
  todayDayCell: { backgroundColor: '#1e40af' },
  dayText: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  inactiveDayText: { color: '#9ca3af' },
  todayDayText: { color: '#ffffff' },
});