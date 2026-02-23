import {
    View, Text, TextInput, ScrollView,
    Pressable, Keyboard, Appearance,
    Modal, ActivityIndicator, Dimensions,
    TouchableOpacity,
} from 'react-native';
import { memo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomSwitch } from '../../components/CustomSwitch';
import { useLogStore } from '../../store/useLogStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Moon, Sun, Target, User, Droplets, Layout, Scale, Ruler, Activity, Check, Info, LogOut, RefreshCw, Cloud } from 'lucide-react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { suggestGoals, ACTIVITY_LEVELS, UserProfile } from '../../lib/nutritionUtils';
import Svg, { Path, Rect, G, Line, Circle as SvgCircle, Text as SvgText } from 'react-native-svg';
import { format, subDays, startOfDay, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import Animated, { FadeInDown, FadeIn, FadeOut } from 'react-native-reanimated';
import { haptics } from '../../lib/haptics';
import { syncService } from '../../lib/syncService';

// ─── Sub-Components ──────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ProfileNumberInput = ({
    initialValue, onUpdate, unit, maxLength
}: {
    initialValue: number; onUpdate: (val: number) => void; unit: string; maxLength: number;
}) => {
    const [value, setValue] = useState(initialValue ? initialValue.toString() : '0');
    return (
        <View className="flex-row items-center justify-between bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 h-[46px] px-3 rounded-xl min-w-[124px]">
            <TextInput
                value={value}
                onChangeText={setValue}
                onEndEditing={() => {
                    const parsed = parseInt(value) || 0;
                    setValue(parsed.toString());
                    onUpdate(parsed);
                }}
                keyboardType="numbers-and-punctuation"
                style={{ flex: 1, padding: 0, margin: 0, textAlign: 'center' }}
                className="text-[17px] font-bold text-text dark:text-zinc-50"
                maxLength={maxLength}
                selectTextOnFocus
                returnKeyType="done"
            />
            <View className="border-l border-gray-200 dark:border-zinc-700 pl-3 ml-2 flex-row items-center h-[28px]">
                <Text className="text-[11px] font-extrabold text-textLight dark:text-zinc-400 uppercase tracking-widest">{unit}</Text>
            </View>
        </View>
    );
};

