import {
    View, Text, ScrollView,
    Dimensions, Pressable, TouchableOpacity,
    Modal, FlatList, TextInput,
} from 'react-native';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLogStore, MealType, Recipe } from '../../store/useLogStore';
import { format, subDays, addDays, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { Plus, Droplets, BookOpen, ChevronRight, X, Scale, Info, Check } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { haptics } from '../../lib/haptics';
import { useRef, useEffect, useState, useCallback, memo } from 'react';
import Animated, {
    FadeInDown, FadeIn,
    useSharedValue, withTiming, useAnimatedProps, Easing,
    useAnimatedStyle, interpolate, Extrapolation,
    useAnimatedScrollHandler, withSequence,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STATIC_TODAY = new Date();
const STATIC_WEEK_DATES = Array.from({ length: 31 }).map((_, i) => addDays(subDays(STATIC_TODAY, 15), i));

// ─── Circular Ring Component ──────────────────────────────────────────────────
const MacroRing = memo(({ value, goal, color, size = 72, strokeWidth = 7, label, unit = 'g', isDark }: {
    value: number; goal: number; color: string;
    size?: number; strokeWidth?: number; label: string; unit?: string;
    isDark: boolean;
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const ringScale = useSharedValue(0.4);
    const pulseScale = useSharedValue(1);
    const progress = useSharedValue(0);
    const displayMacroMode = useLogStore((s) => s.displayMacroMode);

    const remaining = Math.max(0, goal - value);
    const displayValue = displayMacroMode === 'remaining' ? remaining : value;

    useEffect(() => {
        progress.value = 0;
        ringScale.value = withTiming(1, { duration: 800, easing: Easing.bezier(0.33, 1, 0.68, 1) });
        progress.value = withTiming(Math.min(value / Math.max(goal, 1), 1), {
            duration: 1200, easing: Easing.bezier(0.33, 1, 0.68, 1),
        });
        pulseScale.value = withSequence(
            withTiming(1.12, { duration: 150, easing: Easing.out(Easing.quad) }),
            withTiming(1, { duration: 300, easing: Easing.bezier(0.33, 1, 0.68, 1) })
        );
    }, [value, goal]);

    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset: circumference * (1 - progress.value),
    }));

    const ringStyle = useAnimatedStyle(() => ({
        transform: [{ scale: ringScale.value * pulseScale.value }],
        opacity: interpolate(ringScale.value, [0.4, 0.8, 1], [0, 0.6, 1]),
    }));

    return (
        <View style={{ alignItems: 'center' }}>
            <Animated.View style={[{ width: size, height: size }, ringStyle]}>
                <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
                    <Circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} strokeOpacity={0.15} fill="none" />
                    <AnimatedCircle
                        cx={size / 2} cy={size / 2} r={radius}
                        stroke={color} strokeWidth={strokeWidth} fill="none"
                        strokeDasharray={`${circumference} ${circumference}`}
                        animatedProps={animatedProps}
                        strokeLinecap="round"
                    />
                </Svg>
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: isDark ? '#FAFAFA' : '#09090B' }}>
                        {displayValue}{unit}
                    </Text>
                </View>
            </Animated.View>
            <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: isDark ? '#A1A1AA' : '#71717A', marginTop: 3 }}>{label}</Text>
        </View>
    );
});

