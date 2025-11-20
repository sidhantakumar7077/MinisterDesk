import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  MapPin,
  Send,
  Users,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { supabase } from './config';

// ---- helpers ----
function formatDateForDb(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`; // YYYY-MM-DD
}
function formatTimeLabel(d: Date) {
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`; // e.g. 10:30 AM
}
function parseTimeLabelToDate(label: string) {
  const [timePart, ampm] = label.split(' ');
  const [hStr, mStr] = timePart.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  const base = new Date();
  base.setHours(h, m, 0, 0);
  return base;
}

const CATEGORY_OPTIONS = ['works', 'law', 'excise', 'personal'] as const;
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'] as const;

export default function MeetingRequestScreen() {
  const params = useLocalSearchParams();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(''); // YYYY-MM-DD
  const [time, setTime] = useState(''); // e.g., "10:00 AM"
  const [purpose, setPurpose] = useState(
    (params.prefillPurpose as string) || ''
  );
  const [loading, setLoading] = useState(false);

  // NEW: extra fields
  const [category, setCategory] =
    useState<(typeof CATEGORY_OPTIONS)[number]>('works');
  const [priority, setPriority] =
    useState<(typeof PRIORITY_OPTIONS)[number]>('medium');
  const [attendeesText, setAttendeesText] = useState(''); // comma-separated

  // NEW: location field
  const [location, setLocation] = useState('');

  // native pickers visibility
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Auto-fill organization -> title
  useEffect(() => {
    if (params.prefillOrganization && params.prefillName) {
      setTitle(`Meeting with ${params.prefillName}`);
    }
  }, [params]);

  /* ---------- Submit ---------- */
  async function handleSubmit() {
    if (!title || !date || !time) {
      Alert.alert('Missing Information', 'Please fill in Title, Date and Time.');
      return;
    }
    try {
      setLoading(true);

      // turn comma-separated attendees into array
      const attendees = attendeesText
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const { error } = await supabase.from('meetings').insert({
        title,
        description: purpose || null,
        meeting_date: date,
        meeting_time: time,
        status: 'upcoming',
        category, // <- from picker
        priority, // <- from picker
        attendees, // <- array
        location: location || 'TBD',
      });

      if (error) throw error;

      DeviceEventEmitter.emit('meetings:refresh');

      setTitle('');
      setDate('');
      setTime('');
      setPurpose('');
      setCategory('works');
      setPriority('medium');
      setAttendeesText('');
      setLocation('');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Unable to submit meeting request.');
    } finally {
      setLoading(false);
    }
  }

  // current values for pickers
  const datePickerValue = date ? new Date(date) : new Date();
  const timePickerValue = time ? parseTimeLabelToDate(time) : new Date();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
      <SafeAreaView style={styles.container}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={styles.backButton}
                >
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
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Calendar size={20} color="#6b7280" />
                    <Text
                      style={[
                        styles.iconInput,
                        { color: date ? '#1f2937' : '#9ca3af' },
                      ]}
                    >
                      {date
                        ? new Date(date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                        : 'Select date'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Time */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Time *</Text>
                  <TouchableOpacity
                    style={styles.inputWithIcon}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Clock size={20} color="#6b7280" />
                    <Text
                      style={[
                        styles.iconInput,
                        { color: time ? '#1f2937' : '#9ca3af' },
                      ]}
                    >
                      {time || 'Select time'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Location */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Location</Text>
                  <View style={styles.inputWithIcon}>
                    <MapPin size={20} color="#6b7280" />
                    <TextInput
                      style={styles.iconInput}
                      placeholder="e.g., Secretariat Room 301"
                      value={location}
                      onChangeText={setLocation}
                      placeholderTextColor="#9ca3af"
                      returnKeyType="done"
                    />
                  </View>
                </View>

                {/* Category */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Category</Text>
                  <View style={styles.chipsRow}>
                    {CATEGORY_OPTIONS.map(opt => {
                      const active = category === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[styles.chip, active && styles.chipActive]}
                          onPress={() => setCategory(opt)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              active && styles.chipTextActive,
                            ]}
                          >
                            {opt.charAt(0).toUpperCase() + opt.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Priority */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Priority</Text>
                  <View style={styles.chipsRow}>
                    {PRIORITY_OPTIONS.map(opt => {
                      const active = priority === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[
                            styles.chip,
                            active && getPriorityChipActiveStyle(opt),
                          ]}
                          onPress={() => setPriority(opt)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              active && styles.chipTextActive,
                            ]}
                          >
                            {opt.charAt(0).toUpperCase() + opt.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Attendees */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Attendees (comma-separated)</Text>
                  <View style={styles.inputWithIcon}>
                    <Users size={20} color="#6b7280" />
                    <TextInput
                      style={[styles.iconInput, styles.textArea]}
                      placeholder="e.g., John Doe, Anita Sharma, p.parida@gmail.com"
                      value={attendeesText}
                      onChangeText={setAttendeesText}
                      multiline
                      numberOfLines={2}
                      textAlignVertical="top"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>

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
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Send size={20} color="#ffffff" />
                  )}
                  <Text style={styles.submitButtonText}>
                    {loading ? 'Submitting...' : 'Submit Request'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Native DATE PICKER */}
            {showDatePicker && (
              <DateTimePicker
                mode="date"
                display="default"
                value={datePickerValue}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setDate(formatDateForDb(selectedDate));
                  }
                }}
              />
            )}

            {/* Native TIME PICKER */}
            {showTimePicker && (
              <DateTimePicker
                mode="time"
                display="default"
                value={timePickerValue}
                onChange={(event, selectedTime) => {
                  setShowTimePicker(false);
                  if (selectedTime) {
                    setTime(formatTimeLabel(selectedTime));
                  }
                }}
              />
            )}
          </View>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

/* -------------------- styles -------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  placeholder: { width: 40 },

  form: { padding: 20 },

  inputGroup: { marginBottom: 20 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },

  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  iconInput: { flex: 1, fontSize: 16, color: '#1f2937' },

  textArea: { minHeight: 80, paddingTop: 12 },

  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e40af',
    borderRadius: 12,
    paddingVertical: 16,
    // marginBottom: 30,
    gap: 8,
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f8fafc',
  },
  chipActive: { backgroundColor: '#1e40af', borderColor: '#1e40af' },
  chipText: { color: '#374151', fontWeight: '600' },
  chipTextActive: { color: '#ffffff' },
});

function getPriorityChipActiveStyle(p: string) {
  return {
    backgroundColor:
      p === 'urgent'
        ? '#dc2626'
        : p === 'high'
          ? '#f59e0b'
          : p === 'medium'
            ? '#2563eb'
            : '#10b981',
    borderColor:
      p === 'urgent'
        ? '#dc2626'
        : p === 'high'
          ? '#f59e0b'
          : p === 'medium'
            ? '#2563eb'
            : '#10b981',
  };
}