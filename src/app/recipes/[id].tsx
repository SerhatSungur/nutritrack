import { View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLogStore } from '../../store/useLogStore';
import { ChevronLeft, PlusCircle, Edit2 } from 'lucide-react-native';
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
                <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-primary px-6 py-3 rounded-xl">
                    <Text className="text-white font-bold">Zurück</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background dark:bg-zinc-950" edges={['top']}>
            {/* Header */}
            <View style={{
                height: 70,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                backgroundColor: isDark ? '#18181B' : '#FFFFFF',
                borderBottomWidth: 1,
                borderBottomColor: isDark ? '#27272A' : '#F3F4F6'
            }}>
                <View className="flex-row items-center flex-1 pr-4">
                    <TouchableOpacity
                        onPress={() => {
                            haptics.lightImpact();
                            router.back();
                        }}
                        className="p-2 mr-2"
                    >
                        <ChevronLeft size={28} color={isDark ? '#FAFAFA' : '#1F2937'} />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 22, fontWeight: '800', color: isDark ? '#FAFAFA' : '#09090B' }} className="flex-1" numberOfLines={1}>{recipe.name}</Text>
                </View>
                <TouchableOpacity
                    onPress={() => {
                        haptics.lightImpact();
                        router.push(`/recipes/create?editId=${recipe.id}`);
                    }}
                    className="p-2 bg-primary/10 rounded-full"
                >
                    <Edit2 size={20} color="#2563EB" />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>
                    {/* Macros Overview */}
                    <Animated.View entering={FadeInDown.delay(100).springify()} className="bg-card dark:bg-zinc-900 rounded-2xl p-5 mb-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                        <View className="items-center mb-4">
                            <Text className="text-5xl font-extrabold text-primary">{recipe.totalCalories}</Text>
                            <Text className="text-sm font-semibold text-textLight dark:text-zinc-400 uppercase tracking-widest mt-1">Kalorien</Text>
                        </View>

                        <View className="flex-row justify-between border-t border-gray-100 dark:border-zinc-800 pt-4">
                            <View className="items-center flex-1">
                                <Text className="text-xl font-bold text-text dark:text-zinc-50 mb-1">{recipe.totalProtein}g</Text>
                                <Text className="text-xs font-semibold text-textLight dark:text-zinc-400 uppercase tracking-wider">Protein</Text>
                            </View>
                            <View className="items-center flex-1 border-l border-r border-gray-100 dark:border-zinc-800 px-2">
                                <Text className="text-xl font-bold text-text dark:text-zinc-50 mb-1">{recipe.totalCarbs}g</Text>
                                <Text className="text-xs font-semibold text-textLight dark:text-zinc-400 uppercase tracking-wider">Kohlenhydrate</Text>
                            </View>
                            <View className="items-center flex-1">
                                <Text className="text-xl font-bold text-text dark:text-zinc-50 mb-1">{recipe.totalFat}g</Text>
                                <Text className="text-xs font-semibold text-textLight dark:text-zinc-400 uppercase tracking-wider">Fett</Text>
                            </View>
                        </View>
                    </Animated.View>

                    {/* Quick Log Action Buttons */}
                    <Animated.View entering={FadeInDown.delay(150).springify()} className="mb-8 p-4 bg-gray-50 dark:bg-zinc-800/80 rounded-2xl border border-gray-100 dark:border-zinc-800">
                        <Text className="text-sm font-bold text-textLight dark:text-zinc-400 mb-4 uppercase tracking-wider text-center">Rezept loggen</Text>
                        <View className="flex-row flex-wrap justify-between gap-y-3">
                            {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((meal) => {
                                const mealTranslations: Record<string, string> = {
                                    breakfast: 'Frühstück',
                                    lunch: 'Mittagessen',
                                    dinner: 'Abendessen',
                                    snack: 'Snack'
                                };
                                return (
                                    <TouchableOpacity
                                        key={meal}
                                        onPress={() => {
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
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </Animated.View>

                    {/* Ingredients List */}
                    <Animated.View entering={FadeInDown.delay(200).springify()} className="bg-card dark:bg-zinc-900 rounded-2xl p-5 mb-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                        <Text className="text-md font-bold text-text dark:text-zinc-50 mb-4">Zutaten ({recipe.ingredients.length})</Text>
                        {recipe.ingredients.map((ing, idx) => (
                            <View key={ing.id} className={`flex-row justify-between py-3 ${idx !== recipe.ingredients.length - 1 ? 'border-b border-gray-100 dark:border-zinc-800' : ''}`}>
                                <Text className="text-base font-medium text-text dark:text-zinc-50 flex-1 pr-4">{ing.name}</Text>
                                <View className="items-end">
                                    <Text className="font-semibold text-text dark:text-zinc-50">
                                        {ing.useServing && ing.servingSize ? `${ing.amount} x ${ing.servingSize}` : `${ing.amount}g`}
                                    </Text>
                                    <Text className="text-xs text-textLight dark:text-zinc-400 mt-1">
                                        {Math.round(ing.caloriesPer100g * ((ing.useServing && ing.servingQuantity ? ing.amount * ing.servingQuantity : ing.amount) / 100))} kcal
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </Animated.View>

                    {/* Notes Section */}
                    <Animated.View entering={FadeInDown.delay(250).springify()} className="bg-card dark:bg-zinc-900 rounded-2xl p-5 mb-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                        <Text className="text-md font-bold text-text dark:text-zinc-50 mb-3">Zubereitungshinweise</Text>
                        <TextInput
                            multiline
                            className="text-base text-text dark:text-zinc-50 min-h-[120px] bg-gray-50 dark:bg-zinc-800 rounded-xl p-4 border border-gray-100 dark:border-zinc-800 mb-3"
                            placeholder="Kochempfehlungen, Tipps oder Anpassungen eingeben..."
                            placeholderTextColor="#9CA3AF"
                            value={recipe.notes || ''}
                            onChangeText={(text) => updateRecipe(recipe.id, { notes: text })}
                            textAlignVertical="top"
                        />
                        <TouchableOpacity onPress={() => Keyboard.dismiss()} className="bg-primary ml-auto px-4 py-2 rounded-lg">
                            <Text className="text-white font-bold text-sm">Notizen speichern</Text>
                        </TouchableOpacity>
                    </Animated.View>

                    <View className="h-12" />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default RecipeDetailScreen;
