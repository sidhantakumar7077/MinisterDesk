import { useRouter } from 'expo-router';
import { ChevronRight, Eye, EyeOff, Lock, LogOut, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../config';

type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  username?: string | null;
};

type SettingItem = {
  id: string;
  title: string;
  subtitle: string;
  hasArrow?: boolean;
  hasSwitch?: boolean;
  enabled?: boolean;
};

type SettingsCategory = {
  category: string;
  icon: any;
  items: SettingItem[];
};

const settingsData: SettingsCategory[] = [
  {
    category: 'Security',
    icon: Lock,
    items: [
      { id: 'password', title: 'Change Password', subtitle: 'Update your account password', hasArrow: true },
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
    username: null,
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

  // 🔐 Change Password Modal state
  const [showChangePassModal, setShowChangePassModal] = useState(false);
  const [cpUsername, setCpUsername] = useState('');
  const [cpPassword, setCpPassword] = useState('');
  const [cpConfirm, setCpConfirm] = useState('');
  const [cpSaving, setCpSaving] = useState(false);
  const [cpError, setCpError] = useState('');

  // 👁️ visibility toggles
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // 🔓 Sign-out confirmation modal
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth.user?.id;
        const uemail = auth.user?.email ?? '';

        if (!uid) {
          router.replace('/(auth)/login');
          return;
        }

        const { data: row } = await supabase
          .from('users')
          .select('id, name, email, role, username')
          .eq('id', uid)
          .maybeSingle();

        if (mounted) {
          const nextProfile: Profile = {
            id: uid,
            name: row?.name ?? (auth.user?.user_metadata?.full_name ?? 'New User'),
            email: row?.email ?? uemail,
            role: row?.role ?? 'staff',
            username: row?.username ?? null,
          };
          setProfile(nextProfile);

          const derivedUsername =
            nextProfile.username ??
            (nextProfile.email ? nextProfile.email.split('@')[0] : 'user');
          setCpUsername(derivedUsername);
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
      router.replace('/(auth)/login');
    } catch (e: any) {
      Alert.alert('Sign out failed', e?.message ?? 'Please try again.');
    } finally {
      setSigningOut(false);
    }
  }

  // 🔐 Handle Save (username + password)
  const handleSaveChangePassword = async () => {
    if (cpSaving) return;

    setCpError('');

    const incomingUsername = cpUsername.trim();
    const wantToChangePassword =
      cpPassword.trim().length > 0 || cpConfirm.trim().length > 0;

    if (wantToChangePassword) {
      if (cpPassword.trim().length < 6) {
        setCpError('Password must be at least 6 characters.');
        return;
      }
      if (cpPassword !== cpConfirm) {
        setCpError('New password and confirm password do not match.');
        return;
      }
    }

    setCpSaving(true);
    try {
      // 1) Username update (case-insensitive uniqueness)
      if (
        profile.id &&
        incomingUsername &&
        incomingUsername !== (profile.username ?? '')
      ) {
        const { data: conflict, error: qErr } = await supabase
          .from('users')
          .select('id')
          .neq('id', profile.id)
          .ilike('username', incomingUsername)
          .maybeSingle();
        if (qErr) throw qErr;
        if (conflict?.id) {
          setCpError('That username is already taken (case-insensitive).');
          setCpSaving(false);
          return;
        }

        const { error: uErr } = await supabase
          .from('users')
          .update({ username: incomingUsername })
          .eq('id', profile.id);
        if (uErr) throw uErr;

        setProfile(prev => ({ ...prev, username: incomingUsername }));
      }

      // 2) Password update if requested
      if (wantToChangePassword) {
        const { error: pErr } = await supabase.auth.updateUser({ password: cpPassword });
        if (pErr) throw pErr;
      }

      // 3) Finish
      setCpPassword('');
      setCpConfirm('');
      setShowChangePassModal(false);

      Alert.alert(
        'Success',
        wantToChangePassword
          ? 'Password updated successfully.'
          : incomingUsername !== (profile.username ?? '')
            ? 'Username updated successfully.'
            : 'Nothing to update.'
      );
    } catch (e: any) {
      setCpError(e?.message ?? 'Failed to update credentials.');
    } finally {
      setCpSaving(false);
    }
  };

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
            <View className="profileInfo" style={styles.profileInfo}>
              <Text style={styles.profileName}>Sambit Garnayak</Text>
              <Text style={styles.profileEmail}>
                {'P.S to ' + profile.role}
              </Text>
              <Text style={styles.profileRole}>
                {loadingProfile ? 'Loading…' : profile.name || 'New User'}
              </Text>
            </View>
          </View>

          <View style={{ width: '95%', alignSelf: 'center', flexDirection: 'row', justifyContent: 'space-around' }}>
            <View style={{ backgroundColor: '#1e40af', width: 60, height: 25, alignItems: 'center', justifyContent: 'center', borderRadius: 20 }}>
              <Text style={{ fontSize: 13, color: '#fff', fontWeight: '800' }}>Works</Text>
            </View>
            <View style={{ backgroundColor: '#059669', width: 60, height: 25, alignItems: 'center', justifyContent: 'center', borderRadius: 20 }}>
              <Text style={{ fontSize: 13, color: '#fff', fontWeight: '800' }}>Law</Text>
            </View>
            <View style={{ backgroundColor: '#f59e0b', width: 60, height: 25, alignItems: 'center', justifyContent: 'center', borderRadius: 20 }}>
              <Text style={{ fontSize: 13, color: '#fff', fontWeight: '800' }}>Excise</Text>
            </View>
          </View>
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
                  onPress={() => {
                    if (item.hasArrow) {
                      switch (item.id) {
                        case 'password':
                          setCpError('');
                          const seed = profile.username ??
                            (profile.email ? profile.email.split('@')[0] : cpUsername || 'user');
                          setCpUsername(seed);
                          setCpPassword('');
                          setCpConfirm('');
                          setShowPass(false);
                          setShowConfirm(false);
                          setShowChangePassModal(true);
                          break;
                        default:
                          Alert.alert(item.title, 'Coming soon');
                      }
                    }
                  }}
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
          <Text style={styles.appInfoText}>Minister Desk</Text>
          <Text style={styles.versionText}>version - 1.0.0</Text>
          {/* <Text style={styles.copyrightText}>
            © {new Date().getFullYear()} Unitor Technology Pvt Ltd
          </Text> */}
        </View>

        {/* Logout Button - opens confirm modal */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => setShowSignOutModal(true)}
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
      </ScrollView>

      {/* 🔐 Change Password Modal */}
      <Modal
        visible={showChangePassModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowChangePassModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={{
            width: '100%',
            top: '10%',
            maxWidth: 460,
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 16,
          }}>
            <Text style={styles.modalTitle}>Update Credentials</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                value={cpUsername}
                onChangeText={setCpUsername}
                autoCapitalize="none"
                placeholder="Enter username"
                placeholderTextColor="#9ca3af"
              />
              <Text style={styles.helpText}>You can change your username.</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={[styles.input, { paddingRight: 44 }]}
                  value={cpPassword}
                  onChangeText={setCpPassword}
                  placeholder="Enter new password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showPass}
                />
                <TouchableOpacity
                  onPress={() => setShowPass(p => !p)}
                  style={styles.eyeBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {showPass ? <EyeOff size={20} color="#6b7280" /> : <Eye size={20} color="#6b7280" />}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={[styles.input, { paddingRight: 44 }]}
                  value={cpConfirm}
                  onChangeText={setCpConfirm}
                  placeholder="Re-enter new password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showConfirm}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirm(c => !c)}
                  style={styles.eyeBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {showConfirm ? <EyeOff size={20} color="#6b7280" /> : <Eye size={20} color="#6b7280" />}
                </TouchableOpacity>
              </View>
              <Text style={styles.helpText}>
                Leave password fields empty to only update the username.
              </Text>
            </View>

            {!!cpError && <Text style={styles.errorText}>{cpError}</Text>}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#f1f5f9', borderColor: '#e5e7eb' }]}
                onPress={() => setShowChangePassModal(false)}
                disabled={cpSaving}
              >
                <Text style={[styles.modalBtnText, { color: '#374151' }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#1e40af' }]}
                onPress={handleSaveChangePassword}
                disabled={cpSaving}
              >
                {cpSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.modalBtnText, { color: '#fff' }]}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 🔓 Sign-out confirmation modal */}
      <Modal
        visible={showSignOutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSignOutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Sign out?</Text>
            <Text style={{ color: '#6b7280', marginBottom: 12 }}>
              You’ll need to log in again to access your account.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#f1f5f9', borderColor: '#e5e7eb' }]}
                onPress={() => setShowSignOutModal(false)}
                disabled={signingOut}
              >
                <Text style={[styles.modalBtnText, { color: '#374151' }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#dc2626' }]}
                onPress={async () => {
                  await handleLogout();
                  setShowSignOutModal(false);
                }}
                disabled={signingOut}
              >
                {signingOut ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.modalBtnText, { color: '#fff' }]}>Sign Out</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    // justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    top: '40%',
    maxWidth: 460,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 10 },
  field: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '800', color: '#374151', marginBottom: 6 },

  inputWrap: { position: 'relative' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#fff',
  },
  eyeBtn: {
    position: 'absolute',
    right: 10,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },

  helpText: { fontSize: 12, color: '#6b7280', marginTop: 6 },
  errorText: { color: '#dc2626', fontSize: 13, marginBottom: 6 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modalBtnText: { fontSize: 16, fontWeight: '800' },
});