const SegmentedControl = memo(({
    options,
    value,
    onChange,
    isDark
}: {
    options: { label: string; value: any }[];
    value: any;
    onChange: (val: any) => void;
    isDark: boolean;
}) => {
    return (
        <View className="flex-row bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl">
            {(options || []).map((opt) => {
                const isSelected = value === opt.value;
                return (
                    <TouchableOpacity
                        key={opt.value?.toString()}
                        activeOpacity={0.7}
                        onPress={() => {
                            haptics.selection();
                            requestAnimationFrame(() => {
                                onChange(opt.value);
                            });
                        }}
                        style={{
                            flex: 1,
                            paddingVertical: 8,
                            borderRadius: 10,
                            alignItems: 'center',
                            backgroundColor: isSelected
                                ? (isDark ? '#3F3F46' : '#FFFFFF')
                                : 'transparent',
                            shadowColor: isSelected ? '#000' : 'transparent',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.1,
                            shadowRadius: 2,
                            elevation: isSelected ? 1 : 0
                        }}
                    >
                        <Text style={{
                            fontSize: 13,
                            fontWeight: isSelected ? '700' : '600',
                            color: isSelected
                                ? '#2563EB'
                                : (isDark ? '#71717A' : '#6B7280')
                        }}>
                            {opt.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
});

const MacroDisplayToggle = ({ isDark }: { isDark: boolean }) => {
    const mode = useLogStore(s => s.displayMacroMode);
    const setMode = useLogStore(s => s.setDisplayMacroMode);

    return (
        <View className="py-3">
            <View className="flex-row items-center gap-x-3 mb-4">
                <Layout size={22} color="#3B82F6" />
                <View>
                    <Text className="text-base font-semibold text-text dark:text-zinc-50">Ring-Anzeige</Text>
                    <Text className="text-xs text-textLight dark:text-zinc-400">Wähle, was im Dashboard im Zentrum stehen soll</Text>
                </View>
            </View>

            <SegmentedControl
                options={[
                    { label: 'Übrig', value: 'remaining' },
                    { label: 'Gegessen', value: 'consumed' }
                ]}
                value={mode}
                onChange={(v: string) => setMode(v as 'remaining' | 'consumed')}
                isDark={isDark}
            />
        </View>
    );
};
// ─── Analytics Line Chart ──────────────────────────────────────────────────────────
const LineChart = ({
    data,
    width = 300,
    height = 160,
    color = "#3B82F6",
    isDark = false
}: {
    data: { date: string, value: number }[],
    width?: number,
    height?: number,
    color?: string,
    isDark?: boolean
}) => {
    if (data.length < 2) {
        return (
            <View style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
                <Text className="text-textLight dark:text-zinc-500 font-bold text-xs italic">Zu wenig Daten für Analyse</Text>
            </View>
        );
    }

    const padding = 20;
    const values = data.map(d => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    const points = data.map((d, i) => {
        const x = padding + (i * (width - 2 * padding)) / (data.length - 1);
        const y = height - padding - ((d.value - minVal) * (height - 2 * padding)) / range;
        return { x, y };
    });

    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        // Curve calculation (simple cubic bezier would be better, but L is cleaner for now)
        pathD += ` L ${points[i].x} ${points[i].y}`;
    }

    const labelColor = isDark ? '#71717A' : '#9CA3AF';

    return (
        <Svg width={width} height={height}>
            {/* Grid lines */}
            <Line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke={isDark ? '#27272A' : '#F3F4FB'} strokeWidth="1" />

            {/* Path */}
            <Path
                d={pathD}
                stroke={color}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Dots */}
            {points.map((p, i) => (
                <SvgCircle key={i} cx={p.x} cy={p.y} r="4" fill={color} stroke={isDark ? '#18181B' : '#FFF'} strokeWidth="2" />
            ))}

            {/* Labels */}
            <SvgText
                x={padding}
                y={height - 4}
                fontSize="10"
                fill={labelColor}
                fontWeight="bold"
            >
                {format(parseISO(data[0].date), 'dd.MM', { locale: de })}
            </SvgText>
            <SvgText
                x={width - padding - 30}
                y={height - 4}
                fontSize="10"
                fill={labelColor}
                fontWeight="bold"
            >
                {format(parseISO(data[data.length - 1].date), 'dd.MM', { locale: de })}
            </SvgText>
        </Svg>
    );
};

const AnalyticsSection = ({ isDark }: { isDark: boolean }) => {
    const weightHistory = useLogStore(s => s.weightHistory);
    const waterHistory = useLogStore(s => s.waterHistory);

    // Get last 7 entries
    const weightData = weightHistory.slice(-7);
    const waterData = waterHistory.slice(-7);

    return (
        <View className="bg-card dark:bg-zinc-900 rounded-3xl p-6 mb-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <View className="flex-row items-center gap-x-2 mb-6">
                <Activity size={22} color="#3B82F6" />
                <Text className="text-lg font-extrabold text-text dark:text-zinc-50">Trend-Analyse</Text>
            </View>

            <View className="mb-8">
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-sm font-bold text-textLight dark:text-zinc-400 uppercase tracking-widest">Gewichtsverlauf</Text>
                    {weightData.length > 0 && (
                        <Text className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg">
                            {weightData[weightData.length - 1].value} kg
                        </Text>
                    )}
                </View>
                <LineChart data={weightData} width={SCREEN_WIDTH - 80} isDark={isDark} color="#6366F1" />
            </View>

            <View>
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-sm font-bold text-textLight dark:text-zinc-400 uppercase tracking-widest">Wasseraufnahme</Text>
                    {waterData.length > 0 && (
                        <Text className="text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-lg">
                            {waterData[waterData.length - 1].value} ml
                        </Text>
                    )}
                </View>
                <LineChart data={waterData} width={SCREEN_WIDTH - 80} isDark={isDark} color="#3B82F6" />
            </View>
        </View>
    );
};

const SCREEN_WIDTH_FALLBACK = 375; // Used only as default, SCREEN_WIDTH is global now
export default function ProfileScreen() {
    const userProfile = useLogStore(s => s.userProfile);
    const setUserProfile = useLogStore(s => s.setUserProfile);
    const macroGoals = useLogStore(s => s.macroGoals);
    const setMacroGoals = useLogStore(s => s.setMacroGoals);
    const waterGoal = useLogStore(s => s.waterGoal);
    const setWaterGoal = useLogStore(s => s.setWaterGoal);

    const { user, signOut } = useAuthStore();
    const router = useRouter();
    const [isSyncing, setIsSyncing] = useState(false);

    const { colorScheme, toggleColorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    const handleUpdateGoal = (key: keyof typeof macroGoals, numValue: number) => {
        setMacroGoals({ ...macroGoals, [key]: numValue });
    };

    const handleUpdateProfile = (updates: Partial<UserProfile>) => {
        setUserProfile(updates);
    };

    const handleAutoCalculate = () => {
        haptics.success();
        const suggestions = suggestGoals(userProfile);
        setMacroGoals(suggestions);
    };

    const handleToggleDark = () => {
        // setColorScheme is not always available on react-native-web or older RN versions
        if (typeof Appearance.setColorScheme === 'function') {
            Appearance.setColorScheme(isDark ? 'light' : 'dark');
        }
        toggleColorScheme();
    };

    const handleSync = async () => {
        setIsSyncing(true);
        haptics.lightImpact();
        await syncService.pushAll();
        haptics.success();
        setIsSyncing(false);
    };

    const handleSignOut = async () => {
        haptics.lightImpact();
        await signOut();
    };

    const headerBg = isDark ? 'transparent' : 'transparent';
    const pageBg = isDark ? '#020617' : '#F8FAFC';
    const textPrimary = isDark ? '#F8FAFC' : '#0F172A';
    const textSecondary = isDark ? '#94A3B8' : '#64748B';

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: pageBg }} edges={['top']}>
            <View style={{
                backgroundColor: headerBg,
                paddingHorizontal: 32,
                height: 100,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <View>
                    <Text style={{
                        fontSize: 12,
                        fontWeight: '800',
                        color: textSecondary,
                        letterSpacing: 2,
                        textTransform: 'uppercase',
                        marginBottom: 4
                    }}>
                        Einstellungen
                    </Text>
                    <Text style={{
                        fontSize: 34,
                        fontFamily: 'PlusJakartaSans_800ExtraBold',
                        color: textPrimary,
                        letterSpacing: -1
                    }}>
                        Profil
                    </Text>
                </View>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                className="flex-1 px-6 pt-6"
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 100, maxWidth: 800, alignSelf: 'center', width: '100%' }}
                automaticallyAdjustKeyboardInsets={true}
            >
                {/* Account Section */}
                <Animated.View entering={FadeInDown.delay(100).duration(800)}>
                    <View className="bg-white dark:bg-slate-900 glass rounded-[40px] p-8 mb-8 items-center shadow-premium">
                        <View className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full items-center justify-center mb-6 border border-blue-100 dark:border-blue-800">
                            <User size={48} color="#2563EB" />
                        </View>
                        <Text className="text-2xl font-black text-text dark:text-zinc-50 mb-2">
                            {user ? user.email?.split('@')[0] : 'Anonymer Benutzer'}
                        </Text>
                        <Text className="text-sm font-medium text-textLight dark:text-zinc-400 text-center mb-8 px-4 opacity-70">
                            {user
                                ? `Angemeldet als ${user.email}`
                                : 'Deine Daten werden derzeit lokal gespeichert. Melde dich an, um sie zu synchronisieren.'}
                        </Text>

                        {user ? (
                            <View className="flex-row gap-x-4 w-full">
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={handleSync}
                                    disabled={isSyncing}
                                    className="bg-blue-50 dark:bg-blue-900/20 flex-1 py-4 rounded-2xl items-center flex-row justify-center border border-blue-100 dark:border-blue-900/30"
                                >
                                    {isSyncing ? <ActivityIndicator size="small" color="#2563EB" /> : <RefreshCw size={18} color="#2563EB" style={{ marginRight: 8 }} />}
                                    <Text className="text-primary font-bold text-base">Sync</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={handleSignOut}
                                    className="bg-red-50 dark:bg-red-900/20 flex-1 py-4 rounded-2xl items-center flex-row justify-center border border-red-100 dark:border-red-900/30"
                                >
                                    <LogOut size={18} color="#EF4444" style={{ marginRight: 8 }} />
                                    <Text className="text-red-500 font-bold text-base">Logout</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => {
                                    haptics.selection();
                                    router.push('/auth/login' as any);
                                }}
                                className="bg-primary w-full py-5 rounded-2xl items-center shadow-lg shadow-primary/30"
                            >
                                <Text className="text-white font-bold text-lg">Anmelden / Registrieren</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </Animated.View>

                {/* Body Metrics Section with modern grid */}
                <Animated.View entering={FadeInDown.delay(200).duration(800)}>
                    <View className="bg-white dark:bg-slate-900 glass rounded-[40px] p-8 mb-8 shadow-premium">
                        <View className="flex-row items-center gap-x-3 mb-8">
                            <View className="w-1 h-6 bg-primary rounded-full" />
                            <Text className="text-xs font-black text-textLight dark:text-zinc-500 uppercase tracking-[4px]">Biometrie</Text>
                        </View>

                        <View className="space-y-6">
                            <View className="flex-row items-center justify-between pb-6 border-b border-border">
                                <View className="flex-row items-center gap-x-4">
                                    <View className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <User size={20} color="#2563EB" strokeWidth={2.5} />
                                    </View>
                                    <Text className="text-[17px] font-bold text-text dark:text-zinc-50">Geschlecht</Text>
                                </View>
                                <View className="w-32">
                                    <SegmentedControl
                                        options={[{ label: 'M', value: 'male' }, { label: 'W', value: 'female' }]}
                                        value={userProfile.gender}
                                        onChange={(v) => handleUpdateProfile({ gender: v })}
                                        isDark={isDark}
                                    />
                                </View>
                            </View>

                            <View className="flex-row items-center justify-between pb-6 border-b border-border">
                                <View className="flex-row items-center gap-x-4">
                                    <View className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                                        <Activity size={20} color="#6366F1" strokeWidth={2.5} />
                                    </View>
                                    <Text className="text-[17px] font-bold text-text dark:text-zinc-50">Alter</Text>
                                </View>
                                <ProfileNumberInput
                                    initialValue={userProfile.age}
                                    onUpdate={(val) => handleUpdateProfile({ age: val })}
                                    unit="Jahre"
                                    maxLength={3}
                                />
                            </View>

                            <View className="flex-row items-center justify-between pb-6 border-b border-border">
                                <View className="flex-row items-center gap-x-4">
                                    <View className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                        <Ruler size={20} color="#10B981" strokeWidth={2.5} />
                                    </View>
                                    <Text className="text-[17px] font-bold text-text dark:text-zinc-50">Größe</Text>
                                </View>
                                <ProfileNumberInput
                                    initialValue={userProfile.height}
                                    onUpdate={(val) => handleUpdateProfile({ height: val })}
                                    unit="cm"
                                    maxLength={3}
                                />
                            </View>

                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center gap-x-4">
                                    <View className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                        <Scale size={20} color="#8B5CF6" strokeWidth={2.5} />
                                    </View>
                                    <Text className="text-[17px] font-bold text-text dark:text-zinc-50">Gewicht</Text>
                                </View>
                                <ProfileNumberInput
                                    initialValue={userProfile.weight}
                                    onUpdate={(val) => handleUpdateProfile({ weight: val })}
                                    unit="kg"
                                    maxLength={3}
                                />
                            </View>
                        </View>
                    </View>
                </Animated.View>

                {/* Macro Goals Section */}
                <Animated.View entering={FadeInDown.delay(300).duration(800)}>
                    <AnalyticsSection isDark={isDark} />
                </Animated.View>

                {/* Preferences Section at bottom */}
                <Animated.View entering={FadeInDown.delay(400).duration(800)}>
                    <View className="bg-white dark:bg-slate-900 glass rounded-[40px] p-8 mb-8 shadow-premium">
                        <View className="flex-row items-center justify-between mb-8">
                            <View className="flex-row items-center gap-x-3">
                                <View className="w-1 h-6 bg-amber-400 rounded-full" />
                                <Text className="text-xs font-black text-textLight dark:text-zinc-500 uppercase tracking-[4px]">Einstell.</Text>
                            </View>
                            <TouchableOpacity
                                onPress={handleToggleDark}
                                className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-2xl"
                            >
                                {isDark ? <Sun size={20} color="#F59E0B" /> : <Moon size={20} color="#6366F1" />}
                            </TouchableOpacity>
                        </View>

                        <MacroDisplayToggle isDark={isDark} />
                    </View>
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
}
