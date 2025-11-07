import { useRouter } from 'expo-router';
import { Bell, Calendar, ChevronRight, CircleHelp as HelpCircle, Lock, LogOut, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../config';

type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  username?: string | null;
};

const settingsData = [
  {
    category: 'Profile',
    icon: User,
    items: [
      { id: 'profile', title: 'Edit Profile', subtitle: 'Update your personal information', hasArrow: true },
      { id: 'preferences', title: 'Preferences', subtitle: 'Customize your experience', hasArrow: true },
    ],
  },
  {
    category: 'Notifications',
    icon: Bell,
    items: [
      { id: 'push', title: 'Push Notifications', subtitle: 'Receive meeting reminders', hasSwitch: true, enabled: true },
      { id: 'email', title: 'Email Notifications', subtitle: 'Get updates via email', hasSwitch: true, enabled: false },
      { id: 'sound', title: 'Sound Alerts', subtitle: 'Audio notifications for meetings', hasSwitch: true, enabled: true },
    ],
  },
  {
    category: 'Calendar',
    icon: Calendar,
    items: [
      { id: 'sync', title: 'Calendar Sync', subtitle: 'Sync with device calendar', hasSwitch: true, enabled: true },
      { id: 'reminders', title: 'Default Reminders', subtitle: '15 minutes before meetings', hasArrow: true },
      { id: 'timezone', title: 'Time Zone', subtitle: 'India Standard Time (UTC+5:30)', hasArrow: true },
    ],
  },
  // {
  //   category: 'Appearance',
  //   icon: Moon,
  //   items: [
  //     { id: 'theme', title: 'Dark Mode', subtitle: 'Enable dark theme', hasSwitch: true, enabled: false },
  //     { id: 'language', title: 'Language', subtitle: 'English', hasArrow: true },
  //   ],
  // },
  {
    category: 'Security',
    icon: Lock,
    items: [
      { id: 'password', title: 'Change Password', subtitle: 'Update your account password', hasArrow: true },
      { id: 'biometric', title: 'Biometric Login', subtitle: 'Use fingerprint or face ID', hasSwitch: true, enabled: false },
      { id: 'backup', title: 'Data Backup', subtitle: 'Backup your meetings and contacts', hasArrow: true },
    ],
  },
  {
    category: 'Support',
    icon: HelpCircle,
    items: [
      { id: 'help', title: 'Help Center', subtitle: 'Get help and support', hasArrow: true },
      { id: 'feedback', title: 'Send Feedback', subtitle: 'Help us improve the app', hasArrow: true },
      { id: 'about', title: 'About', subtitle: 'App version 1.0.0', hasArrow: true },
    ],
  },
];

