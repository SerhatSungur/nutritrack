import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useLogStore } from '../../store/useLogStore';
import { useRouter } from 'expo-router';
import { Plus, BookOpen } from 'lucide-react-native';

export default function RecipesScreen() {
    const recipes = useLogStore((state) => state.recipes);
    const addLog = useLogStore((state) => state.addLog);
    const router = useRouter();

    return (
        <View className="flex-1 bg-background dark:bg-zinc-950">
            <View className="pt-16 pb-4 bg-card dark:bg-zinc-900 shadow-[0_4px_12px_rgba(0,0,0,0.05)] z-10 w-full items-center">
                <View className="px-6 flex-row justify-between items-center w-full md:max-w-3xl">
                    <Text className="text-2xl font-bold text-text dark:text-zinc-50">My Recipes</Text>
                    <TouchableOpacity
                        onPress={() => router.push('/recipes/create')}
                        className="bg-primary p-2 rounded-full"
                    >
                        <Plus size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView className="flex-1 pt-6" showsVerticalScrollIndicator={false}>
                <View className="w-full md:max-w-3xl md:mx-auto px-4">
                    {recipes.length === 0 ? (
                        <View className="items-center justify-center mt-20">
                            <BookOpen size={64} color="#D1D5DB" className="mb-4" />
                            <Text className="text-lg font-medium text-textLight dark:text-zinc-400">No recipes created yet.</Text>
                            <Text className="text-sm text-gray-400 mt-2 text-center px-8">
                                Tap the plus button above to build your first recipe and calculate its macros accurately.
                            </Text>
                        </View>
                    ) : (
                        recipes.map((recipe) => (
                            <View key={recipe.id} className="bg-card dark:bg-zinc-900 rounded-2xl p-4 mb-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                                <Text className="text-lg font-bold text-text dark:text-zinc-50 mb-2">{recipe.name}</Text>

                                <View className="flex-row justify-between border-b border-gray-100 dark:border-zinc-800 pb-3 mb-3">
                                    <Text className="text-sm text-textLight dark:text-zinc-400">{recipe.ingredients.length} ingredients</Text>
                                    <Text className="font-bold text-primary">{recipe.totalCalories} kcal</Text>
                                </View>

                                <View className="flex-row justify-between px-2 mb-3">
                                    <View className="items-center">
                                        <Text className="text-xs text-textLight dark:text-zinc-400">Protein</Text>
                                        <Text className="font-semibold text-text dark:text-zinc-50">{recipe.totalProtein}g</Text>
                                    </View>
                                    <View className="items-center">
                                        <Text className="text-xs text-textLight dark:text-zinc-400">Carbs</Text>
                                        <Text className="font-semibold text-text dark:text-zinc-50">{recipe.totalCarbs}g</Text>
                                    </View>
                                    <View className="items-center">
                                        <Text className="text-xs text-textLight dark:text-zinc-400">Fat</Text>
                                        <Text className="font-semibold text-text dark:text-zinc-50">{recipe.totalFat}g</Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    onPress={() => router.push(`/recipes/${recipe.id}`)}
                                    className="flex-row items-center justify-between pt-3 pb-3 border-t border-gray-100 dark:border-zinc-800 mb-2"
                                >
                                    <Text className="text-sm font-semibold text-primary">View Full Details & Edit</Text>
                                    <BookOpen size={16} color="#2563EB" />
                                </TouchableOpacity>

                                {/* subtle, beautiful log buttons row */}
                                <View className="flex-row justify-between items-center bg-gray-50 dark:bg-zinc-800/50 p-2 rounded-xl border border-gray-100 dark:border-zinc-800">
                                    <Text className="text-xs font-bold text-textLight dark:text-zinc-400 uppercase tracking-wider ml-1">Log to: </Text>
                                    <View className="flex-row gap-x-2">
                                        {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((meal) => (
                                            <TouchableOpacity
                                                key={meal}
                                                onPress={() => {
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
                                                className="bg-primary/10 px-3 py-1.5 rounded-full"
                                            >
                                                <Text className="text-primary text-xs font-bold capitalize">{meal}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                    <View className="h-12" />
                </View>
            </ScrollView>
        </View>
    );
}