// ─── Large Calorie Ring ────────────────────────────────────────────────────────
const CalorieRing = memo(({ consumed, goal, isDark }: { consumed: number; goal: number; isDark: boolean }) => {
    const size = 130;
    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const ringScale = useSharedValue(0.4);
    const pulseScale = useSharedValue(1);
    const progress = useSharedValue(0);
    const displayMacroMode = useLogStore((s) => s.displayMacroMode);
    const remaining = Math.max(0, goal - consumed);

    const displayValue = displayMacroMode === 'remaining' ? remaining : consumed;
    const labelSuffix = displayMacroMode === 'remaining' ? 'übrig' : 'gegessen';

    useEffect(() => {
        progress.value = 0;
        ringScale.value = withTiming(1, { duration: 1000, easing: Easing.bezier(0.33, 1, 0.68, 1) });
        progress.value = withTiming(Math.min(consumed / Math.max(goal, 1), 1), {
            duration: 1500, easing: Easing.bezier(0.33, 1, 0.68, 1),
        });
        pulseScale.value = withSequence(
            withTiming(1.08, { duration: 150, easing: Easing.out(Easing.quad) }),
            withTiming(1, { duration: 300, easing: Easing.bezier(0.33, 1, 0.68, 1) })
        );
    }, [consumed, goal]);

    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset: circumference * (1 - progress.value),
    }));

    const ringStyle = useAnimatedStyle(() => ({
        transform: [{ scale: ringScale.value * pulseScale.value }],
        opacity: interpolate(ringScale.value, [0.4, 0.8, 1], [0, 0.6, 1]),
    }));

    const overGoal = consumed > goal;

    return (
        <Animated.View style={[{ alignItems: 'center', justifyContent: 'center', width: size, height: size }, ringStyle]}>
            <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
                <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#2563EB" strokeWidth={strokeWidth} strokeOpacity={0.12} fill="none" />
                <AnimatedCircle
                    cx={size / 2} cy={size / 2} r={radius}
                    stroke={overGoal ? '#EF4444' : '#2563EB'}
                    strokeWidth={strokeWidth} fill="none"
                    strokeDasharray={`${circumference} ${circumference}`}
                    animatedProps={animatedProps}
                    strokeLinecap="round"
                />
            </Svg>
            <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 26, fontWeight: '800', color: isDark ? '#FAFAFA' : '#09090B' }}>{displayValue}</Text>
                <Text style={{ fontSize: 11, fontWeight: '600', color: isDark ? '#A1A1AA' : '#71717A' }}>kcal {labelSuffix}</Text>
                <Text style={{ fontSize: 10, color: isDark ? '#71717A' : '#9CA3AF', marginTop: 2 }}>{consumed} / {goal}</Text>
            </View>
        </Animated.View>
    );
});

