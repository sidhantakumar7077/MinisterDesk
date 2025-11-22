import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { supabase } from '../config';

export default function Login() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorText, setErrorText] = useState('');

    // redirect if already signed in
    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) router.replace('/');
        });
        const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
            if (session) router.replace('/');
        });
        return () => sub.subscription.unsubscribe();
    }, []);

    const canLogin = username.trim().length > 0 && password.length >= 6 && !loading;

    async function handleLogin() {
        if (loading) return;

        setErrorText('');
        const raw = username.trim();
        const pwd = password;

        if (!raw) {
            setErrorText('Enter your username or email.');
            return;
        }
        if (pwd.length < 6) {
            setErrorText('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        try {
            const looksLikeEmail = raw.includes('@');
            let email: string | null = null;

            if (looksLikeEmail) {
                email = raw;
            } else {
                // Case-insensitive username → email via RPC (lower() inside SQL)
                const { data: rpcEmail, error: rpcErr } = await supabase.rpc('get_email_for_username', { u: raw });
                if (rpcErr) throw rpcErr;
                if (typeof rpcEmail !== 'string' || rpcEmail.length === 0) {
                    throw new Error('Invalid username or password.');
                }
                email = rpcEmail;
            }

            const { data, error } = await supabase.auth.signInWithPassword({
                email: email!,
                password: pwd,
            });

            if (error) {
                const m = (error.message || '').toLowerCase();
                if (m.includes('invalid login') || m.includes('invalid_grant') || m.includes('email or password')) {
                    throw new Error('Invalid username or password.');
                }
                if (m.includes('email not confirmed')) {
                    throw new Error('Please confirm your email to continue.');
                }
                throw error;
            }

            if (!data?.session) throw new Error('Login failed. Please try again.');
            router.replace('/');
        } catch (err: any) {
            setErrorText(err?.message ?? 'Unable to sign in.');
        } finally {
            setLoading(false);
        }
    }

    const keyboardVerticalOffset = 0;

    return (
        <View style={{ flex: 1, backgroundColor: '#ea580c' /* orange-600 */ }}>
            {/* orange blobs */}
            <View
                style={{
                    position: 'absolute',
                    top: -120,
                    left: -60,
                    width: 260,
                    height: 260,
                    borderRadius: 130,
                    backgroundColor: '#7c2d12',
                    opacity: 0.18,
                }}
            />
            <View
                style={{
                    position: 'absolute',
                    top: -60,
                    right: -40,
                    width: 180,
                    height: 180,
                    borderRadius: 90,
                    backgroundColor: '#7c2d12',
                    opacity: 0.16,
                }}
            />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={keyboardVerticalOffset}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView
                        contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Card */}
                        <View
                            style={{
                                backgroundColor: '#ffffff',
                                borderRadius: 20,
                                padding: 20,
                                shadowColor: '#000',
                                shadowOpacity: 0.08,
                                shadowRadius: 20,
                                elevation: 4,
                            }}
                        >
                            <Text style={{ fontSize: 22, fontWeight: '800', color: '#111827', textAlign: 'center' }}>
                                Welcome
                            </Text>
                            <Text style={{ fontSize: 13, color: '#6b7280', textAlign: 'center', marginTop: 6 }}>
                                Sign in with username (any case) or email
                            </Text>

                            {/* Username */}
                            <Text style={{ fontSize: 13, color: '#374151', marginTop: 18, marginBottom: 8 }}>
                                Username or Email
                            </Text>
                            <TextInput
                                value={username}
                                onChangeText={(v) => {
                                    setUsername(v);
                                    if (errorText) setErrorText('');
                                }}
                                autoCapitalize="none"
                                autoComplete="username"
                                placeholder="yourname or you@example.com"
                                placeholderTextColor="#a3a3a3"
                                style={{
                                    borderWidth: 1,
                                    borderColor: '#fca5a5',
                                    backgroundColor: '#fff7ed',
                                    borderRadius: 12,
                                    paddingHorizontal: 14,
                                    paddingVertical: 12,
                                    fontSize: 16,
                                    color: '#111827',
                                }}
                                returnKeyType="next"
                                blurOnSubmit={false}
                            />

                            {/* Password */}
                            <Text style={{ fontSize: 13, color: '#374151', marginTop: 14, marginBottom: 8 }}>
                                Password
                            </Text>
                            <View style={{ position: 'relative' }}>
                                <TextInput
                                    value={password}
                                    onChangeText={(v) => {
                                        setPassword(v);
                                        if (errorText) setErrorText('');
                                    }}
                                    secureTextEntry={!showPw}
                                    autoCapitalize="none"
                                    autoComplete="password"
                                    placeholder="••••••••"
                                    placeholderTextColor="#a3a3a3"
                                    style={{
                                        borderWidth: 1,
                                        borderColor: '#fca5a5',
                                        backgroundColor: '#fff7ed',
                                        borderRadius: 12,
                                        paddingHorizontal: 14,
                                        paddingVertical: 12,
                                        fontSize: 16,
                                        color: '#111827',
                                        paddingRight: 44, // room for eye icon
                                    }}
                                    returnKeyType="done"
                                    onSubmitEditing={handleLogin}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPw((s) => !s)}
                                    accessibilityRole="button"
                                    accessibilityLabel={showPw ? 'Hide password' : 'Show password'}
                                    style={{
                                        position: 'absolute',
                                        right: 10,
                                        top: 0,
                                        bottom: 0,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        paddingHorizontal: 6,
                                    }}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    {showPw ? <EyeOff size={20} color="#6b7280" /> : <Eye size={20} color="#6b7280" />}
                                </TouchableOpacity>
                            </View>

                            {!!errorText && <Text style={{ color: '#b91c1c', marginTop: 8 }}>{errorText}</Text>}

                            <TouchableOpacity
                                onPress={handleLogin}
                                disabled={!canLogin}
                                style={{
                                    marginTop: 16,
                                    backgroundColor: canLogin ? '#ea580c' : '#f59e0b',
                                    paddingVertical: 14,
                                    borderRadius: 14,
                                    alignItems: 'center',
                                }}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Sign In</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Attractive App Name Badge */}
                        <View style={{ alignItems: 'center', marginTop: 18 }}>
                            <LinearGradient
                                colors={['#fff7ed', '#fde68a']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={{
                                    paddingHorizontal: 18,
                                    paddingVertical: 8,
                                    borderRadius: 999,
                                    shadowColor: '#000',
                                    shadowOpacity: 0.15,
                                    shadowRadius: 6,
                                    shadowOffset: { width: 0, height: 3 },
                                    elevation: 3,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 16,
                                        fontWeight: '900',
                                        color: '#7c2d12',
                                        letterSpacing: 0.8,
                                        // textTransform: 'uppercase',
                                    }}
                                >
                                    Minister Desk
                                </Text>
                            </LinearGradient>
                        </View>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </View>
    );
}