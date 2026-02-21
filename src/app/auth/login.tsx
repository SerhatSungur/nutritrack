import { View, Text, TextInput, ScrollView, ActivityIndicator, Alert } from 'react-native';
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

export default function LoginScreen() {
    const router = useRouter();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [isLoading, setIsLoading] = useState(false);

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

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

    const headerBg = isDark ? '#18181B' : '#FFFFFF';
    const pageBg = isDark ? '#09090B' : '#F4F4F5';

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: pageBg }}>
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 20 }}
                keyboardShouldPersistTaps="handled"
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
                <Animated.View entering={FadeInDown.delay(200).duration(600)} className="space-y-4">
                    <View className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-4 flex-row items-center mb-4">
                        <Mail size={20} color="#71717A" className="mr-3" />
                        <TextInput
                            placeholder="Email Adresse"
                            placeholderTextColor="#A1A1AA"
                            className="flex-1 text-text dark:text-zinc-100 text-base"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-4 flex-row items-center mb-8">
                        <Lock size={20} color="#71717A" className="mr-3" />
                        <TextInput
                            placeholder="Passwort"
                            placeholderTextColor="#A1A1AA"
                            className="flex-1 text-text dark:text-zinc-100 text-base"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
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
        </SafeAreaView>
    );
}
