import { router } from 'expo-router';
import { ArrowLeft, Building, Clock, MessageSquare, PhoneCall, Plus, User } from 'lucide-react-native';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const incomingCalls = [
  {
    id: '1',
    callerName: 'Surendra Kumar Patel',
    callerNumber: '+91 98765 43210',
    organization: 'Chief Engineer, Works Department',
    callTime: '10:30 AM',
    callDate: 'Today',
    duration: '5 min',
    callType: 'incoming',
    status: 'answered',
    purpose: 'Infrastructure project discussion',
  },
  {
    id: '2',
    callerName: 'Priyanka Mohanty',
    callerNumber: '+91 98765 43211',
    organization: 'Legal Advisor, Law Department',
    callTime: '11:45 AM',
    callDate: 'Today',
    duration: '3 min',
    callType: 'incoming',
    status: 'missed',
    purpose: 'Legal compliance query',
  },
  {
    id: '3',
    callerName: 'Rajesh Kumar Sahoo',
    callerNumber: '+91 98765 43212',
    organization: 'Additional Secretary, Works Department',
    callTime: '2:15 PM',
    callDate: 'Today',
    duration: '8 min',
    callType: 'incoming',
    status: 'answered',
    purpose: 'Budget approval request',
  },
];

export default function CallsScreen() {
  const createMeetingFromCall = (call: any) => {
    Alert.alert(
      'Create Meeting',
      `Create a meeting with ${call.callerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create Meeting',
          onPress: () => {
            router.push({
              pathname: '/meeting-request',
              params: {
                prefillName: call.callerName,
                prefillOrganization: call.organization,
                prefillPurpose: call.purpose,
              }
            });
          }
        }
      ]
    );
  };

  const callBack = (number: string) => {
    Alert.alert(
      'Call Back',
      `Call back ${number}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            Alert.alert('Calling...', `Initiating call to ${number}`);
          }
        }
      ]
    );
  };

  const sendMeetingRequestForm = (call: any) => {
    const formLink = 'https://your-app-domain.com/meeting-form';
    const message = `Dear ${call.callerName},

Thank you for your call regarding "${call.purpose}". 

To schedule a meeting with Minister Prithiviraj Harichandan, please fill out this official meeting request form:

${formLink}

Your request will be reviewed by the Private Secretary and you will receive confirmation within 24 hours.

Best regards,
Office of Minister Prithiviraj Harichandan
Odisha Government`;

    Alert.alert(
      'Send Meeting Request Form',
      `Send WhatsApp message with meeting request form to ${call.callerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send WhatsApp',
          onPress: () => {
            // In a real app, this would open WhatsApp with the message
            // const whatsappUrl = `https://wa.me/${call.callerNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
            Alert.alert(
              'Message Sent',
              `Meeting request form has been sent to ${call.callerName} via WhatsApp. They can now fill out the form and submit their meeting request for approval.`
            );
          }
        }
      ]
    );
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'answered': return '#059669';
      case 'missed': return '#dc2626';
      case 'declined': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'answered': return '✓';
      case 'missed': return '✗';
      case 'declined': return '⚠';
      default: return '?';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#1e40af" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Incoming Calls</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.statsSection}>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{incomingCalls.length}</Text>
              <Text style={styles.statLabel}>Total Calls</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{incomingCalls.filter(c => c.status === 'answered').length}</Text>
              <Text style={styles.statLabel}>Answered</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{incomingCalls.filter(c => c.status === 'missed').length}</Text>
              <Text style={styles.statLabel}>Missed</Text>
            </View>
          </View>
        </View>

        <View style={styles.callsList}>
          <Text style={styles.sectionTitle}>Recent Calls</Text>
          {incomingCalls.map((call) => (
            <View key={call.id} style={styles.callCard}>
              <View style={styles.callHeader}>
                <View style={styles.callerInfo}>
                  <View style={styles.avatarContainer}>
                    <User size={20} color="#ffffff" />
                  </View>
                  <View style={styles.callerDetails}>
                    <Text style={styles.callerName}>{call.callerName}</Text>
                    <Text style={styles.callerNumber}>{call.callerNumber}</Text>
                    <View style={styles.organizationRow}>
                      <Building size={12} color="#6b7280" />
                      <Text style={styles.organizationText}>{call.organization}</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.callStatus}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(call.status) }]}>
                    <Text style={styles.statusIcon}>{getStatusIcon(call.status)}</Text>
                    <Text style={styles.statusText}>{call.status}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.callDetails}>
                <View style={styles.timeInfo}>
                  <Clock size={14} color="#6b7280" />
                  <Text style={styles.timeText}>{call.callTime} • {call.callDate}</Text>
                  <Text style={styles.durationText}>({call.duration})</Text>
                </View>
                
                <Text style={styles.purposeText}>Purpose: {call.purpose}</Text>
              </View>

              <View style={styles.callActions}>
                <TouchableOpacity 
                  style={styles.callBackButton}
                  onPress={() => callBack(call.callerNumber)}
                >
                  <PhoneCall size={16} color="#1e40af" />
                  <Text style={styles.callBackText}>Call Back</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.sendFormButton}
                  onPress={() => sendMeetingRequestForm(call)}
                >
                  <MessageSquare size={16} color="#059669" />
                  <Text style={styles.sendFormText}>Send Form</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.createMeetingButton}
                  onPress={() => createMeetingFromCall(call)}
                >
                  <Plus size={16} color="#ffffff" />
                  <Text style={styles.createMeetingText}>Create Meeting</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
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
  statsSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e40af',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    textAlign: 'center',
  },
  callsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  callCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  callHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  callerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  callerDetails: {
    flex: 1,
  },
  callerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2,
  },
  callerNumber: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  organizationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  organizationText: {
    fontSize: 12,
    color: '#6b7280',
  },
  callStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusIcon: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  callDetails: {
    marginBottom: 16,
    gap: 8,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 14,
    color: '#6b7280',
  },
  durationText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  purposeText: {
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
  },
  callActions: {
    flexDirection: 'row',
    gap: 8,
  },
  callBackButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  callBackText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  sendFormButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  sendFormText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  createMeetingButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e40af',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  createMeetingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});