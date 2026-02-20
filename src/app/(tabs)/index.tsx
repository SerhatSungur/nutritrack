import { View, Text, ScrollView, TouchableOpacity, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLogStore, MealType } from '../../store/useLogStore';
import { format, subDays, addDays, isToday, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useRef, useEffect } from 'react';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Generate a completely static 31-day rolling window centered around TODAY
// Global scope prevents any React reconciler equality checks from triggering remounts
const STATIC_TODAY = new Date();
const STATIC_WEEK_DATES = Array.from({ length: 31 }).map((_, i) => addDays(subDays(STATIC_TODAY, 15), i));

const MacroBar = ({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) => {
    const percentage = Math.min((value / goal) * 100, 100);
    return (
        <View className="mb-3">
            <View className="flex-row justify-between mb-1">
                <Text className="text-sm font-medium text-textLight dark:text-zinc-400">{label}</Text>
                <Text className="text-sm font-semibold text-text dark:text-zinc-50">{value} / {goal}g</Text>
            </View>
            <View className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <View className={`h-full ${color} rounded-full`} style={{ width: `${percentage}%` }} />
            </View>
        </View>
    );
};

const MealSection = ({ title, type, router }: { title: string; type: MealType; router: any }) => {
    const logs = useLogStore((state) => state.logs).filter((l) => l.meal_type === type);

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
                                P: {log.protein}g • C: {log.carbs}g • F: {log.fat}g
                            </Text>
                        </View>
                        <Text className="font-semibold text-text dark:text-zinc-50">{log.calories}</Text>
                    </View>
                ))
            ) : (
                <Text className="text-textLight dark:text-zinc-400 italic py-2">No items logged yet.</Text>
            )}

            <TouchableOpacity
                onPress={() => router.push({ pathname: '/recipes/create', params: { defaultMeal: type } })}
                className="flex-row items-center mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800"
            >
                <Plus size={20} color="#2563EB" />
                <Text className="ml-2 font-semibold text-primary">Add Food</Text>
            </TouchableOpacity>
        </View>
    );
};

export default function DashboardScreen() {
    const { currentDate, setDate, getDailyTotals, macroGoals } = useLogStore();
    const totals = getDailyTotals();
    const router = useRouter();
    const scrollViewRef = useRef<ScrollView>(null);

    // Automatically trigger native centering animation whenever the active date changes
    useEffect(() => {
        const index = STATIC_WEEK_DATES.findIndex(d => isSameDay(d, currentDate));
        if (index !== -1 && scrollViewRef.current) {
            // Need a tiny delay to ensure the layout has fully mounted
            setTimeout(() => {
                const itemWidth = 56; // 48px width + 8px margin
                const centerPosition = (index * itemWidth) - (SCREEN_WIDTH / 2) + (itemWidth / 2);
                scrollViewRef.current?.scrollTo({
                    x: Math.max(0, centerPosition),
                    animated: true
                });
            }, 100);
        }
    }, [currentDate]);

    return (
        <SafeAreaView className="flex-1 bg-background dark:bg-zinc-950" edges={['top']}>
            <View className="pt-1 pb-3 px-6 bg-card dark:bg-zinc-900 shadow-[0_4px_12px_rgba(0,0,0,0.05)] z-10">

                {/* Date Selector Header (Horizontal Strip) */}
                <View className="mb-4 md:max-w-5xl md:mx-auto w-full">
                    <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-xl font-bold text-text dark:text-zinc-50">
                            {format(currentDate, 'MMMM yyyy')}
                        </Text>
                        <TouchableOpacity onPress={() => setDate(new Date())} className="bg-gray-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full">
                            <Text className="text-xs font-semibold text-textLight dark:text-zinc-400">Today</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView
                        ref={scrollViewRef}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="flex-row"
                    >
                        {STATIC_WEEK_DATES.map((date, index) => {
                            const selected = isSameDay(date, currentDate);
                            return (
                                <View
                                    key={date.toISOString()}
                                    onStartShouldSetResponder={() => true}
                                    onResponderRelease={() => {
                                        requestAnimationFrame(() => setDate(date));
                                    }}
                                    style={[
                                        { alignItems: 'center', justifyContent: 'center', marginRight: 8, borderRadius: 14, width: 48, height: 56 },
                                        selected ? { backgroundColor: '#2563EB' } : { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#F3F4F6' }
                                    ]}
                                >
                                    <Text style={[
                                        { fontSize: 11, fontWeight: '500', marginBottom: 2 },
                                        selected ? { color: 'rgba(255,255,255,0.8)' } : { color: '#71717A' }
                                    ]}>
                                        {format(date, 'EEE')}
                                    </Text>
                                    <Text style={[
                                        { fontSize: 16, fontWeight: 'bold' },
                                        selected ? { color: '#FFFFFF' } : { color: '#09090B' }
                                    ]}>
                                        {format(date, 'd')}
                                    </Text>
                                </View>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* High Level Macros & Bars Container */}
                <View className="md:flex-row md:justify-between w-full md:gap-x-8">
                    {/* High Level Macros */}
                    <View className="flex-row justify-between items-end mb-4 md:mb-0 md:w-1/3">
                        <View>
                            <Text className="text-3xl font-extrabold text-text dark:text-zinc-50">{totals.calories}</Text>
                            <Text className="text-sm font-medium text-textLight dark:text-zinc-400">/ {macroGoals.calories} Calories</Text>
                        </View>
                    </View>

                    {/* Macro Bars */}
                    <View className="w-full md:flex-1 md:flex-row md:gap-x-4">
                        <View className="w-full md:flex-1"><MacroBar label="Protein" value={totals.protein} goal={macroGoals.protein} color="bg-blue-500" /></View>
                        <View className="w-full md:flex-1"><MacroBar label="Carbs" value={totals.carbs} goal={macroGoals.carbs} color="bg-green-500" /></View>
                        <View className="w-full md:flex-1"><MacroBar label="Fat" value={totals.fat} goal={macroGoals.fat} color="bg-orange-500" /></View>
                    </View>
                </View>
            </View>

            <ScrollView className="flex-1 px-4 pt-1 md:px-8" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                <View className="md:max-w-5xl md:mx-auto w-full">
                    <View className="md:flex-row md:flex-wrap w-full md:justify-between">
                        <View className="w-full md:w-[48%]"><MealSection title="Breakfast" type="breakfast" router={router} /></View>
                        <View className="w-full md:w-[48%]"><MealSection title="Lunch" type="lunch" router={router} /></View>
                        <View className="w-full md:w-[48%]"><MealSection title="Dinner" type="dinner" router={router} /></View>
                        <View className="w-full md:w-[48%]"><MealSection title="Snacks" type="snack" router={router} /></View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
