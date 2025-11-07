import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Shield, CircleAlert as AlertCircle } from 'lucide-react-native';
import { UserProfile } from './UserSwitcher';

interface DelegationBannerProps {
  currentUser: UserProfile;
}

export default function DelegationBanner({ currentUser }: DelegationBannerProps) {
  if (!currentUser.canActOnBehalf) return null;

  return (
    <View style={styles.banner}>
      <Shield size={16} color="#1e40af" />
      <Text style={styles.bannerText}>
        Acting on behalf of Minister Prithiviraj Harichandan
      </Text>
      <AlertCircle size={16} color="#6b7280" />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#1e40af',
  },
});