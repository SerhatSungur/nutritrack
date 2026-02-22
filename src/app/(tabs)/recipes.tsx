import { View, Text, ScrollView, ActionSheetIOS, Platform, Alert, Modal, Dimensions, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLogStore, MealType } from '../../store/useLogStore';
import { useRouter } from 'expo-router';
import { Plus, Search, Info, ChevronRight, X, BookOpen, DownloadCloud } from 'lucide-react-native';
import Animated, { FadeInDown, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { format, isToday, isTomorrow, isYesterday, addDays, subDays, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { useState, useRef, useEffect, memo } from 'react';
import { haptics } from '../../lib/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STATIC_TODAY = new Date();
const STATIC_WEEK_DATES = Array.from({ length: 31 }).map((_, i) => addDays(subDays(STATIC_TODAY, 15), i));

const SegmentedControl = memo(({ options, value, onChange, isDark }: { options: { label: string; value: any }[]; value: any; onChange: (val: any) => void; isDark: boolean; }) => (
    <View className="flex-row bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl">
        {options.map((opt) => {
            const isSelected = value === opt.value;
            return (
                <TouchableOpacity
                    key={opt.value}
                    activeOpacity={0.7}
                    onPress={() => { haptics.selection(); onChange(opt.value); }}
                    style={{
                        flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center',
                        backgroundColor: isSelected ? (isDark ? '#3F3F46' : '#FFFFFF') : 'transparent',
                        shadowColor: isSelected ? '#000' : 'transparent',
                        shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: isSelected ? 1 : 0
                    }}
                >
                    <Text style={{ fontSize: 13, fontWeight: isSelected ? '700' : '600', color: isSelected ? '#2563EB' : (isDark ? '#71717A' : '#6B7280') }}>{opt.label}</Text>
                </TouchableOpacity>
            );
        })}
    </View>
));

export default function RecipesScreen() {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const recipes = useLogStore((state) => state.recipes);
    const addLog = useLogStore((state) => state.addLog);
    const setDate = useLogStore((state) => state.setDate);
    const addRecipe = useLogStore((state) => state.addRecipe);
    const deleteRecipe = useLogStore((state) => state.deleteRecipe);
    const router = useRouter();

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [pendingLog, setPendingLog] = useState<{ recipe: typeof recipes[0]; meal: typeof meals[number] } | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewType, setViewType] = useState<'mine' | 'discover'>('mine');
    const [searchQuery, setSearchQuery] = useState('');
    const [communityRecipes, setCommunityRecipes] = useState<typeof recipes>([]);
    const [isLoadingCommunity, setIsLoadingCommunity] = useState(false);

    const scrollViewRef = useRef<ScrollView>(null);
    const meals = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

    // Fetch community recipes when discovery tab is selected
    useEffect(() => {
        if (viewType === 'discover') {
            const loadCommunity = async () => {
                setIsLoadingCommunity(true);
                const { syncService } = require('../../lib/syncService');
                const results = await syncService.fetchPublicRecipes();
                setCommunityRecipes(results);
                setIsLoadingCommunity(false);
            };
            loadCommunity();
        }
    }, [viewType]);

    const activeRecipes = (viewType === 'mine' ? recipes : communityRecipes)
        .filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name));

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

    const handleImport = (recipe: typeof recipes[0]) => {
        haptics.success();
        addRecipe({
            name: `${recipe.name} (Kopie)`,
            ingredients: recipe.ingredients,
            is_public: false
        });
        Alert.alert(
            'Erfolg',
            `"${recipe.name}" wurde zu deinen Rezepten hinzugefügt.`,
            [{ text: 'OK' }]
        );
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

    const pageBg = isDark ? '#09090B' : '#F8FAFC'; // Slate-50 for light mode depth

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: pageBg }} edges={['top']}>
            {/* Header */}
            <View style={{
                backgroundColor: pageBg,
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
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                        haptics.lightImpact();
                        router.push('/recipes/create');
                    }}
                    style={{
                        backgroundColor: '#2563EB',
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Plus size={24} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            <View style={{ backgroundColor: pageBg }} className="px-5 pt-2 pb-4">
                <View className="mb-4">
                    <SegmentedControl
                        options={[
                            { label: 'Eigene', value: 'mine' },
                            { label: 'Entdecken', value: 'discover' }
                        ]}
                        value={viewType}
                        onChange={setViewType}
                        isDark={isDark}
                    />
                </View>

                <View className="flex-row items-center bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl px-4 py-2">
                    <Search size={18} color={isDark ? '#71717A' : '#9CA3AF'} />
                    <TextInput
                        placeholder={viewType === 'mine' ? "Meine Rezepte durchsuchen..." : "Community-Rezepte finden..."}
                        placeholderTextColor={isDark ? '#52525B' : '#9CA3AF'}
                        className="flex-1 ml-3 text-base text-text dark:text-zinc-50"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            <ScrollView
                ref={scrollViewRef}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                className="flex-1 bg-background dark:bg-zinc-950"
            >
                <View className="px-5 pt-4">
                    {isLoadingCommunity && viewType === 'discover' ? (
                        <View className="py-20 items-center">
                            <ActivityIndicator size="large" color="#2563EB" />
                            <Text className="text-textLight dark:text-zinc-400 mt-4 font-medium italic">Inspiration wird geladen...</Text>
                        </View>
                    ) : activeRecipes.length > 0 ? (
                        activeRecipes.map((recipe, index) => (
                            <Animated.View
                                key={recipe.id}
                                entering={FadeInDown.delay(index * 50).springify()}
                                className="mb-5"
                            >
                                <TouchableOpacity
                                    activeOpacity={0.9}
                                    onPress={() => router.push(`/recipes/${recipe.id}`)}
                                    className="bg-white dark:bg-zinc-900 rounded-[24px] p-5 shadow-sm border border-gray-100 dark:border-white/5"
                                >
                                    <View className="flex-row justify-between items-start mb-4">
                                        <View className="flex-1 pr-2">
                                            <Text className="text-xl font-extrabold text-text dark:text-zinc-50 mb-1.5 leading-tight tracking-tight">{recipe.name}</Text>
                                            <View className="flex-row items-center gap-x-2">
                                                <View className="bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-lg">
                                                    <Text className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                                                        {recipe.ingredients.length} {recipe.ingredients.length === 1 ? 'Zutat' : 'Zutaten'}
                                                    </Text>
                                                </View>
                                                {recipe.is_public && (
                                                    <View className="bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-lg flex-row items-center gap-x-1">
                                                        <View className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                        <Text className="text-[11px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest">Öffentlich</Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>

                                        <View className="flex-row items-center gap-x-3">
                                            <TouchableOpacity
                                                activeOpacity={0.7}
                                                onPress={() => {
                                                    haptics.selection();
                                                    handleQuickLog(recipe);
                                                }}
                                                className="bg-blue-600 dark:bg-blue-600 w-10 h-10 rounded-xl items-center justify-center shadow-lg shadow-blue-600/20"
                                            >
                                                <Plus size={24} color="#FFFFFF" strokeWidth={3} />
                                            </TouchableOpacity>

                                            {viewType === 'discover' && (
                                                <TouchableOpacity
                                                    activeOpacity={0.7}
                                                    onPress={() => handleImport(recipe)}
                                                    className="bg-green-600 dark:bg-green-600 w-10 h-10 rounded-xl items-center justify-center shadow-lg shadow-green-600/20"
                                                >
                                                    <DownloadCloud size={20} color="#FFFFFF" strokeWidth={2.5} />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>

                                    <View className="flex-row items-center justify-between border-t border-gray-100 dark:border-zinc-800 pt-4">
                                        <View className="flex-row gap-x-5">
                                            {[
                                                { label: 'KCAL', val: recipe.totalCalories, color: '#2563EB' },
                                                { label: 'PROT', val: recipe.totalProtein, color: '#10B981' },
                                                { label: 'KH', val: recipe.totalCarbs, color: '#F59E0B' },
                                                { label: 'FETT', val: recipe.totalFat, color: '#EF4444' }
                                            ].map((macro) => (
                                                <View key={macro.label}>
                                                    <Text className="text-[9px] text-textLight dark:text-zinc-500 font-black mb-0.5 tracking-widest">{macro.label}</Text>
                                                    <Text className="text-sm font-black text-text dark:text-zinc-50">{Math.round(macro.val || 0)}</Text>
                                                </View>
                                            ))}
                                        </View>
                                        <ChevronRight size={18} color={isDark ? '#3F3F46' : '#D1D5DB'} />
                                    </View>
                                </TouchableOpacity>
                            </Animated.View>
                        ))
                    ) : (
                        <Animated.View entering={FadeInDown.delay(200).springify()} className="py-24 items-center px-10">
                            <View className="bg-primary/10 p-8 rounded-[40px] mb-8 rotate-12">
                                <BookOpen size={56} color="#2563EB" />
                            </View>
                            <Text className="text-2xl font-black text-text dark:text-zinc-50 text-center tracking-tight mb-3">
                                {viewType === 'mine' ? 'Deine Rezept-Bibliothek' : 'Community entdecken'}
                            </Text>
                            <Text className="text-base text-textLight dark:text-zinc-400 text-center leading-relaxed font-medium">
                                {viewType === 'mine'
                                    ? 'Erstelle deine eigenen Rezepte, um sie blitzschnell zu tracken.\nPerfekt für Meal-Prep!'
                                    : 'Hier findest du bald inspirierende Rezepte aus der globalen Community.'}
                            </Text>

                            {viewType === 'mine' && (
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => {
                                        haptics.success();
                                        router.push('/recipes/create');
                                    }}
                                    className="bg-primary px-10 py-5 rounded-[24px] mt-12 shadow-2xl shadow-primary/40 flex-row items-center gap-x-3"
                                >
                                    <Plus size={22} color="#FFFFFF" strokeWidth={3} />
                                    <Text className="text-white font-black text-lg tracking-tight">Rezept hinzufügen</Text>
                                </TouchableOpacity>
                            )}
                        </Animated.View>
                    )}
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
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => setShowDatePicker(false)}
                            >
                                <Text className="text-textLight dark:text-zinc-400 text-lg font-medium">Abbrechen</Text>
                            </TouchableOpacity>
                            <Text className="text-text dark:text-zinc-50 font-bold text-lg">Datum wählen</Text>
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={confirmLog}
                            >
                                <Text className="text-primary font-bold text-lg">Hinzufügen</Text>
                            </TouchableOpacity>
                        </View>

                        <View className="px-6 flex-row justify-between items-center mb-4 w-full">
                            <Text className="text-xl font-bold text-text dark:text-zinc-50 capitalize">
                                {format(selectedDate, 'MMMM yyyy', { locale: de })}
                            </Text>
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => setSelectedDate(new Date())}
                                className="bg-gray-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full"
                            >
                                <Text className="text-xs font-semibold text-textLight dark:text-zinc-400">Heute</Text>
                            </TouchableOpacity>
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
                                        <TouchableOpacity
                                            key={date.toISOString()}
                                            activeOpacity={0.7}
                                            onPress={() => {
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
                                        </TouchableOpacity>
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
