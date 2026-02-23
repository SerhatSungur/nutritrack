import { View, Text, ScrollView, TextInput, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLogStore } from '../../store/useLogStore';
import { ChevronLeft, PlusCircle, Edit2, Trash2 } from 'lucide-react-native';
import { Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import Animated, { FadeInDown } from 'react-native-reanimated';

const RecipeDetailScreen = () => {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { haptics } = require('../../lib/haptics');

    const recipe = useLogStore(state => state.recipes.find(r => r.id === id));
    const updateRecipe = useLogStore(state => state.updateRecipe);
    const addLog = useLogStore(state => state.addLog);

    if (!recipe) {
        return (
            <SafeAreaView className="flex-1 bg-background dark:bg-zinc-950 justify-center items-center">
                <Text className="text-xl font-bold text-textLight dark:text-zinc-400">Rezept nicht gefunden.</Text>
                <View
                    onStartShouldSetResponder={() => true}
                    onResponderRelease={() => router.back()}
                    className="mt-4 bg-primary px-6 py-3 rounded-xl"
                >
                    <Text className="text-white font-bold">Zurück</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#020617' : '#F8FAFC' }} edges={['top']}>
            {/* Header */}
            <View style={{
                height: 100,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 32,
                backgroundColor: 'transparent',
                zIndex: 10,
            }}>
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                        haptics.lightImpact();
                        router.back();
                    }}
                    style={{
                        backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 20,
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                    }}
                >
                    <ChevronLeft size={24} color={isDark ? '#94A3B8' : '#64748B'} />
                </TouchableOpacity>

                <View style={{ flex: 1 }}>
                    <Text style={{
                        fontSize: 10,
                        fontWeight: '800',
                        color: isDark ? '#94A3B8' : '#64748B',
                        letterSpacing: 2,
                        textTransform: 'uppercase',
                        marginBottom: 4
                    }}>
                        Rezept Detail
                    </Text>
                    <Text style={{
                        fontSize: 28,
                        fontFamily: 'PlusJakartaSans_800ExtraBold',
                        color: isDark ? '#F8FAFC' : '#0F172A',
                        letterSpacing: -1
                    }} numberOfLines={1}>
                        {recipe.name}
                    </Text>
                </View>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>
                    {/* Macros Overview */}
                    <Animated.View
                        entering={FadeInDown.delay(100).springify()}
                        className="bg-white dark:bg-zinc-900 rounded-[32px] p-8 mb-8 border border-gray-100 dark:border-white/5 shadow-premium"
                    >
                        <View className="items-center mb-8">
                            <Text className="text-6xl font-black text-primary tracking-tighter">{recipe.totalCalories}</Text>
                            <Text className="text-xs font-black text-textLight dark:text-zinc-500 uppercase tracking-[4px] mt-2">Gesamt Kalorien</Text>
                        </View>

                        <View className="flex-row justify-between border-t border-gray-50 dark:border-white/5 pt-8">
                            <View className="items-center flex-1">
                                <Text className="text-2xl font-black text-text dark:text-zinc-50 mb-1">{recipe.totalProtein}g</Text>
                                <Text className="text-[10px] font-black text-textLight dark:text-zinc-500 uppercase tracking-widest">Protein</Text>
                            </View>
                            <View className="items-center flex-1 border-l border-r border-gray-50 dark:border-white/5 px-2">
                                <Text className="text-2xl font-black text-text dark:text-zinc-50 mb-1">{recipe.totalCarbs}g</Text>
                                <Text className="text-[10px] font-black text-textLight dark:text-zinc-500 uppercase tracking-widest">Kohlenhyd.</Text>
                            </View>
                            <View className="items-center flex-1">
                                <Text className="text-2xl font-black text-text dark:text-zinc-50 mb-1">{recipe.totalFat}g</Text>
                                <Text className="text-[10px] font-black text-textLight dark:text-zinc-500 uppercase tracking-widest">Fett</Text>
                            </View>
                        </View>
                    </Animated.View>

                    {/* Quick Log Action Buttons */}
                    <Animated.View entering={FadeInDown.delay(150).springify()} className="mb-8 p-6 bg-blue-50/50 dark:bg-blue-500/5 rounded-[32px] border border-blue-100 dark:border-blue-900/20">
                        <Text className="text-[11px] font-black text-primary uppercase tracking-[3px] mb-6 text-center">Zu Journal hinzufügen</Text>
                        <View className="flex-row flex-wrap justify-between gap-y-3">
                            {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((meal) => {
                                const mealTranslations: Record<string, string> = {
                                    breakfast: 'Frühstück',
                                    lunch: 'Mittagessen',
                                    dinner: 'Abendessen',
                                    snack: 'Snack'
                                };
                                return (
                                    <View
                                        key={meal}
                                        onStartShouldSetResponder={() => true}
                                        onResponderRelease={() => {
                                            haptics.success();
                                            addLog({
                                                meal_type: meal,
                                                name: recipe.name,
                                                calories: recipe.totalCalories,
                                                protein: recipe.totalProtein,
                                                carbs: recipe.totalCarbs,
                                                fat: recipe.totalFat,
                                            });
                                            router.push('/');
                                        }}
                                        className="w-[48%] bg-card dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 flex-row items-center justify-center py-3.5 rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.02)]"
                                    >
                                        <PlusCircle size={16} color="#2563EB" className="mr-2" />
                                        <Text className="text-text dark:text-zinc-50 font-bold capitalize text-base">{mealTranslations[meal]}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </Animated.View>

                    {/* Ingredients List */}
                    <Animated.View entering={FadeInDown.delay(200).springify()} className="bg-white dark:bg-zinc-900 rounded-[32px] p-6 mb-8 border border-gray-100 dark:border-white/5 shadow-premium">
                        <Text className="text-[11px] font-black text-textLight dark:text-zinc-500 uppercase tracking-[3px] mb-6">Zutaten ({recipe.ingredients.length})</Text>
                        {recipe.ingredients.map((ing, idx) => (
                            <View key={ing.id} className={`flex-row justify-between py-4 ${idx !== recipe.ingredients.length - 1 ? 'border-b border-gray-50 dark:border-white/5' : ''}`}>
                                <View className="flex-1 pr-4">
                                    <Text className="text-base font-bold text-text dark:text-zinc-50">{ing.name}</Text>
                                    <Text className="text-xs text-textLight dark:text-zinc-500 mt-1 uppercase tracking-widest font-black">
                                        {ing.useServing && ing.servingSize ? `${ing.amount} x ${ing.servingSize}` : `${ing.amount}g`}
                                    </Text>
                                </View>
                                <View className="items-end justify-center">
                                    <View className="bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-full">
                                        <Text className="text-xs font-black text-primary dark:text-blue-400">
                                            {Math.round(ing.caloriesPer100g * ((ing.useServing && ing.servingQuantity ? ing.amount * ing.servingQuantity : ing.amount) / 100))} kcal
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </Animated.View>

                    {/* Notes Section */}
                    <Animated.View entering={FadeInDown.delay(250).springify()} className="bg-white dark:bg-zinc-900 rounded-[32px] p-6 mb-12 border border-gray-100 dark:border-white/5 shadow-premium">
                        <Text className="text-[11px] font-black text-textLight dark:text-zinc-500 uppercase tracking-[3px] mb-4">Zubereitungshinweise</Text>
                        <TextInput
                            multiline
                            className="text-base text-text dark:text-zinc-50 min-h-[120px] bg-gray-50/50 dark:bg-zinc-800/50 rounded-2xl p-5 border border-gray-100 dark:border-white/5 mb-4 font-medium"
                            placeholder="Kochempfehlungen, Tipps oder Anpassungen eingeben..."
                            placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                            value={recipe.notes || ''}
                            onChangeText={(text) => updateRecipe(recipe.id, { notes: text })}
                            textAlignVertical="top"
                        />
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => {
                                haptics.success();
                                Keyboard.dismiss();
                            }}
                            className="bg-primary/10 dark:bg-primary/20 self-end px-6 py-3 rounded-xl border border-primary/20"
                        >
                            <Text className="text-primary font-black text-xs uppercase tracking-widest">Notizen speichern</Text>
                        </TouchableOpacity>
                    </Animated.View>

                    <View className="h-12" />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default RecipeDetailScreen;