// ─── Water Card ───────────────────────────────────────────────────────────────
function WaterCard({ isDark, date }: { isDark: boolean, date: string }) {
    const waterHistory = useLogStore((s) => s.waterHistory);
    const waterGoal = useLogStore((s) => s.waterGoal);
    const addWater = useLogStore((s) => s.addWater);

    // Get intake for the specific date
    const waterIntake = waterHistory.find(h => h.date === date)?.value || 0;

    const progress = useSharedValue(0);
    const waveOffset = useSharedValue(0);

    const liters = (waterIntake / 1000).toFixed(1);
    const goalLiters = (waterGoal / 1000).toFixed(1);
    const AMOUNTS = [250, 350, 500];

    useEffect(() => {
        progress.value = withTiming(Math.min(waterIntake / waterGoal, 1), {
            duration: 1000,
            easing: Easing.bezier(0.33, 1, 0.68, 1),
        });
        waveOffset.value = withSequence(
            withTiming(1, { duration: 400 }),
            withTiming(0, { duration: 400 })
        );
    }, [waterIntake, waterGoal]);

    const animatedBarStyle = useAnimatedStyle(() => ({
        width: `${progress.value * 100}%`,
        opacity: interpolate(progress.value, [0, 0.1, 1], [0.3, 1, 1])
    }));

    const waveStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: interpolate(waveOffset.value, [0, 1], [0, -4]) }],
    }));

    return (
        <View className="bg-card dark:bg-zinc-900 rounded-3xl p-6 mb-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100/50 dark:border-zinc-800/50">
            <View className="flex-row justify-between items-center mb-5">
                <View className="flex-row items-center gap-x-3">
                    <View className="bg-blue-50 dark:bg-blue-500/10 w-11 h-11 rounded-2xl items-center justify-center">
                        <Droplets size={22} color="#3B82F6" />
                    </View>
                    <View>
                        <Text className="text-lg font-extrabold text-text dark:text-zinc-50">Wasseraufnahme</Text>
                        <Text className="text-xs font-semibold text-textLight dark:text-zinc-500 uppercase tracking-widest">Tagesziel: {goalLiters}L</Text>
                    </View>
                </View>
                <View className="items-end">
                    <Text className="text-2xl font-black text-primary">{liters}L</Text>
                    <Text className="text-[10px] font-bold text-textLight dark:text-zinc-500 uppercase">Aufgenommen</Text>
                </View>
            </View>

            <View className="h-4 w-full bg-blue-50 dark:bg-blue-950/30 rounded-full overflow-hidden mb-6 border border-blue-100/30 dark:border-blue-900/20">
                <Animated.View
                    style={[{ height: '100%', backgroundColor: '#3B82F6', borderRadius: 9999 }, animatedBarStyle, waveStyle]}
                />
            </View>

            <View className="flex-row gap-x-3">
                {AMOUNTS.map(ml => {
                    const bgColor = isDark ? '#27272A' : '#F9FAFB';
                    const borderColor = isDark ? '#3F3F46' : '#F3F4F6';
                    return (
                        <TouchableOpacity
                            key={ml}
                            activeOpacity={0.7}
                            onPress={() => {
                                const isGoalReached = waterIntake >= waterGoal;
                                addWater(ml, date);
                                if (!isGoalReached && (waterIntake + ml) >= waterGoal) {
                                    haptics.success();
                                } else {
                                    haptics.lightImpact();
                                }
                            }}
                            style={{
                                flex: 1,
                                alignItems: 'center',
                                paddingVertical: 12,
                                backgroundColor: bgColor,
                                borderRadius: 16,
                                borderWidth: 1,
                                borderColor: borderColor,
                            }}
                        >
                            <Text style={{ fontSize: 14, fontWeight: '900', color: isDark ? '#FAFAFA' : '#09090B' }}>+{ml}</Text>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? '#71717A' : '#9CA3AF', textTransform: 'uppercase' }}>ml</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

// ─── Meal Section ─────────────────────────────────────────────────────────────
const MealSection = ({ title, type, onAddPress }: { title: string; type: MealType; onAddPress: (meal: MealType) => void }) => {
    const allLogs = useLogStore((state) => state.logs);
    const currentDate = useLogStore((state) => state.currentDate);
    const logs = allLogs.filter(l =>
        l.meal_type === type && l.date === currentDate.toISOString().split('T')[0]
    );
    const sectionCalories = logs.reduce((sum, log) => sum + log.calories, 0);

    return (
        <View className="bg-card dark:bg-zinc-900 rounded-2xl p-4 mb-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <View className="flex-row justify-between items-center mb-3">
                <Text className="text-lg font-bold text-text dark:text-zinc-50">{title}</Text>
                <Text className="text-lg font-bold text-primary">{sectionCalories} kcal</Text>
            </View>

            {logs.length > 0 ? (
                logs.map((log) => (
                    <View key={log.id} className="flex-row justify-between py-2 border-b border-gray-100 dark:border-zinc-800 last:border-0">
                        <View>
                            <Text className="text-base font-medium text-text dark:text-zinc-50">{log.name}</Text>
                            <Text className="text-sm text-textLight dark:text-zinc-400">
                                P: {log.protein}g · C: {log.carbs}g · F: {log.fat}g
                            </Text>
                        </View>
                        <Text className="font-semibold text-text dark:text-zinc-50">{log.calories}</Text>
                    </View>
                ))
            ) : (
                <Text className="text-textLight dark:text-zinc-400 italic py-2">Noch keine Lebensmittel erfasst.</Text>
            )}

            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                    haptics.lightImpact();
                    onAddPress(type);
                }}
                className="flex-row items-center mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800"
            >
                <Plus size={20} color="#2563EB" />
                <Text className="ml-2 font-semibold text-primary">Rezept hinzufügen</Text>
            </TouchableOpacity>
        </View>
    );
};

// ─── Recipe Picker Modal ───────────────────────────────────────────────────────
function RecipePickerModal({
    visible, mealType, onClose, onCreateNew
}: {
    visible: boolean;
    mealType: MealType | null;
    onClose: () => void;
    onCreateNew: () => void;
}) {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const recipes = useLogStore((s) => s.recipes);
    const allLogs = useLogStore((s) => s.logs);
    const addLog = useLogStore((s) => s.addLog);
    const currentDate = useLogStore((s) => s.currentDate);

    const usageCount = useCallback((name: string) =>
        allLogs.filter(l => l.name === name).length
        , [allLogs]);

    const sorted = [...recipes].sort((a, b) => {
        const diff = usageCount(b.name) - usageCount(a.name);
        if (diff !== 0) return diff;
        return a.name.localeCompare(b.name);
    });

    const handleAdd = (recipe: Recipe) => {
        if (!mealType) return;
        haptics.success();
        addLog({
            meal_type: mealType,
            name: recipe.name,
            calories: recipe.totalCalories,
            protein: recipe.totalProtein,
            carbs: recipe.totalCarbs,
            fat: recipe.totalFat,
            date: currentDate.toISOString().split('T')[0],
        });
        onClose();
    };

    const mealLabels: Record<MealType, string> = {
        breakfast: 'Frühstück',
        lunch: 'Mittagessen',
        dinner: 'Abendessen',
        snack: 'Snacks',
    };

    const sheetBg = isDark ? '#18181B' : '#FFFFFF';
    const textPrimary = isDark ? '#FAFAFA' : '#09090B';
    const textSecondary = isDark ? '#A1A1AA' : '#71717A';
    const border = isDark ? '#27272A' : '#F3F4F6';

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView style={{ flex: 1, backgroundColor: sheetBg }} edges={['top']}>
                <View style={{
                    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 20,
                    borderBottomWidth: 1, borderBottomColor: border
                }}>
                    <View>
                        <Text style={{ fontSize: 24, fontWeight: '800', color: textPrimary }}>Rezept wählen</Text>
                        {mealType && (
                            <Text style={{ fontSize: 14, color: textSecondary, marginTop: 4 }}>
                                Wird zu: {mealLabels[mealType]} hinzugefügt
                            </Text>
                        )}
                    </View>
                    <Pressable
                        onPress={() => {
                            haptics.lightImpact();
                            onClose();
                        }}
                        style={({ pressed }) => ({
                            width: 36, height: 36,
                            backgroundColor: isDark ? '#27272A' : '#F3F4F6',
                            borderRadius: 18, alignItems: 'center', justifyContent: 'center',
                            opacity: pressed ? 0.7 : 1
                        })}
                    >
                        <X size={20} color={textSecondary} />
                    </Pressable>
                </View>

                {sorted.length === 0 ? (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
                        <BookOpen size={48} color={isDark ? '#3F3F46' : '#D1D5DB'} />
                        <Text style={{ fontSize: 17, fontWeight: '600', color: textPrimary, marginTop: 16, marginBottom: 8 }}>Keine Rezepte vorhanden</Text>
                        <Text style={{ fontSize: 14, color: textSecondary, textAlign: 'center', marginBottom: 24 }}>
                            Erstelle dein erstes Rezept, um es hier schnell zu einem Gericht hinzuzufügen.
                        </Text>
                        <Pressable
                            onPress={() => {
                                haptics.lightImpact();
                                onCreateNew();
                            }}
                            style={({ pressed }) => ({
                                backgroundColor: '#2563EB',
                                paddingHorizontal: 24,
                                paddingVertical: 12,
                                borderRadius: 14,
                                opacity: pressed ? 0.8 : 1
                            })}
                        >
                            <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15 }}>+ Neues Rezept erstellen</Text>
                        </Pressable>
                    </View>
                ) : (
                    <FlatList
                        data={sorted}
                        keyExtractor={(r) => r.id}
                        contentContainerStyle={{ padding: 16 }}
                        renderItem={({ item: recipe }) => (
                            <Pressable
                                onPress={() => handleAdd(recipe)}
                                style={({ pressed }) => ({
                                    backgroundColor: isDark ? '#27272A' : '#F9FAFB',
                                    borderRadius: 18, padding: 18, marginBottom: 12,
                                    flexDirection: 'row', alignItems: 'center',
                                    opacity: pressed ? 0.7 : 1
                                })}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 17, fontWeight: '800', color: textPrimary, marginBottom: 4 }}>{recipe.name}</Text>
                                    <Text style={{ fontSize: 13, color: textSecondary }}>
                                        {recipe.totalCalories} kcal · P {recipe.totalProtein}g · K {recipe.totalCarbs}g · F {recipe.totalFat}g
                                    </Text>
                                    <Text style={{ fontSize: 12, color: isDark ? '#52525B' : '#9CA3AF', marginTop: 4 }}>
                                        {recipe.ingredients.length} {recipe.ingredients.length === 1 ? 'Zutat' : 'Zutaten'}
                                    </Text>
                                </View>
                                <ChevronRight size={20} color={isDark ? '#52525B' : '#D1D5DB'} />
                            </Pressable>
                        )}
                        ListFooterComponent={
                            <Pressable
                                onPress={onCreateNew}
                                style={({ pressed }) => ({
                                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                                    paddingVertical: 14, borderRadius: 14, marginTop: 4,
                                    borderWidth: 1.5, borderColor: '#2563EB', borderStyle: 'dashed',
                                    opacity: pressed ? 0.7 : 1
                                })}
                            >
                                <Plus size={18} color="#2563EB" />
                                <Text style={{ marginLeft: 6, color: '#2563EB', fontWeight: '700', fontSize: 14 }}>Neues Rezept erstellen</Text>
                            </Pressable>
                        }
                    />
                )}
            </SafeAreaView>
        </Modal>
    );
}

