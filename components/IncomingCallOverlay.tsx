import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated } from 'react-native';
import { Phone, PhoneOff, Plus, User } from 'lucide-react-native';

interface IncomingCall {
  id: string;
  callerName: string;
  callerNumber: string;
  organization?: string;
  purpose?: string;
}

interface IncomingCallOverlayProps {
  visible: boolean;
  call: IncomingCall | null;
  onAnswer: () => void;
  onDecline: () => void;
  onCreateMeeting: () => void;
  onSendForm: () => void;
}

export default function IncomingCallOverlay({ 
  visible, 
  call, 
  onAnswer, 
  onDecline, 
  onCreateMeeting,
  onSendForm
}: IncomingCallOverlayProps) {
  if (!call) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.callContainer}>
          {/* Incoming Call Header */}
          <View style={styles.callHeader}>
            <Text style={styles.incomingText}>Incoming Call</Text>
            <View style={styles.pulseContainer}>
              <View style={styles.pulseRing} />
              <View style={styles.pulseCore} />
            </View>
          </View>

          {/* Caller Information */}
          <View style={styles.callerInfo}>
            <View style={styles.avatarContainer}>
              <User size={32} color="#ffffff" />
            </View>
            
            <Text style={styles.callerName}>{call.callerName}</Text>
            <Text style={styles.callerNumber}>{call.callerNumber}</Text>
            
            {call.organization && (
              <Text style={styles.callerOrganization}>{call.organization}</Text>
            )}
            
            {call.purpose && (
              <View style={styles.purposeContainer}>
                <Text style={styles.purposeLabel}>Purpose:</Text>
                <Text style={styles.purposeText}>{call.purpose}</Text>
              </View>
            )}
          </View>

          {/* Call Actions */}
          <View style={styles.actionsContainer}>
            {/* Primary Actions */}
            <View style={styles.primaryActions}>
              <TouchableOpacity style={styles.declineButton} onPress={onDecline}>
                <PhoneOff size={24} color="#ffffff" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.answerButton} onPress={onAnswer}>
                <Phone size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Secondary Actions */}
            <View style={styles.secondaryActions}>
              <TouchableOpacity style={styles.sendFormButton} onPress={onSendForm}>
                <Text style={styles.sendFormButtonText}>Send Form</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.meetingButton} onPress={onCreateMeeting}>
                <Plus size={20} color="#1e40af" />
                <Text style={styles.meetingButtonText}>Create Meeting</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Info */}
          <View style={styles.quickInfo}>
            <Text style={styles.quickInfoText}>
              Swipe up to see more options or create a meeting request
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  callHeader: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  incomingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 16,
  },
  pulseContainer: {
    position: 'relative',
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1e40af',
    opacity: 0.3,
  },
  pulseCore: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e40af',
  },
  callerInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  callerName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  callerNumber: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 8,
  },
  callerOrganization: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 12,
  },
  purposeContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  purposeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  purposeText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },
  primaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  declineButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  answerButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  meetingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: '#1e40af',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  meetingButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  secondaryActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  sendFormButton: {
    flex: 1,
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendFormButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  quickInfo: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    width: '100%',
  },
  quickInfoText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 16,
  },
});