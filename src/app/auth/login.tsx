import { View, Text, TextInput, ScrollView, ActivityIndicator, Alert, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { syncService } from '../../lib/syncService';
import { haptics } from '../../lib/haptics';
import { Mail, Lock, User, ArrowRight, ChevronLeft } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import Svg, { Path } from 'react-native-svg';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

// NOTE: GoogleSignin is loaded dynamically via require() to prevent crashes in Expo Go
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '266617327144-88kqikajgf4ob9bouuupo8ue7kop33gi.apps.googleusercontent.com';

// We wrap the configuration and imports to prevent crashes in Expo Go
// where the native GoogleSignin module is not available.
// detect if we are running in Expo Go or development build
const isExpoGo = Constants.executionEnvironment === 'storeClient';
const isNative = Platform.OS !== 'web';
const isActuallyNative = isNative && !isExpoGo;

const GoogleIcon = ({ size = 20 }: { size?: number }) => (
    <View style={{ width: size, height: size, marginRight: 10 }}>
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
            />
            <Path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
            />
            <Path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
            />
            <Path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
            />
        </Svg>
    </View>
);

export default function LoginScreen() {
    const router = useRouter();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [isLoading, setIsLoading] = useState(false);

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

    // Configuration is now handled inside the handler to prevent early crashes

    const handleAuth = async () => {
        if (!email || !password) {
            Alert.alert('Fehler', 'Bitte fülle alle Felder aus.');
            return;
        }

        setIsLoading(true);
        haptics.lightImpact();

        try {
            if (mode === 'login') {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;

                // Pull cloud data after login
                await syncService.pullAll();

                haptics.success();
                router.replace('/(tabs)');
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                Alert.alert('Erfolg', 'Bitte bestätige deine E-Mail-Adresse.');
                setMode('login');
            }
        } catch (error: any) {
            Alert.alert('Auth Fehler', error.message);
            haptics.error();
        } finally {
            setIsLoading(false);
        }
    };

    const handleAppleSignIn = async () => {
        try {
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            if (credential.identityToken) {
                const { error } = await supabase.auth.signInWithIdToken({
                    provider: 'apple',
                    token: credential.identityToken,
                });
                if (error) throw error;
                await syncService.pullAll();
                haptics.success();
                router.replace('/(tabs)');
            }
        } catch (e: any) {
            if (e.code !== 'ERR_REQUEST_CANCELED') {
                Alert.alert('Fehler', 'Apple Login fehlgeschlagen.');
                haptics.error();
            }
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            // For Web environments (like localhost:8081), prefer Supabase's native web OAuth flow for seamless redirects.
            if (Platform.OS === 'web') {
                const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: window.location.origin + '/(tabs)',
                    },
                });
                if (error) throw error;
                return; // Redirect happens automatically
            }

            // Native environments logic (iOS, Android)
            const fallbackOAuth = async () => {
                const redirectUrl = makeRedirectUri();
                const { data, error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: redirectUrl,
                        skipBrowserRedirect: true,
                    },
                });

                if (error) throw error;

                if (data?.url) {
                    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
                    if (result.type === 'success') {
                        // Extract tokens from the returned URL (Supabase appends them as fragments/query params)
                        const urlStr = result.url.replace('#', '?');
                        const fragment = urlStr.split('?')[1];
                        if (fragment) {
                            // Using string splitting for robust extracting
                            const extractedParams: Record<string, string> = {};
                            fragment.split('&').forEach(pair => {
                                const [key, val] = pair.split('=');
                                if (key && val) extractedParams[key] = decodeURIComponent(val);
                            });

                            if (extractedParams.access_token && extractedParams.refresh_token) {
                                const { error: sessionError } = await supabase.auth.setSession({
                                    access_token: extractedParams.access_token,
                                    refresh_token: extractedParams.refresh_token,
                                });
                                if (sessionError) throw sessionError;

                                await syncService.pullAll();
                                haptics.success();
                                router.replace('/(tabs)');
                            }
                        }
                    }
                }
            };

            try {
                if (isExpoGo) {
                    await fallbackOAuth();
                    return;
                }

                const { GoogleSignin } = require('@react-native-google-signin/google-signin');

                // Configure right before use
                GoogleSignin.configure({
                    webClientId: GOOGLE_WEB_CLIENT_ID,
                });

                await GoogleSignin.hasPlayServices();
                const userInfo = await GoogleSignin.signIn();

                if (userInfo?.data?.idToken) {
                    const { error } = await supabase.auth.signInWithIdToken({
                        provider: 'google',
                        token: userInfo.data.idToken,
                    });
                    if (error) throw error;
                    await syncService.pullAll();
                    haptics.success();
                    router.replace('/(tabs)');
                }
            } catch (nativeError: any) {
                if (nativeError.message?.includes('RNGoogleSignin') || nativeError.message?.includes('could not be found')) {
                    // Fallback for missing native module (common in Expo Go)
                    await fallbackOAuth();
                } else if (nativeError.code === 'SIGN_IN_CANCELLED') {
                    // user cancelled the login flow
                } else {
                    throw nativeError;
                }
            }
        } catch (error: any) {
            // General error handling (web or other)
            if (error.code === 'SIGN_IN_CANCELLED') return;

            Alert.alert('Fehler', 'Google Login fehlgeschlagen.');
            haptics.error();
        }
    };

    const headerBg = isDark ? '#18181B' : '#FFFFFF';
    const pageBg = isDark ? '#09090B' : '#F4F4F5';
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: pageBg }} edges={['top', 'bottom']}>
            <View className="flex-1 md:flex-row">
                {/* Desktop Left Panel - Editorial Minimal Branding */}
                <View className="hidden md:flex flex-1 bg-zinc-950 dark:bg-black items-center justify-center p-12 relative overflow-hidden border-r border-zinc-800/50">
                    {/* Abstract gradients for premium feel */}
                    <View className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px]" />
                    <View className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]" />

                    <Animated.View entering={FadeInDown.duration(800).delay(200)} className="z-10 max-w-md">
                        <Text style={{ fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -1.5 }} className="text-6xl text-white mb-6">
                            NutriTrack<Text className="text-primary">.</Text>
                        </Text>
                        <Text className="text-xl text-zinc-400 font-medium leading-relaxed">
                            Dein minimalistischer Begleiter für strukturierte Ernährung und messbaren Fortschritt.
                        </Text>
                    </Animated.View>
                </View>

                {/* Right Panel - Login Form */}
                <View className="flex-1 justify-center bg-white dark:bg-[#09090B]">
                    <ScrollView
                        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: isDesktop ? 48 : 24, paddingVertical: isDesktop ? 60 : 20, justifyContent: 'center' }}
                        keyboardShouldPersistTaps="handled"
                        className="w-full max-w-xl mx-auto"
                    >
                        {/* Back Button */}
                        <View
                            onStartShouldSetResponder={() => true}
                            onResponderRelease={() => router.back()}
                            className="w-10 h-10 items-center justify-center rounded-full bg-white dark:bg-zinc-800 shadow-sm mb-10"
                        >
                            <ChevronLeft size={24} color={isDark ? '#FAFAFA' : '#09090B'} />
                        </View>

                        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
                            <Text className="text-3xl font-bold text-text dark:text-zinc-50 mb-2">
                                {mode === 'login' ? 'Willkommen zurück' : 'Account erstellen'}
                            </Text>
                            <Text className="text-base text-textLight dark:text-zinc-400 mb-8">
                                {mode === 'login'
                                    ? 'Melde dich an, um deine Daten zu synchronisieren.'
                                    : 'Tritt NutriTrack bei und starte deine Reise.'}
                            </Text>
                        </Animated.View>

                        {/* Form */}
                        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
                            {/* Email Field */}
                            <View className="mb-5">
                                <Text className="text-[11px] font-black text-textLight dark:text-zinc-500 uppercase tracking-[1.5px] ml-1 mb-2">Email Adresse</Text>
                                <View
                                    className={`flex-row items-center bg-white dark:bg-zinc-900 rounded-2xl border px-4 py-3.5 shadow-sm transition-all ${focusedField === 'email' ? 'border-primary shadow-md shadow-blue-500/5' : 'border-gray-100 dark:border-zinc-800'
                                        }`}
                                >
                                    <Mail size={18} color={focusedField === 'email' ? '#2563EB' : '#71717A'} />
                                    <TextInput
                                        placeholder="name@beispiel.de"
                                        placeholderTextColor="#A1A1AA"
                                        className="flex-1 text-text dark:text-zinc-100 text-[16px] font-medium ml-2"
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        onFocus={() => setFocusedField('email')}
                                        onBlur={() => setFocusedField(null)}
                                    />
                                </View>
                            </View>

                            {/* Password Field */}
                            <View className="mb-8">
                                <Text className="text-[11px] font-black text-textLight dark:text-zinc-500 uppercase tracking-[1.5px] ml-1 mb-2">Passwort</Text>
                                <View
                                    className={`flex-row items-center bg-white dark:bg-zinc-900 rounded-2xl border px-4 py-3.5 shadow-sm transition-all ${focusedField === 'password' ? 'border-primary shadow-md shadow-blue-500/5' : 'border-gray-100 dark:border-zinc-800'
                                        }`}
                                >
                                    <Lock size={18} color={focusedField === 'password' ? '#2563EB' : '#71717A'} className="mr-6" />
                                    <TextInput
                                        placeholder="••••••••"
                                        placeholderTextColor="#A1A1AA"
                                        className="flex-1 text-text dark:text-zinc-100 text-[16px] font-medium ml-2"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                        onFocus={() => setFocusedField('password')}
                                        onBlur={() => setFocusedField(null)}
                                    />
                                </View>
                            </View>

                            <View
                                onStartShouldSetResponder={() => !isLoading}
                                onResponderRelease={() => !isLoading && handleAuth()}
                                style={{
                                    backgroundColor: '#2563EB',
                                    paddingVertical: 16,
                                    borderRadius: 16,
                                    alignItems: 'center',
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    opacity: isLoading ? 0.7 : 1
                                }}
                                className="shadow-lg shadow-blue-500/30"
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Text className="text-white font-bold text-lg mr-2">
                                            {mode === 'login' ? 'Einloggen' : 'Registrieren'}
                                        </Text>
                                        <ArrowRight size={20} color="#FFFFFF" />
                                    </>
                                )}
                            </View>

                            {/* Social Logins */}
                            <View className="mt-8 mb-4 flex-row items-center">
                                <View className="flex-1 h-[1px] bg-gray-200 dark:bg-zinc-800" />
                                <Text className="mx-4 text-xs font-semibold text-textLight dark:text-zinc-500 uppercase tracking-widest">Oder weiter mit</Text>
                                <View className="flex-1 h-[1px] bg-gray-200 dark:bg-zinc-800" />
                            </View>

                            {Platform.OS === 'ios' && (
                                <AppleAuthentication.AppleAuthenticationButton
                                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                                    buttonStyle={isDark ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                                    cornerRadius={16}
                                    style={{ width: '100%', height: 50, marginBottom: 16 }}
                                    onPress={handleAppleSignIn}
                                />
                            )}

                            <View
                                onStartShouldSetResponder={() => true}
                                onResponderRelease={handleGoogleSignIn}
                                style={{
                                    backgroundColor: isDark ? '#27272A' : '#FFFFFF',
                                    borderColor: isDark ? '#3F3F46' : '#E5E7EB',
                                    borderWidth: 1,
                                    paddingVertical: 14,
                                    borderRadius: 16,
                                    alignItems: 'center',
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                }}
                            >
                                <GoogleIcon />
                                <Text className="text-text dark:text-zinc-50 font-bold text-[16px]">
                                    Mit Google fortfahren
                                </Text>
                            </View>
                        </Animated.View>

                        {/* Switch Mode */}
                        <Animated.View
                            entering={FadeInUp.delay(300).duration(600)}
                            className="mt-auto items-center py-6"
                        >
                            <View
                                onStartShouldSetResponder={() => true}
                                onResponderRelease={() => {
                                    haptics.selection();
                                    setMode(mode === 'login' ? 'signup' : 'login');
                                }}
                            >
                                <Text className="text-textLight dark:text-zinc-400">
                                    {mode === 'login' ? 'Noch keinen Account? ' : 'Bereits Mitglied? '}
                                    <Text className="text-primary font-bold">
                                        {mode === 'login' ? 'Jetzt registrieren' : 'Hier anmelden'}
                                    </Text>
                                </Text>
                            </View>
                        </Animated.View>
                    </ScrollView>
                </View>
            </View>
        </SafeAreaView>
    );
}