// ─── Dashboard Screen ─────────────────────────────────────────────────────────
export default function DashboardScreen() {
    const currentDate = useLogStore((state) => state.currentDate);
    const setDate = useLogStore((state) => state.setDate);
    const macroGoals = useLogStore((state) => state.macroGoals);
    const allLogs = useLogStore((state) => state.logs);
    const router = useRouter();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [pickerMeal, setPickerMeal] = useState<MealType | null>(null);
    const pickerVisible = pickerMeal !== null;
    const openPicker = (meal: MealType) => setPickerMeal(meal);
    const closePicker = () => setPickerMeal(null);
    const openCreate = () => {
        closePicker();
        setTimeout(() => router.push({ pathname: '/recipes/create', params: { defaultMeal: pickerMeal ?? 'breakfast' } }), 200);
    };

    const totals = (() => {
        const targetDate = currentDate.toISOString().split('T')[0];
        return allLogs
            .filter(l => l.date === targetDate)
            .reduce((acc, l) => ({
                calories: acc.calories + l.calories,
                protein: acc.protein + l.protein,
                carbs: acc.carbs + l.carbs,
                fat: acc.fat + l.fat,
            }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    })();

    const dateScrollRef = useRef<ScrollView>(null);
    const scrollY = useSharedValue(0);

    useEffect(() => {
        const index = STATIC_WEEK_DATES.findIndex(d => isSameDay(d, currentDate));
        if (index !== -1) {
            setTimeout(() => {
                const itemWidth = 56;
                const center = index * itemWidth - SCREEN_WIDTH / 2 + itemWidth / 2;
                dateScrollRef.current?.scrollTo({ x: Math.max(0, center), animated: false });
            }, 100);
        }
    }, [currentDate]);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            'worklet';
            scrollY.value = event.contentOffset.y;
        },
    });

    const headerFadeStyle = useAnimatedStyle(() => ({
        opacity: interpolate(scrollY.value, [150, 240], [1, 0], Extrapolation.CLAMP),
    }));

    const cardBg = isDark ? '#18181B' : '#FFFFFF';
    const pageBg = isDark ? '#09090B' : '#F4F4F5';
    const textPrimary = isDark ? '#FAFAFA' : '#09090B';
    const textSecondary = isDark ? '#A1A1AA' : '#71717A';
    const dateBg = isDark ? '#27272A' : '#F9FAFB';
    const dateBorder = isDark ? '#3F3F46' : '#F3F4F6';

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: cardBg }} edges={['top']}>
            <View style={{
                backgroundColor: cardBg,
                paddingHorizontal: 20,
                height: 70,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 10,
            }}>
                <Text style={{
                    fontSize: 28,
                    fontFamily: 'PlusJakartaSans_800ExtraBold',
                    color: textPrimary
                }}>
                    {format(currentDate, 'MMMM yyyy', { locale: de })}
                </Text>
                <Pressable
                    onPress={() => {
                        haptics.lightImpact();
                        setDate(new Date());
                    }}
                    style={({ pressed }) => ({
                        backgroundColor: isDark ? '#27272A' : '#F3F4F6',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 999,
                        opacity: pressed ? 0.7 : 1
                    })}
                >
                    <Text style={{ fontSize: 12, fontWeight: '600', color: textSecondary }}>Heute</Text>
                </Pressable>
            </View>

            <AnimatedScrollView
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 24 }}
                style={{ flex: 1, backgroundColor: cardBg }}
            >
                <Animated.View style={headerFadeStyle}>
                    <ScrollView
                        ref={dateScrollRef}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
                    >
                        {STATIC_WEEK_DATES.map((date) => {
                            const selected = isSameDay(date, currentDate);
                            return (
                                <Pressable
                                    key={date.toISOString()}
                                    onPress={() => {
                                        haptics.selection();
                                        setDate(date);
                                    }}
                                    style={({ pressed }) => ([
                                        { alignItems: 'center', justifyContent: 'center', marginRight: 8, borderRadius: 14, width: 48, height: 56 },
                                        selected
                                            ? { backgroundColor: '#2563EB' }
                                            : { backgroundColor: dateBg, borderWidth: 1, borderColor: dateBorder },
                                        { opacity: pressed ? 0.7 : 1 }
                                    ])}
                                >
                                    <Text style={{ fontSize: 11, fontWeight: '500', marginBottom: 2, color: selected ? 'rgba(255,255,255,0.8)' : textSecondary }}>
                                        {format(date, 'EEE', { locale: de })}
                                    </Text>
                                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: selected ? '#FFFFFF' : textPrimary }}>
                                        {format(date, 'd')}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>

                    <View style={{ alignItems: 'center', paddingHorizontal: 20, paddingTop: 4, paddingBottom: 20 }}>
                        <CalorieRing consumed={totals.calories} goal={macroGoals.calories} isDark={isDark} />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 16 }}>
                            <MacroRing value={totals.protein} goal={macroGoals.protein} color="#3B82F6" label="Protein" isDark={isDark} />
                            <MacroRing value={totals.carbs} goal={macroGoals.carbs} color="#F59E0B" label="Kohlenhydrate" isDark={isDark} />
                            <MacroRing value={totals.fat} goal={macroGoals.fat} color="#EF4444" label="Fett" isDark={isDark} />
                        </View>
                    </View>
                </Animated.View>

                <View style={{ backgroundColor: pageBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 24, paddingHorizontal: 16, minHeight: 800 }}>
                    <Animated.View entering={FadeInDown.delay(300).duration(600)}>
                        <WaterCard isDark={isDark} date={currentDate.toISOString().split('T')[0]} />
                    </Animated.View>

                    <View className="flex-row items-center gap-x-2 mb-4 ml-1">
                        <BookOpen size={20} color={textSecondary} />
                        <Text className="text-sm font-bold text-textLight dark:text-zinc-500 uppercase tracking-widest">Mahlzeiten</Text>
                    </View>

                    <Animated.View entering={FadeInDown.delay(500).duration(600)}>
                        <MealSection title="Frühstück" type="breakfast" onAddPress={openPicker} />
                    </Animated.View>
                    <Animated.View entering={FadeInDown.delay(600).duration(600)}>
                        <MealSection title="Mittagessen" type="lunch" onAddPress={openPicker} />
                    </Animated.View>
                    <Animated.View entering={FadeInDown.delay(700).duration(600)}>
                        <MealSection title="Abendessen" type="dinner" onAddPress={openPicker} />
                    </Animated.View>
                    <Animated.View entering={FadeInDown.delay(800).duration(600)}>
                        <MealSection title="Snacks" type="snack" onAddPress={openPicker} />
                    </Animated.View>
                </View>
            </AnimatedScrollView>

            <RecipePickerModal
                visible={pickerVisible}
                mealType={pickerMeal}
                onClose={closePicker}
                onCreateNew={openCreate}
            />
        </SafeAreaView>
    );
}
