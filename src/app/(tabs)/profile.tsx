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

    const headerBg = isDark ? '#18181B' : '#FFFFFF';
    const pageBg = isDark ? '#09090B' : '#F4F4F5';

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: headerBg }} edges={['top']}>
            <View style={{
                backgroundColor: headerBg,
                paddingHorizontal: 20,
                height: 70,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Text style={{
                    fontSize: 28,
                    fontFamily: 'PlusJakartaSans_800ExtraBold',
                    color: isDark ? '#FAFAFA' : '#09090B'
                }}>
                    Profil
                </Text>
            </View>

            <ScrollView
                style={{ flex: 1, backgroundColor: pageBg }}
                className="flex-1 px-4 pt-6"
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 100 }}
                automaticallyAdjustKeyboardInsets={true}
            >
                {/* Account Section */}
                <Animated.View entering={FadeInDown.delay(100).duration(600)}>
                    <View className="bg-card dark:bg-zinc-900 rounded-3xl p-5 mb-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] items-center">
                        <View className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full items-center justify-center mb-4">
                            <User size={40} color="#2563EB" />
                        </View>
                        <Text className="text-xl font-bold text-text dark:text-zinc-50 mb-1">
                            {user ? user.email?.split('@')[0] : 'Anonymer Benutzer'}
                        </Text>
                        <Text className="text-sm text-textLight dark:text-zinc-400 text-center mb-6 px-4">
                            {user
                                ? `Angemeldet als ${user.email}`
                                : 'Deine Daten werden derzeit lokal gespeichert. Melde dich an, um sie zu synchronisieren.'}
                        </Text>

                        {user ? (
                            <View className="flex-row gap-x-3 w-100%">
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={handleSync}
                                    disabled={isSyncing}
                                    style={{
                                        backgroundColor: '#EBF2FF',
                                        flex: 1,
                                        paddingVertical: 14,
                                        borderRadius: 12,
                                        alignItems: 'center',
                                        flexDirection: 'row',
                                        justifyContent: 'center',
                                        opacity: isSyncing ? 0.6 : 1
                                    }}
                                >
                                    {isSyncing ? <ActivityIndicator size="small" color="#2563EB" /> : <RefreshCw size={18} color="#2563EB" style={{ marginRight: 8 }} />}
                                    <Text style={{ color: '#2563EB', fontWeight: '700', fontSize: 15 }}>Sync</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={handleSignOut}
                                    style={{
                                        backgroundColor: '#FEE2E2',
                                        flex: 1,
                                        paddingVertical: 14,
                                        borderRadius: 12,
                                        alignItems: 'center',
                                        flexDirection: 'row',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <LogOut size={18} color="#EF4444" style={{ marginRight: 8 }} />
                                    <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 15 }}>Logout</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => {
                                    haptics.selection();
                                    router.push('/auth/login' as any);
                                }}
                                style={{
                                    backgroundColor: '#2563EB',
                                    width: '100%',
                                    paddingVertical: 14,
                                    borderRadius: 12,
                                    alignItems: 'center',
                                    shadowColor: '#3B82F6',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.2,
                                    shadowRadius: 8,
                                    elevation: 4
                                }}
                            >
                                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>Anmelden / Registrieren</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </Animated.View>

                {/* Preferences Section */}
                <Animated.View entering={FadeInDown.delay(200).duration(600)}>
                    <View className="bg-card dark:bg-zinc-900 rounded-3xl p-5 mb-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                        <Text className="text-sm font-bold text-textLight dark:text-zinc-400 uppercase tracking-wider mb-4 ml-1">Einstellungen</Text>

                        <View className="flex-row items-center justify-between py-3 border-b border-gray-100 dark:border-zinc-800">
                            <View className="flex-row items-center gap-x-3">
                                {isDark
                                    ? <Moon size={22} color="#8B5CF6" />
                                    : <Sun size={22} color="#F59E0B" />
                                }
                                <Text className="text-base font-semibold text-text dark:text-zinc-50">Dunkelmodus</Text>
                            </View>
                            <CustomSwitch
                                value={isDark}
                                onValueChange={handleToggleDark}
                            />
                        </View>

                        <MacroDisplayToggle isDark={isDark} />
                    </View>
                </Animated.View>

                {/* Body Metrics Section */}
                <Animated.View entering={FadeInDown.delay(300).duration(600)}>
                    <View className="bg-card dark:bg-zinc-900 rounded-3xl p-5 mb-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                        <Text className="text-sm font-bold text-textLight dark:text-zinc-400 uppercase tracking-wider mb-5 ml-1">Körper & Biometrie</Text>

                        <View className="flex-row items-center justify-between py-3 border-b border-gray-100 dark:border-zinc-800">
                            <View className="flex-row items-center gap-x-3">
                                <User size={20} color="#3B82F6" />
                                <Text className="text-base font-semibold text-text dark:text-zinc-50">Geschlecht</Text>
                            </View>
                            <View className="w-1/2">
                                <SegmentedControl
                                    options={[{ label: 'M', value: 'male' }, { label: 'W', value: 'female' }]}
                                    value={userProfile.gender}
                                    onChange={(v) => handleUpdateProfile({ gender: v })}
                                    isDark={isDark}
                                />
                            </View>
                        </View>

                        <View className="flex-row items-center justify-between py-3 border-b border-gray-100 dark:border-zinc-800">
                            <View className="flex-row items-center gap-x-3">
                                <User size={20} color="#3B82F6" />
                                <Text className="text-base font-semibold text-text dark:text-zinc-50">Alter</Text>
                            </View>
                            <ProfileNumberInput
                                initialValue={userProfile.age}
                                onUpdate={(val) => handleUpdateProfile({ age: val })}
                                unit="Jahre"
                                maxLength={3}
                            />
                        </View>

                        <View className="flex-row items-center justify-between py-3 border-b border-gray-100 dark:border-zinc-800">
                            <View className="flex-row items-center gap-x-3">
                                <Ruler size={20} color="#10B981" />
                                <Text className="text-base font-semibold text-text dark:text-zinc-50">Größe</Text>
                            </View>
                            <ProfileNumberInput
                                initialValue={userProfile.height}
                                onUpdate={(val) => handleUpdateProfile({ height: val })}
                                unit="cm"
                                maxLength={3}
                            />
                        </View>

                        <View className="flex-row items-center justify-between py-3 border-b border-gray-100 dark:border-zinc-800">
                            <View className="flex-row items-center gap-x-3">
                                <Scale size={20} color="#6366F1" />
                                <Text className="text-base font-semibold text-text dark:text-zinc-50">Gewicht</Text>
                            </View>
                            <ProfileNumberInput
                                initialValue={userProfile.weight}
                                onUpdate={(val) => handleUpdateProfile({ weight: val })}
                                unit="kg"
                                maxLength={3}
                            />
                        </View>

                        <View className="py-4 border-b border-gray-100 dark:border-zinc-800">
                            <View className="flex-row items-center gap-x-3 mb-4">
                                <Activity size={20} color="#F59E0B" />
                                <View>
                                    <Text className="text-base font-semibold text-text dark:text-zinc-50">Aktivitätslevel</Text>
                                    <Text className="text-xs text-textLight dark:text-zinc-400">Beeinflusst deinen Kalorienverbrauch</Text>
                                </View>
                            </View>
                            <View className="bg-gray-50 dark:bg-zinc-800/50 p-1.5 rounded-2xl">
                                {ACTIVITY_LEVELS.map((level) => (
                                    <Pressable
                                        key={level.value}
                                        onPress={() => {
                                            haptics.selection();
                                            handleUpdateProfile({ activityLevel: level.value });
                                        }}
                                        className={`flex-row items-center justify-between px-3 py-2.5 rounded-xl mb-1 ${userProfile.activityLevel === level.value ? 'bg-white dark:bg-zinc-700 shadow-sm' : ''}`}
                                    >
                                        <Text className={`text-sm ${userProfile.activityLevel === level.value ? 'font-bold text-primary' : 'text-textLight dark:text-zinc-400'}`}>
                                            {level.label}
                                        </Text>
                                        {userProfile.activityLevel === level.value && <Check size={16} color="#2563EB" />}
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        <View className="py-4">
                            <View className="flex-row items-center gap-x-3 mb-4">
                                <Target size={20} color="#EF4444" />
                                <Text className="text-base font-semibold text-text dark:text-zinc-50">Dein Ziel</Text>
                            </View>
                            <SegmentedControl
                                options={[
                                    { label: 'Abnehmen', value: 'lose' },
                                    { label: 'Halten', value: 'maintain' },
                                    { label: 'Aufbauen', value: 'gain' }
                                ]}
                                value={userProfile.goal}
                                onChange={(v) => handleUpdateProfile({ goal: v })}
                                isDark={isDark}
                            />
                        </View>
                    </View>
                </Animated.View>

                {/* Macro Goals Section */}
                <Animated.View entering={FadeInDown.delay(400).duration(600)}>
                    <View className="bg-card dark:bg-zinc-900 rounded-3xl p-5 mb-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                        <View className="flex-row items-center justify-between mb-5 ml-1">
                            <View className="flex-row items-center gap-x-2">
                                <Target size={20} color="#10B981" />
                                <Text className="text-sm font-bold text-textLight dark:text-zinc-400 uppercase tracking-wider">Tägliche Makro-Ziele</Text>
                            </View>
                            <Pressable
                                onPress={handleAutoCalculate}
                                className="bg-primary/10 px-3 py-2 rounded-full flex-row items-center gap-x-1 active:opacity-70"
                            >
                                <Activity size={14} color="#2563EB" />
                                <Text className="text-[12px] font-bold text-primary">Auto-Berechnen</Text>
                            </Pressable>
                        </View>

                        {[
                            { label: 'Kalorien', key: 'calories' as const, unit: 'kcal', max: 5 },
                            { label: 'Protein', key: 'protein' as const, unit: 'g', max: 3 },
                            { label: 'Kohlenhydrate', key: 'carbs' as const, unit: 'g', max: 3 },
                            { label: 'Fett', key: 'fat' as const, unit: 'g', max: 3 },
                        ].map(({ label, key, unit, max }, i, arr) => (
                            <View key={key} className={`flex-row justify-between items-center py-3 ${i < arr.length - 1 ? 'border-b border-gray-100 dark:border-zinc-800' : ''}`}>
                                <Text className="text-base font-semibold text-text dark:text-zinc-50">{label}</Text>
                                <ProfileNumberInput
                                    initialValue={macroGoals[key]}
                                    onUpdate={(val) => handleUpdateGoal(key, val)}
                                    unit={unit}
                                    maxLength={max}
                                />
                            </View>
                        ))}

                        <View className="mt-4 bg-blue-50 dark:bg-zinc-800/30 p-4 rounded-2xl flex-row items-start gap-x-3">
                            <Info size={18} color="#3B82F6" className="mt-0.5" />
                            <Text className="flex-1 text-xs text-blue-700 dark:text-blue-300 leading-4">
                                Nutze "Auto-Berechnen", um wissenschaftlich fundierte Ziele basierend auf deinen Biometrieangaben zu erhalten.
                            </Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Water Goal Section */}
                <Animated.View entering={FadeInDown.delay(500).duration(600)}>
                    <View className="bg-card dark:bg-zinc-900 rounded-3xl p-5 mb-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                        <View className="flex-row items-center mb-4 ml-1 gap-x-2">
                            <Droplets size={20} color="#3B82F6" />
                            <Text className="text-sm font-bold text-textLight dark:text-zinc-400 uppercase tracking-wider">Wasser-Ziel</Text>
                        </View>
                        <View className="flex-row justify-between items-center py-1">
                            <Text className="text-base font-semibold text-text dark:text-zinc-50">Tagesziel</Text>
                            <ProfileNumberInput
                                initialValue={waterGoal}
                                onUpdate={(val) => setWaterGoal(Math.max(100, val))}
                                unit="ml"
                                maxLength={5}
                            />
                        </View>
                    </View>
                </Animated.View>

                {/* Analytics & Trends */}
                <Animated.View entering={FadeInDown.delay(550).duration(600)}>
                    <AnalyticsSection isDark={isDark} />
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
}
