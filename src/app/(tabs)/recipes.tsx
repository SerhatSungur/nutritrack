import { View, Text, ScrollView, ActionSheetIOS, Platform, Alert, Modal, Dimensions } from 'react-native';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLogStore, MealType } from '../../store/useLogStore';
import { useRouter } from 'expo-router';
import { Plus, Search, Info, ChevronRight, X, Trash2, BookOpen } from 'lucide-react-native';
import Animated, { FadeInDown, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { format, isToday, isTomorrow, isYesterday, addDays, subDays, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { useState, useRef, useEffect } from 'react';
import { haptics } from '../../lib/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STATIC_TODAY = new Date();
const STATIC_WEEK_DATES = Array.from({ length: 31 }).map((_, i) => addDays(subDays(STATIC_TODAY, 15), i));

export default function RecipesScreen() {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const recipes = useLogStore((state) => state.recipes);
    const addLog = useLogStore((state) => state.addLog);
    const setDate = useLogStore((state) => state.setDate);
    const deleteRecipe = useLogStore((state) => state.deleteRecipe);
    const router = useRouter();

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [pendingLog, setPendingLog] = useState<{ recipe: typeof recipes[0]; meal: typeof meals[number] } | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date());

    const scrollViewRef = useRef<ScrollView>(null);
    const meals = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

    useEffect(() => {
        if (showDatePicker && scrollViewRef.current) {
            const index = STATIC_WEEK_DATES.findIndex(d => isSameDay(d, selectedDate));
            if (index !== -1) {
                setTimeout(() => {
                    const itemWidth = 64; // 56px width + 8px margin
                    const centerPosition = (index * itemWidth) - (SCREEN_WIDTH / 2) + (itemWidth / 2);
                    scrollViewRef.current?.scrollTo({
                        x: Math.max(0, centerPosition),
                        animated: true
                    });
                }, 100);
            }
        }
    }, [showDatePicker, selectedDate]);

    const handleQuickLog = (recipe: typeof recipes[0]) => {
        const translations = ['Frühstück', 'Mittagessen', 'Abendessen', 'Snack', 'Abbrechen'];

        const promptDate = (mealIndex: number) => {
            if (mealIndex < 4) {
                setPendingLog({ recipe, meal: meals[mealIndex] });
                setSelectedDate(useLogStore.getState().currentDate);
                setShowDatePicker(true);
            }
        };

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: translations,
                    cancelButtonIndex: 4,
                    title: 'Wann möchtest du dieses Gericht essen?',
                    message: `Zu welcher Mahlzeit möchtest du "${recipe.name}" hinzufügen?`
                },
                promptDate
            );
        } else {
            Alert.alert(
                'Mahlzeit auswählen',
                `Zu welcher Mahlzeit möchtest du "${recipe.name}" hinzufügen?`,
                [
                    { text: 'Frühstück', onPress: () => promptDate(0) },
                    { text: 'Mittagessen', onPress: () => promptDate(1) },
                    { text: 'Abendessen', onPress: () => promptDate(2) },
                    { text: 'Snack', onPress: () => promptDate(3) },
                    { text: 'Abbrechen', style: 'cancel' }
                ],
                { cancelable: true }
            );
        }
    };

    const confirmLog = () => {
        if (!pendingLog) return;
        addLog({
            meal_type: pendingLog.meal,
            name: pendingLog.recipe.name,
            calories: pendingLog.recipe.totalCalories,
            protein: pendingLog.recipe.totalProtein,
            carbs: pendingLog.recipe.totalCarbs,
            fat: pendingLog.recipe.totalFat,
            date: selectedDate.toISOString().split('T')[0]
        });
        setDate(selectedDate);
        setShowDatePicker(false);
        setPendingLog(null);
        router.push('/');
    };

    return (
        <SafeAreaView className="flex-1 bg-card dark:bg-zinc-900" edges={['top']}>
            {/* Header */}
            <View style={{
                backgroundColor: isDark ? '#18181B' : '#FFFFFF',
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
                    Meine Rezepte
                </Text>
                <View
                    onStartShouldSetResponder={() => true}
                    onResponderRelease={() => {
                        haptics.lightImpact();
                        router.push('/recipes/create');
                    }}
                    style={{ backgroundColor: '#2563EB', padding: 8, borderRadius: 999 }}
                >
                    <Plus size={24} color="#FFFFFF" />
                </View>
            </View>

            <ScrollView className="flex-1 bg-background dark:bg-zinc-950 pt-4" showsVerticalScrollIndicator={false}>
                <View className="w-full md:max-w-3xl md:mx-auto px-4">
                    {recipes.length === 0 ? (
                        <View className="items-center justify-center mt-20">
                            <BookOpen size={64} color="#D1D5DB" className="mb-4" />
                            <Text className="text-lg font-medium text-textLight dark:text-zinc-400">Noch keine Rezepte erstellt.</Text>
                            <Text className="text-sm text-gray-400 mt-2 text-center px-8">
                                Tippe oben auf das Plus, um dein erstes Rezept zu erstellen und dessen Makros genau zu berechnen.
                            </Text>
                        </View>
                    ) : (
                        recipes.map((recipe, index) => (
                            <Animated.View
                                key={recipe.id}
                                entering={FadeInDown.delay(index * 100).springify()}
                                className="mb-4"
                            >
                                <View
                                    onStartShouldSetResponder={() => true}
                                    onResponderRelease={() => router.push(`/recipes/${recipe.id}`)}
                                    className="bg-card dark:bg-zinc-900 rounded-3xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
                                >
                                    <View className="flex-row justify-between items-start mb-4">
                                        <View className="flex-1 pr-4">
                                            <Text className="text-xl font-extrabold text-text dark:text-zinc-50 mb-1 leading-tight">{recipe.name}</Text>
                                            <Text className="text-sm font-medium text-textLight dark:text-zinc-400">{recipe.ingredients.length} {recipe.ingredients.length === 1 ? 'Zutat' : 'Zutaten'}</Text>
                                        </View>
                                        <View className="flex-row items-center">
                                            <View
                                                onStartShouldSetResponder={() => true}
                                                onResponderRelease={() => {
                                                    haptics.warning();
                                                    Alert.alert(
                                                        'Rezept löschen',
                                                        'Möchtest du dieses Rezept wirklich dauerhaft löschen?',
                                                        [
                                                            { text: 'Abbrechen', style: 'cancel' },
                                                            {
                                                                text: 'Löschen',
                                                                style: 'destructive',
                                                                onPress: () => {
                                                                    deleteRecipe(recipe.id);
                                                                    haptics.success();
                                                                }
                                                            }
                                                        ]
                                                    );
                                                }}
                                                className="p-2 -mr-1"
                                            >
                                                <Trash2 size={18} color={isDark ? '#71717A' : '#9CA3AF'} />
                                            </View>
                                            <View
                                                onStartShouldSetResponder={() => true}
                                                onResponderRelease={async () => {
                                                    haptics.selection();
                                                    await handleQuickLog(recipe);
                                                }}
                                                className="bg-primary/10 w-10 h-10 rounded-2xl items-center justify-center"
                                            >
                                                <Plus size={20} color="#2563EB" />
                                            </View>
                                            <ChevronRight size={20} color={isDark ? '#3F3F46' : '#D1D5DB'} />
                                        </View>
                                    </View>

                                    <View className="flex-row justify-between items-center border-t border-gray-100 dark:border-zinc-800 pt-4">
                                        <View className="flex-row gap-x-4">
                                            {Object.entries(recipe.totalCalories > 0 ? {
                                                Cal: recipe.totalCalories,
                                                Pro: recipe.totalProtein,
                                                Carb: recipe.totalCarbs,
                                                Fat: recipe.totalFat
                                            } : { Cal: 0, Pro: 0, Carb: 0, Fat: 0 }).map(([label, value]) => (
                                                <View key={label}>
                                                    <Text className="text-xs text-textLight dark:text-zinc-500 font-bold mb-0.5 uppercase tracking-tighter">{label}</Text>
                                                    <Text className="text-sm font-extrabold text-text dark:text-zinc-50">{Math.round(value as number)}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                </View>
                            </Animated.View>
                        ))
                    )}
                    <View className="h-12" />
                </View>
            </ScrollView>

            <Modal visible={showDatePicker} transparent animationType="fade">
                <View className="flex-1 justify-end bg-black/40">
                    <View
                        onStartShouldSetResponder={() => true}
                        onResponderRelease={() => setShowDatePicker(false)}
                        className="flex-1"
                    />
                    <Animated.View entering={SlideInDown.springify()} exiting={SlideOutDown} className="bg-card dark:bg-zinc-900 rounded-t-3xl pt-6 pb-12 shadow-2xl">
                        <View className="px-6 flex-row justify-between items-center mb-6">
                            <View
                                onStartShouldSetResponder={() => true}
                                onResponderRelease={() => setShowDatePicker(false)}
                            >
                                <Text className="text-textLight dark:text-zinc-400 text-lg font-medium">Abbrechen</Text>
                            </View>
                            <Text className="text-text dark:text-zinc-50 font-bold text-lg">Datum wählen</Text>
                            <View
                                onStartShouldSetResponder={() => true}
                                onResponderRelease={confirmLog}
                            >
                                <Text className="text-primary font-bold text-lg">Hinzufügen</Text>
                            </View>
                        </View>

                        <View className="px-6 flex-row justify-between items-center mb-4 w-full">
                            <Text className="text-xl font-bold text-text dark:text-zinc-50 capitalize">
                                {format(selectedDate, 'MMMM yyyy', { locale: de })}
                            </Text>
                            <View
                                onStartShouldSetResponder={() => true}
                                onResponderRelease={() => setSelectedDate(new Date())}
                                className="bg-gray-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full"
                            >
                                <Text className="text-xs font-semibold text-textLight dark:text-zinc-400">Heute</Text>
                            </View>
                        </View>

                        <View className="mb-2 w-full">
                            <ScrollView
                                ref={scrollViewRef}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                className="flex-row px-6"
                                contentContainerStyle={{ paddingRight: 48 }}
                            >
                                {STATIC_WEEK_DATES.map((date) => {
                                    const selected = isSameDay(date, selectedDate);
                                    let textColor = colorScheme === 'dark' ? '#FAFAFA' : '#09090B';
                                    let subColor = colorScheme === 'dark' ? '#71717A' : '#71717A';
                                    let bgColor = colorScheme === 'dark' ? '#18181B' : '#F9FAFB';
                                    let borderColor = colorScheme === 'dark' ? '#27272A' : '#F3F4F6';

                                    if (selected) {
                                        textColor = '#FFFFFF';
                                        subColor = 'rgba(255,255,255,0.8)';
                                        bgColor = '#2563EB';
                                        borderColor = '#2563EB';
                                    }

                                    return (
                                        <View
                                            key={date.toISOString()}
                                            onStartShouldSetResponder={() => true}
                                            onResponderRelease={() => {
                                                requestAnimationFrame(() => setSelectedDate(date));
                                            }}
                                            style={[
                                                { alignItems: 'center', justifyContent: 'center', marginRight: 8, borderRadius: 14, width: 56, height: 72, borderWidth: 1 },
                                                { backgroundColor: bgColor, borderColor }
                                            ]}
                                        >
                                            <Text style={[{ fontSize: 11, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' }, { color: subColor }]}>
                                                {format(date, 'EEE', { locale: de })}
                                            </Text>
                                            <Text style={[{ fontSize: 18, fontWeight: 'bold' }, { color: textColor }]}>
                                                {format(date, 'd')}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    </Animated.View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
