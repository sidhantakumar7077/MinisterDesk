// components/CreateTourPlanModal.tsx
import DateTimePicker, { AndroidNativeProps, IOSNativeProps } from '@react-native-community/datetimepicker';
import {
  Calendar, Car, Clock, Plane, Save, Train, X
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  SafeAreaView, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View
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
  accompaniedBy: string; // comma separated
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
const fmtDate = (s?: string) =>
  isValidDateStr(s)
    ? new Date(s!).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    : 'Select date';

const fmtTime = (t?: string) => t?.trim() || 'Select time';

// parse "h:mm AM" into a Date (today's date)
const parseTimeToDate = (timeStr: string) => {
  // default 9:00 AM
  const base = new Date();
  const m = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  let hours = 9, minutes = 0, ampm: string | undefined = 'AM';
  if (m) {
    hours = Number(m[1]);
    minutes = Number(m[2]);
    ampm = m[3].toUpperCase();
  }
  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  const d = new Date(base);
  d.setHours(hours, minutes, 0, 0);
  return d;
};

// format Date -> "h:mm AM"
const formatTime12h = (d: Date) => {
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  const mm = String(m).padStart(2, '0');
  return `${h}:${mm} ${ampm}`;
};

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
      accompaniedBy: seed?.accompaniedBy ?? '',
    };
  };

  const [form, setForm] = useState<TourPlanForm>(buildInitialForm(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});

  // unified DateTimePicker state
  type PickerTarget = 'startDate' | 'endDate' | 'startTime' | 'endTime' | null;
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [pickerValue, setPickerValue] = useState<Date>(new Date());

  // Hydrate form when modal opens
  useEffect(() => {
    if (visible) {
      const newForm = buildInitialForm(initial);
      setForm(newForm);
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, mode, initial, categories]);

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

  // ---- DateTimePicker handlers ----
  const openPicker = (target: PickerTarget) => {
    if (!target) return;
    let mode: 'date' | 'time' = (target === 'startDate' || target === 'endDate') ? 'date' : 'time';

    // current value to seed picker
    let current = new Date();
    if (target === 'startDate' && isValidDateStr(form.startDate)) current = new Date(form.startDate);
    if (target === 'endDate' && isValidDateStr(form.endDate)) current = new Date(form.endDate);
    if (target === 'startTime') current = parseTimeToDate(form.startTime || '9:00 AM');
    if (target === 'endTime') current = parseTimeToDate(form.endTime || '5:00 PM');

    setPickerTarget(target);
    setPickerMode(mode);
    setPickerValue(current);
    setPickerVisible(true);
  };

  const onChangePicker: AndroidNativeProps['onChange'] & IOSNativeProps['onChange'] = (e, selected) => {
    // For Android: user can press "dismiss"
    if (Platform.OS === 'android') {
      setPickerVisible(false);
    }
    if (!selected || !pickerTarget) return;

    if (pickerTarget === 'startDate' || pickerTarget === 'endDate') {
      updateField(pickerTarget, ymd(selected));
    } else if (pickerTarget === 'startTime' || pickerTarget === 'endTime') {
      updateField(pickerTarget, formatTime12h(selected));
    }

    if (Platform.OS === 'ios') {
      // keep visible for iOS inline modal; you could add a toolbar if desired
      setPickerValue(selected);
    }
  };

  const months = useMemo(
    () => ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    []
  );

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

                {/* Start Date */}
                <TouchableOpacity
                  style={[styles.dateSelector, errors.startDate && styles.inputError]}
                  onPress={() => openPicker('startDate')}
                >
                  <View style={styles.dateSelectorContent}>
                    <Calendar size={16} color="#6b7280" />
                    <Text style={[styles.dateSelectorText, !form.startDate && styles.placeholderText]}>
                      {fmtDate(form.startDate)}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Start Time */}
                <View style={styles.timeInputWrapper}>
                  <View style={styles.timeInputIcon}><Clock size={16} color="#6b7280" /></View>
                  <TouchableOpacity style={{ flex: 1 }} onPress={() => openPicker('startTime')}>
                    <Text style={[styles.customTimeInput, !form.startTime && styles.placeholderText]}>
                      {fmtTime(form.startTime)}
                    </Text>
                  </TouchableOpacity>
                </View>

                {!!errors.startDate && <Text style={styles.scheduleErrorText}>{errors.startDate}</Text>}
              </View>

              {/* Arrow + End */}
              <View style={styles.arrowSeparator}><View style={styles.arrowLine} /><View style={styles.arrowHead} /></View>

              {/* End */}
              <View style={styles.scheduleCard}>
                <View style={styles.scheduleCardHeader}>
                  <View style={[styles.scheduleIconContainer, { backgroundColor: '#dc262615' }]}>
                    <Calendar size={18} color="#dc2626" />
                  </View>
                  <Text style={styles.scheduleCardTitle}>Return</Text>
                </View>

                {/* End Date */}
                <TouchableOpacity
                  style={[styles.dateSelector, errors.endDate && styles.inputError]}
                  onPress={() => openPicker('endDate')}
                >
                  <View style={styles.dateSelectorContent}>
                    <Calendar size={16} color="#6b7280" />
                    <Text style={[styles.dateSelectorText, !form.endDate && styles.placeholderText]}>
                      {fmtDate(form.endDate)}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* End Time */}
                <View style={styles.timeInputWrapper}>
                  <View style={styles.timeInputIcon}><Clock size={16} color="#6b7280" /></View>
                  <TouchableOpacity style={{ flex: 1 }} onPress={() => openPicker('endTime')}>
                    <Text style={[styles.customTimeInput, !form.endTime && styles.placeholderText]}>
                      {fmtTime(form.endTime)}
                    </Text>
                  </TouchableOpacity>
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

      {/* System Date/Time Picker */}
      {pickerVisible && (
        <DateTimePicker
          value={pickerValue}
          mode={pickerMode}
          onChange={onChangePicker}
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          // 12-hour clock where supported
          is24Hour={false}
        // Ensure min date for endDate if you want (optional):
        // minimumDate={pickerTarget === 'endDate' && isValidDateStr(form.startDate) ? new Date(form.startDate) : undefined}
        />
      )}
    </Modal>
  );
}

/* Styles unchanged except removed custom calendar styles */
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
});