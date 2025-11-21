import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
            // If the input looks like an email, use it directly.
            const looksLikeEmail = raw.includes('@');

            let email: string | null = null;

            if (looksLikeEmail) {
                email = raw;
            } else {
                // Case-insensitive username → email via RPC (lower() inside SQL)
                const { data: rpcEmail, error: rpcErr } = await supabase.rpc('get_email_for_username', {
                    u: raw, // keep original; RPC handles lower/trim
                });
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
                if (
                    m.includes('invalid login') ||
                    m.includes('invalid_grant') ||
                    m.includes('email or password')
                ) {
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

    return (
        <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
            {/* blobs */}
            <View style={{ position: 'absolute', top: -120, left: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: '#1e40af', opacity: 0.15 }} />
            <View style={{ position: 'absolute', top: -60, right: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: '#2563eb', opacity: 0.12 }} />

            <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
                <View style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 20, elevation: 4 }}>
                    <Text style={{ fontSize: 22, fontWeight: '800', color: '#0f172a', textAlign: 'center' }}>
                        Welcome
                    </Text>
                    <Text style={{ fontSize: 13, color: '#475569', textAlign: 'center', marginTop: 6 }}>
                        Sign in with username (any case) or email
                    </Text>

                    <Text style={{ fontSize: 13, color: '#334155', marginTop: 18, marginBottom: 8 }}>
                        Username or Email
                    </Text>
                    <TextInput
                        value={username}
                        onChangeText={(v) => { setUsername(v); if (errorText) setErrorText(''); }}
                        autoCapitalize="none"
                        autoComplete="username"
                        placeholder="yourname or you@example.com"
                        placeholderTextColor="#94a3b8"
                        style={{
                            borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff',
                            borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
                            fontSize: 16, color: '#0f172a',
                        }}
                    />

                    <Text style={{ fontSize: 13, color: '#334155', marginTop: 14, marginBottom: 8 }}>
                        Password
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TextInput
                            value={password}
                            onChangeText={(v) => { setPassword(v); if (errorText) setErrorText(''); }}
                            secureTextEntry={!showPw}
                            autoCapitalize="none"
                            autoComplete="password"
                            placeholder="••••••••"
                            placeholderTextColor="#94a3b8"
                            style={{
                                flex: 1, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff',
                                borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
                                fontSize: 16, color: '#0f172a',
                            }}
                        />
                        <TouchableOpacity onPress={() => setShowPw((s) => !s)} style={{ marginLeft: 10, padding: 8 }}>
                            <Text style={{ color: '#1e40af', fontWeight: '700' }}>{showPw ? 'Hide' : 'Show'}</Text>
                        </TouchableOpacity>
                    </View>

                    {!!errorText && <Text style={{ color: '#b91c1c', marginTop: 8 }}>{errorText}</Text>}

                    <TouchableOpacity
                        onPress={handleLogin}
                        disabled={!canLogin}
                        style={{
                            marginTop: 16,
                            backgroundColor: canLogin ? '#1e40af' : '#94a3b8',
                            paddingVertical: 14,
                            borderRadius: 14,
                            alignItems: 'center',
                        }}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Sign In</Text>}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}