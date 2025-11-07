import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { User, ChevronDown, Check } from 'lucide-react-native';

export interface UserProfile {
  id: string;
  name: string;
  role: string;
  email: string;
  canActOnBehalf?: boolean;
  delegatedBy?: string;
}

const users: UserProfile[] = [
  {
    id: 'minister',
    name: 'Prithiviraj Harichandan',
    role: 'Senior Minister',
    email: 'prithiviraj.harichandan@odisha.gov.in',
  },
  {
    id: 'secretary',
    name: 'Sambit Garnayak',
    role: 'Private Secretary',
    email: 'sambit.garnayak@odisha.gov.in',
    canActOnBehalf: true,
    delegatedBy: 'minister',
  },
];

interface UserSwitcherProps {
  currentUser: UserProfile;
  onUserChange: (user: UserProfile) => void;
}

export default function UserSwitcher({ currentUser, onUserChange }: UserSwitcherProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <TouchableOpacity style={styles.userSwitcher} onPress={() => setShowModal(true)}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <User size={20} color="#ffffff" />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{currentUser.name}</Text>
            <Text style={styles.userRole}>
              {currentUser.canActOnBehalf ? `Acting for Minister` : currentUser.role}
            </Text>
          </View>
        </View>
        <ChevronDown size={16} color="#6b7280" />
      </TouchableOpacity>

      <Modal visible={showModal} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          onPress={() => setShowModal(false)}
          activeOpacity={1}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Switch User</Text>
            {users.map((user) => (
              <TouchableOpacity
                key={user.id}
                style={styles.userOption}
                onPress={() => {
                  onUserChange(user);
                  setShowModal(false);
                }}
              >
                <View style={styles.userOptionContent}>
                  <View style={styles.userOptionAvatar}>
                    <User size={16} color="#ffffff" />
                  </View>
                  <View style={styles.userOptionDetails}>
                    <Text style={styles.userOptionName}>{user.name}</Text>
                    <Text style={styles.userOptionRole}>
                      {user.canActOnBehalf ? `${user.role} (Can act on behalf)` : user.role}
                    </Text>
                  </View>
                </View>
                {currentUser.id === user.id && (
                  <Check size={16} color="#1e40af" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  userSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  userRole: {
    fontSize: 12,
    color: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    minWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  userOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  userOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userOptionAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userOptionDetails: {
    flex: 1,
  },
  userOptionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  userOptionRole: {
    fontSize: 12,
    color: '#6b7280',
  },
});