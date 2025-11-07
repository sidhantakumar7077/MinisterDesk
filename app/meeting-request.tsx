import React, { useMemo, useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  DeviceEventEmitter,
} from 'react-native';
import { ArrowLeft, Calendar, Clock, /* Users, */ FileText, Send, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from './config';

export default function MeetingRequestScreen() {
  const params = useLocalSearchParams();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');              // YYYY-MM-DD
  const [time, setTime] = useState('');              // e.g., 10:00 AM

  // --- Requested By (commented out per your request) ---
  // const [requester, setRequester] = useState((params.prefillName as string) || '');

  const [purpose, setPurpose] = useState((params.prefillPurpose as string) || '');
  const [loading, setLoading] = useState(false);

  // Date/Time pickers
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState<Date>(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Auto-fill organization -> title
  useEffect(() => {
    if (params.prefillOrganization && params.prefillName) {
      setTitle(`Meeting with ${params.prefillName}`);
      // setRequester(String(params.prefillName)); // (commented out)
    }
  }, [params]);

  /* ---------- Calendar helpers ---------- */
  const months = useMemo(
    () => ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    []
  );
  const daysOfWeek = useMemo(() => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], []);
  const getDaysGrid = (d: Date) => {
    const year = d.getFullYear();
    const month = d.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const pad = first.getDay();           // 0=Sun..6=Sat
    const days = last.getDate();

    const cells: Array<{ label: string; inMonth: boolean; date?: Date }> = [];
    // leading blanks
    for (let i = 0; i < pad; i++) cells.push({ label: '', inMonth: false });
    // days
    for (let dnum = 1; dnum <= days; dnum++) {
      const theDate = new Date(year, month, dnum);
      cells.push({ label: String(dnum), inMonth: true, date: theDate });
    }
    return cells;
  };
  const daysGrid = getDaysGrid(pickerMonth);
  const goMonth = (dir: 'prev' | 'next') => {
    const n = new Date(pickerMonth);
    n.setMonth(pickerMonth.getMonth() + (dir === 'prev' ? -1 : 1));
    setPickerMonth(n);
  };
  const onPickDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setDate(`${y}-${m}-${dd}`);
    setShowDatePicker(false);
  };

  /* ---------- Time picker ---------- */
  const timeSlots = useMemo(() => {
    // 06:00 AM to 10:00 PM in 30-min steps
    const out: string[] = [];
    const toLabel = (mins: number) => {
      const h24 = Math.floor(mins / 60);
      const m = mins % 60;
      const ampm = h24 < 12 ? 'AM' : 'PM';
      const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
      return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
    };
    const start = 6 * 60;
    const end = 22 * 60;
    for (let t = start; t <= end; t += 30) out.push(toLabel(t));
    return out;
  }, []);
  const onPickTime = (label: string) => {
    setTime(label);
    setShowTimePicker(false);
  };

  /* ---------- Submit ---------- */
  async function handleSubmit() {
    // requester removed from required fields
    if (!title || !date || !time) {
      Alert.alert('Missing Information', 'Please fill in Title, Date and Time.');
      return;
    }
    try {
      setLoading(true);

      // Insert into your `meetings` table (meeting_date & meeting_time)
      const { error } = await supabase.from('meetings').insert({
        title,
        description: purpose || null,
        meeting_date: date,         // DATE column
        meeting_time: time,         // TEXT column (e.g., "10:00 AM")
        status: 'upcoming',
        category: 'Administrative',
        location: 'TBD',
        attendees: [],
        // requested_by: requester, // (commented out)
      });

      if (error) throw error;

      // 🔔 Tell the Meetings page to refresh
      DeviceEventEmitter.emit('meetings:refresh');

      setTitle('');
      setDate('');
      setTime('');
      // setRequester(''); // (commented out)
      setPurpose('');
      router.back();

      // Alert.alert('Request Submitted', 'Meeting request has been submitted.', [
      //   {
      //     text: 'OK',
      //     onPress: () => {
      //       setTitle('');
      //       setDate('');
      //       setTime('');
      //       // setRequester(''); // (commented out)
      //       setPurpose('');
      //       router.back();
      //     },
      //   },
      // ]);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Unable to submit meeting request.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#1e40af" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Meeting</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Meeting Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Meeting Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Budget Discussion"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date *</Text>
            <TouchableOpacity
              style={styles.inputWithIcon}
              onPress={() => {
                setPickerMonth(date ? new Date(date) : new Date());
                setShowDatePicker(true);
              }}
            >
              <Calendar size={20} color="#6b7280" />
              <Text style={[styles.iconInput, { color: date ? '#1f2937' : '#9ca3af' }]}>
                {date
                  ? new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                  : 'Select date'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Time */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Time *</Text>
            <TouchableOpacity style={styles.inputWithIcon} onPress={() => setShowTimePicker(true)}>
              <Clock size={20} color="#6b7280" />
              <Text style={[styles.iconInput, { color: time ? '#1f2937' : '#9ca3af' }]}>
                {time || 'Select time'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Requested By (commented out) */}
          {/*
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Requested By *</Text>
            <View style={styles.inputWithIcon}>
              <Users size={20} color="#6b7280" />
              <TextInput
                style={styles.iconInput}
                placeholder="Name and Department"
                value={requester}
                onChangeText={setRequester}
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>
          */}

          {/* Purpose */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Purpose (Optional)</Text>
            <View style={styles.inputWithIcon}>
              <FileText size={20} color="#6b7280" />
              <TextInput
                style={[styles.iconInput, styles.textArea]}
                placeholder="Brief description of meeting purpose"
                value={purpose}
                onChangeText={setPurpose}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Send size={20} color="#ffffff" />}
            <Text style={styles.submitButtonText}>{loading ? 'Submitting...' : 'Submit Request'}</Text>
          </TouchableOpacity>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Quick Submission</Text>
            <Text style={styles.infoText}>
              This form allows you to quickly submit meeting requests on behalf of the Minister.
              All requests will be reviewed and added to the calendar upon approval.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* DATE PICKER MODAL */}
      <Modal visible={showDatePicker} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.pickerCard}>
            {/* Header */}
            <View style={styles.pickerHeader}>
              <TouchableOpacity style={styles.monthBtn} onPress={() => goMonth('prev')}>
                <ChevronLeft size={20} color="#1e40af" />
              </TouchableOpacity>
              <Text style={styles.monthTitle}>
                {months[pickerMonth.getMonth()]} {pickerMonth.getFullYear()}
              </Text>
              <TouchableOpacity style={styles.monthBtn} onPress={() => goMonth('next')}>
                <ChevronRight size={20} color="#1e40af" />
              </TouchableOpacity>
            </View>

            {/* Week header */}
            <View style={styles.weekRow}>
              {daysOfWeek.map((d) => (
                <Text key={d} style={styles.weekDay}>
                  {d}
                </Text>
              ))}
            </View>

            {/* Days grid */}
            <View style={styles.grid}>
              {daysGrid.map((cell, idx) => {
                const isToday =
                  cell.inMonth && cell.date && cell.date.toDateString() === new Date().toDateString();
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.dayCell,
                      !cell.inMonth && { opacity: 0.3 },
                      isToday && { backgroundColor: '#e0e7ff' },
                    ]}
                    disabled={!cell.inMonth}
                    onPress={() => cell.date && onPickDate(cell.date)}
                  >
                    <Text style={styles.dayLabel}>{cell.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.closePickerBtn} onPress={() => setShowDatePicker(false)}>
              <Text style={styles.closePickerText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* TIME PICKER MODAL */}
      <Modal visible={showTimePicker} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.timeCard}>
            <Text style={styles.timeTitle}>Select Time</Text>
            <ScrollView style={{ maxHeight: 380 }}>
              {timeSlots.map((slot) => (
                <TouchableOpacity key={slot} style={styles.timeRow} onPress={() => onPickTime(slot)}>
                  <Clock size={16} color="#1e40af" />
                  <Text style={styles.timeText}>{slot}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closePickerBtn} onPress={() => setShowTimePicker(false)}>
              <Text style={styles.closePickerText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* -------------------- styles -------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 24, backgroundColor: '#ffffff',
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  backButton: {
    width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20, backgroundColor: '#f1f5f9',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  placeholder: { width: 40 },

  form: { padding: 20 },
  subtitle: { fontSize: 16, color: '#6b7280', marginBottom: 24, textAlign: 'center' },

  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },

  input: {
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#1f2937',
  },
  inputWithIcon: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#d1d5db',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  iconInput: { flex: 1, fontSize: 16 },

  textArea: { minHeight: 80, paddingTop: 12 },

  submitButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1e40af', borderRadius: 12, paddingVertical: 16, marginTop: 20, gap: 8,
    shadowColor: '#1e40af', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
  submitButtonText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },

  infoCard: {
    backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginTop: 24,
    borderLeftWidth: 4, borderLeftColor: '#1e40af',
  },
  infoTitle: { fontSize: 14, fontWeight: '600', color: '#1f2937', marginBottom: 8 },
  infoText: { fontSize: 14, color: '#6b7280', lineHeight: 20 },

  /* Pickers */
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 20,
  },

  pickerCard: {
    width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 16, padding: 16,
  },
  pickerHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12,
  },
  monthBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center',
  },
  monthTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
  weekRow: { flexDirection: 'row', marginTop: 8, marginBottom: 8 },
  weekDay: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700', color: '#6b7280' },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center',
    borderRadius: 10,
  },
  dayLabel: { fontSize: 16, fontWeight: '600', color: '#1f2937' },

  closePickerBtn: {
    marginTop: 12, alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#f1f5f9',
  },
  closePickerText: { color: '#1e40af', fontWeight: '700' },

  timeCard: {
    width: '100%', maxWidth: 380, backgroundColor: '#fff', borderRadius: 16, padding: 16,
  },
  timeTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 12 },
  timeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 8,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  timeText: { fontSize: 16, color: '#1f2937', fontWeight: '600' },
});