export default function SettingsScreen() {

  const router = useRouter();

  const [profile, setProfile] = useState<Profile>({
    id: '',
    name: 'New User',
    email: '',
    role: 'staff',
  });
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [switchStates, setSwitchStates] = useState<Record<string, boolean>>({
    push: true,
    email: false,
    sound: true,
    sync: true,
    theme: false,
    biometric: false,
  });

  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth.user?.id;
        const uemail = auth.user?.email ?? '';

        if (!uid) {
          // not signed in; push to login
          router.replace('/(auth)/login');
          return;
        }

        // Load profile from public.users (fallback to auth values)
        const { data: row } = await supabase
          .from('users')
          .select('id, name, email, role, username')
          .eq('id', uid)
          .maybeSingle();

        if (mounted) {
          setProfile({
            id: uid,
            name: row?.name ?? auth.user?.user_metadata?.full_name ?? 'New User',
            email: row?.email ?? uemail,
            role: row?.role ?? 'staff',
            username: row?.username ?? null,
          });
        }
      } finally {
        if (mounted) setLoadingProfile(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const toggleSwitch = (key: string) => {
    setSwitchStates(prev => ({ ...prev, [key]: !prev[key] }));
  };

  async function handleLogout() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace('/(auth)/login'); // ensure you have this route
    } catch (e: any) {
      Alert.alert('Sign out failed', e?.message ?? 'Please try again.');
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <User size={32} color="#ffffff" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {loadingProfile ? 'Loading…' : profile.name || 'New User'}
              </Text>
              <Text style={styles.profileEmail}>
                {loadingProfile ? '' : profile.email}
              </Text>
              <Text style={styles.profileRole}>
                {loadingProfile ? '' : (profile.role || 'staff')}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editProfileButton}
          // onPress={() => router.push('/(tabs)/settings/profile')}
          >
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Settings Categories */}
        {settingsData.map((category, categoryIndex) => (
          <View key={categoryIndex} style={styles.settingsCategory}>
            <View style={styles.categoryHeader}>
              <category.icon size={20} color="#1e40af" />
              <Text style={styles.categoryTitle}>{category.category}</Text>
            </View>

            <View style={styles.settingsGroup}>
              {category.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.settingItem,
                    itemIndex === category.items.length - 1 && styles.lastSettingItem,
                  ]}
                  disabled={item.hasSwitch}
                  // onPress={() => {
                  //   if (item.hasArrow) {
                  //     // route examples; adjust to your actual screens
                  //     switch (item.id) {
                  //       case 'password':
                  //         router.push('/(auth)/change-password');
                  //         break;
                  //       default:
                  //         // generic placeholder
                  //         Alert.alert(item.title, 'Coming soon');
                  //     }
                  //   }
                  // }}
                >
                  <View style={styles.settingContent}>
                    <Text style={styles.settingTitle}>{item.title}</Text>
                    <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                  </View>

                  {item.hasSwitch && (
                    <Switch
                      value={switchStates[item.id] || false}
                      onValueChange={() => toggleSwitch(item.id)}
                      trackColor={{ false: '#f3f4f6', true: '#1e40af' }}
                      thumbColor="#ffffff"
                    />
                  )}

                  {item.hasArrow && <ChevronRight size={20} color="#9ca3af" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Minister Scheduling App</Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
          <Text style={styles.copyrightText}>© 2025 Your Organization</Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={signingOut}
        >
          {signingOut ? (
            <ActivityIndicator />
          ) : (
            <LogOut size={20} color="#dc2626" />
          )}
          <Text style={styles.logoutText}>
            {signingOut ? 'Signing out…' : 'Sign Out'}
          </Text>
        </TouchableOpacity>

        {/* Quick Actions */}
        {/* <View style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => Alert.alert('Export', 'Export data coming soon')}
            >
              <Mail size={20} color="#1e40af" />
              <Text style={styles.actionButtonText}>Export Data</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => Alert.alert('Import', 'Import calendar coming soon')}
            >
              <Calendar size={20} color="#1e40af" />
              <Text style={styles.actionButtonText}>Import Calendar</Text>
            </TouchableOpacity>
          </View>
        </View> */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10, paddingBottom: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#1f2937' },
  profileCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 20, fontWeight: '700', color: '#1f2937', marginBottom: 4 },
  profileEmail: { fontSize: 14, color: '#6b7280', marginBottom: 2 },
  profileRole: { fontSize: 14, fontWeight: '500', color: '#1e40af' },
  editProfileButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  editProfileText: { fontSize: 14, fontWeight: '600', color: '#1e40af' },
  settingsCategory: { marginBottom: 24 },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
    gap: 8,
  },
  categoryTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  settingsGroup: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  lastSettingItem: { borderBottomWidth: 0 },
  settingContent: { flex: 1, marginRight: 12 },
  settingTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 2 },
  settingSubtitle: { fontSize: 14, color: '#6b7280' },
  appInfo: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 },
  appInfoText: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 4 },
  versionText: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
  copyrightText: { fontSize: 12, color: '#9ca3af' },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#dc2626' },
  quickActions: { paddingHorizontal: 20, paddingBottom: 24 },
  quickActionsTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 12 },
  actionsContainer: { flexDirection: 'row', gap: 12 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionButtonText: { fontSize: 14, fontWeight: '600', color: '#1e40af' },
});