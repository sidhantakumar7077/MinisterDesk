import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { ArrowLeft, User, Building, Calendar, Clock, Users, FileText, MapPin, Phone, Mail, Send, CircleCheck as CheckCircle } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';

const priorityLevels = ['Low', 'Medium', 'High', 'Urgent'];
const meetingTypes = ['Official Meeting', 'Courtesy Call', 'Project Discussion', 'Budget Review', 'Policy Discussion', 'Emergency Meeting'];
const departments = ['Works Department', 'Law Department', 'Finance Department', 'Administrative', 'External Organization'];

export default function MeetingFormScreen() {
  const params = useLocalSearchParams();
  
  // Form state
  const [formData, setFormData] = useState({
    // Requester Information
    requesterName: params.prefillName as string || '',
    designation: '',
    organization: params.prefillOrganization as string || '',
    department: '',
    contactNumber: '',
    email: '',
    
    // Meeting Details
    meetingTitle: '',
    meetingType: '',
    purpose: params.prefillPurpose as string || '',
    agenda: '',
    
    // Scheduling
    preferredDate1: '',
    preferredTime1: '',
    preferredDate2: '',
    preferredTime2: '',
    preferredDate3: '',
    preferredTime3: '',
    estimatedDuration: '',
    
    // Meeting Setup
    meetingLocation: '',
    attendeesCount: '',
    attendeesList: '',
    documentsRequired: '',
    
    // Priority and Additional Info
    priority: 'Medium',
    urgencyReason: '',
    backgroundInfo: '',
    expectedOutcome: '',
    
    // Supporting Documents
    attachments: '',
    referenceNumber: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Required fields validation
    if (!formData.requesterName.trim()) newErrors.requesterName = 'Name is required';
    if (!formData.designation.trim()) newErrors.designation = 'Designation is required';
    if (!formData.organization.trim()) newErrors.organization = 'Organization is required';
    if (!formData.contactNumber.trim()) newErrors.contactNumber = 'Contact number is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.meetingTitle.trim()) newErrors.meetingTitle = 'Meeting title is required';
    if (!formData.purpose.trim()) newErrors.purpose = 'Purpose is required';
    if (!formData.preferredDate1.trim()) newErrors.preferredDate1 = 'At least one preferred date is required';
    if (!formData.preferredTime1.trim()) newErrors.preferredTime1 = 'Time for first preference is required';
    
    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly.');
      return;
    }

    Alert.alert(
      'Form Submitted Successfully',
      'Your meeting request has been submitted to the Private Secretary for review. You will receive confirmation within 24 hours.',
      [
        {
          text: 'OK',
          onPress: () => router.back()
        }
      ]
    );
  };

  const renderInput = (
    label: string,
    field: string,
    placeholder: string,
    icon?: React.ReactNode,
    multiline = false,
    required = false
  ) => (
    <View style={styles.inputGroup}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        {required && <Text style={styles.required}>*</Text>}
      </View>
      <View style={[styles.inputContainer, errors[field] && styles.inputError]}>
        {icon && <View style={styles.inputIcon}>{icon}</View>}
        <TextInput
          style={[styles.input, multiline && styles.textArea]}
          placeholder={placeholder}
          value={formData[field as keyof typeof formData]}
          onChangeText={(value) => updateField(field, value)}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          textAlignVertical={multiline ? 'top' : 'center'}
          placeholderTextColor="#9ca3af"
        />
      </View>
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  const renderPicker = (
    label: string,
    field: string,
    options: string[],
    required = false
  ) => (
    <View style={styles.inputGroup}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        {required && <Text style={styles.required}>*</Text>}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.pickerOption,
              formData[field as keyof typeof formData] === option && styles.selectedPickerOption
            ]}
            onPress={() => updateField(field, option)}
          >
            <Text style={[
              styles.pickerOptionText,
              formData[field as keyof typeof formData] === option && styles.selectedPickerOptionText
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#1e40af" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Meeting Request Form</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.form}>
          {/* Form Introduction */}
          <View style={styles.introSection}>
            <CheckCircle size={24} color="#059669" />
            <Text style={styles.introTitle}>Official Meeting Request</Text>
            <Text style={styles.introText}>
              Please fill out this form to request a meeting with Minister Prithiviraj Harichandan. 
              All requests will be reviewed by the Private Secretary.
            </Text>
          </View>

          {/* Section 1: Requester Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Requester Information</Text>
            
            {renderInput(
              'Full Name',
              'requesterName',
              'Enter your full name',
              <User size={20} color="#6b7280" />,
              false,
              true
            )}
            
            {renderInput(
              'Designation/Position',
              'designation',
              'Your current position/title',
              <Building size={20} color="#6b7280" />,
              false,
              true
            )}
            
            {renderInput(
              'Organization/Department',
              'organization',
              'Your organization or department',
              <Building size={20} color="#6b7280" />,
              false,
              true
            )}
            
            {renderPicker('Department Category', 'department', departments)}
            
            {renderInput(
              'Contact Number',
              'contactNumber',
              '+91 XXXXX XXXXX',
              <Phone size={20} color="#6b7280" />,
              false,
              true
            )}
            
            {renderInput(
              'Email Address',
              'email',
              'your.email@organization.gov.in',
              <Mail size={20} color="#6b7280" />,
              false,
              true
            )}
          </View>

          {/* Section 2: Meeting Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Meeting Details</Text>
            
            {renderInput(
              'Meeting Title',
              'meetingTitle',
              'Brief title for the meeting',
              <FileText size={20} color="#6b7280" />,
              false,
              true
            )}
            
            {renderPicker('Meeting Type', 'meetingType', meetingTypes)}
            
            {renderInput(
              'Purpose of Meeting',
              'purpose',
              'Main purpose and objectives',
              <FileText size={20} color="#6b7280" />,
              true,
              true
            )}
            
            {renderInput(
              'Detailed Agenda',
              'agenda',
              'Detailed agenda items to be discussed',
              <FileText size={20} color="#6b7280" />,
              true
            )}
          </View>

          {/* Section 3: Preferred Schedule */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferred Schedule</Text>
            <Text style={styles.sectionSubtitle}>Please provide 3 preferred dates and times</Text>
            
            {/* First Preference */}
            <View style={styles.scheduleGroup}>
              <Text style={styles.scheduleLabel}>First Preference</Text>
              <View style={styles.scheduleRow}>
                {renderInput(
                  'Date',
                  'preferredDate1',
                  'DD/MM/YYYY',
                  <Calendar size={20} color="#6b7280" />,
                  false,
                  true
                )}
                {renderInput(
                  'Time',
                  'preferredTime1',
                  'HH:MM AM/PM',
                  <Clock size={20} color="#6b7280" />,
                  false,
                  true
                )}
              </View>
            </View>
            
            {/* Second Preference */}
            <View style={styles.scheduleGroup}>
              <Text style={styles.scheduleLabel}>Second Preference</Text>
              <View style={styles.scheduleRow}>
                {renderInput(
                  'Date',
                  'preferredDate2',
                  'DD/MM/YYYY',
                  <Calendar size={20} color="#6b7280" />
                )}
                {renderInput(
                  'Time',
                  'preferredTime2',
                  'HH:MM AM/PM',
                  <Clock size={20} color="#6b7280" />
                )}
              </View>
            </View>
            
            {/* Third Preference */}
            <View style={styles.scheduleGroup}>
              <Text style={styles.scheduleLabel}>Third Preference</Text>
              <View style={styles.scheduleRow}>
                {renderInput(
                  'Date',
                  'preferredDate3',
                  'DD/MM/YYYY',
                  <Calendar size={20} color="#6b7280" />
                )}
                {renderInput(
                  'Time',
                  'preferredTime3',
                  'HH:MM AM/PM',
                  <Clock size={20} color="#6b7280" />
                )}
              </View>
            </View>
            
            {renderInput(
              'Estimated Duration',
              'estimatedDuration',
              'e.g., 30 minutes, 1 hour',
              <Clock size={20} color="#6b7280" />
            )}
          </View>

          {/* Section 4: Meeting Setup */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Meeting Setup</Text>
            
            {renderInput(
              'Preferred Location',
              'meetingLocation',
              'e.g., Minister\'s Office, Conference Room',
              <MapPin size={20} color="#6b7280" />
            )}
            
            {renderInput(
              'Number of Attendees',
              'attendeesCount',
              'Total number including yourself',
              <Users size={20} color="#6b7280" />
            )}
            
            {renderInput(
              'List of Attendees',
              'attendeesList',
              'Names and designations of all attendees',
              <Users size={20} color="#6b7280" />,
              true
            )}
            
            {renderInput(
              'Documents/Materials Required',
              'documentsRequired',
              'Any documents or materials needed for the meeting',
              <FileText size={20} color="#6b7280" />,
              true
            )}
          </View>

          {/* Section 5: Priority and Context */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Priority & Context</Text>
            
            {renderPicker('Priority Level', 'priority', priorityLevels)}
            
            {formData.priority === 'Urgent' && renderInput(
              'Urgency Reason',
              'urgencyReason',
              'Please explain why this meeting is urgent',
              <FileText size={20} color="#6b7280" />,
              true
            )}
            
            {renderInput(
              'Background Information',
              'backgroundInfo',
              'Relevant background context for the meeting',
              <FileText size={20} color="#6b7280" />,
              true
            )}
            
            {renderInput(
              'Expected Outcome',
              'expectedOutcome',
              'What you hope to achieve from this meeting',
              <FileText size={20} color="#6b7280" />,
              true
            )}
          </View>

          {/* Section 6: Additional Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Information</Text>
            
            {renderInput(
              'Reference Number',
              'referenceNumber',
              'Any file or reference number (if applicable)',
              <FileText size={20} color="#6b7280" />
            )}
            
            {renderInput(
              'Supporting Documents',
              'attachments',
              'List any documents you will bring or send separately',
              <FileText size={20} color="#6b7280" />,
              true
            )}
          </View>

          {/* Declaration */}
          <View style={styles.declarationSection}>
            <Text style={styles.declarationTitle}>Declaration</Text>
            <Text style={styles.declarationText}>
              I hereby declare that the information provided above is true and accurate to the best of my knowledge. 
              I understand that this meeting request will be reviewed by the Private Secretary and I will be notified 
              of the decision within 24 hours.
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Send size={20} color="#ffffff" />
            <Text style={styles.submitButtonText}>Submit Meeting Request</Text>
          </TouchableOpacity>

          {/* Info Cards */}
          <View style={styles.infoCards}>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Review Process</Text>
              <Text style={styles.infoText}>
                • Form reviewed by Private Secretary{'\n'}
                • Response within 24 hours{'\n'}
                • Confirmation sent via email/SMS{'\n'}
                • Calendar invitation if approved
              </Text>
            </View>
            
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Contact Information</Text>
              <Text style={styles.infoText}>
                Private Secretary: Sambit Garnayak{'\n'}
                Email: sambit.garnayak@odisha.gov.in{'\n'}
                Phone: +91 XXXXX XXXXX{'\n'}
                Office: Odisha Secretariat, Bhubaneswar
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  placeholder: {
    width: 40,
  },
  form: {
    padding: 20,
  },
  introSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 8,
    marginBottom: 8,
  },
  introText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  required: {
    fontSize: 14,
    color: '#dc2626',
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputError: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626',
    marginTop: 4,
    marginLeft: 4,
  },
  scheduleGroup: {
    marginBottom: 16,
  },
  scheduleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  scheduleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerScroll: {
    flexDirection: 'row',
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectedPickerOption: {
    backgroundColor: '#1e40af',
    borderColor: '#1e40af',
  },
  pickerOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  selectedPickerOptionText: {
    color: '#ffffff',
  },
  declarationSection: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  declarationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 8,
  },
  declarationText: {
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e40af',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 24,
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
  infoCards: {
    gap: 16,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#1e40af',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
});