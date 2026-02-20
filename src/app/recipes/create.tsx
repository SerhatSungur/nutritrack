import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLogStore, RecipeIngredient } from '../../store/useLogStore';
import { searchFood, FoodItem } from '../../lib/api/foodApi';
import { X, Search, Plus } from 'lucide-react-native';

const IngredientAmountInput = ({ initialAmount, onUpdate, unit }: { initialAmount: number, onUpdate: (val: number) => void, unit: string }) => {
    const [amount, setAmount] = useState(initialAmount ? initialAmount.toString() : '');
    return (
        <View className="flex-row items-center justify-between border border-gray-200 dark:border-zinc-700 rounded-[10px] px-2 bg-gray-50 dark:bg-zinc-800 mr-2 h-[46px] min-w-[80px]">
            <TextInput
                value={amount}
                onChangeText={setAmount}
                onEndEditing={() => {
                    const parsed = parseInt(amount) || 0;
                    setAmount(parsed.toString());
                    onUpdate(parsed);
                }}
                keyboardType="numbers-and-punctuation"
                style={{ flex: 1, padding: 0, margin: 0, textAlign: 'center' }}
                className="text-[17px] font-bold text-text dark:text-zinc-50"
                maxLength={4}
                selectTextOnFocus
                returnKeyType="done"
            />
            <View className="border-l border-gray-200 dark:border-zinc-700 pl-2 ml-1 flex-row items-center h-[24px]">
                <Text className="text-[11px] font-extrabold text-textLight dark:text-zinc-400 uppercase tracking-widest">{unit}</Text>
            </View>
        </View>
    );
};

export default function CreateRecipeScreen() {
    const router = useRouter();
    const addRecipe = useLogStore((state) => state.addRecipe);

    const [name, setName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
    const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
    const [loading, setLoading] = useState(false);

    // Feature: Show saved recipes when search is empty
    const savedRecipes = useLogStore((state) => state.recipes);
    const addLog = useLogStore((state) => state.addLog);
    const { defaultMeal } = useLocalSearchParams();

    const handleSearch = async () => {
        if (!searchQuery) return;
        setLoading(true);
        const results = await searchFood(searchQuery);
        setSearchResults(results);
        setLoading(false);
    };

    const handleAddIngredient = (item: FoodItem) => {
        // Default to adding 100g for simplicity
        const newIngredient: RecipeIngredient = {
            id: item.id + Math.random().toString(), // Ensure unique key if same item added twice
            name: item.name,
            amount: 100,
            unit: item.unit || 'g',
            caloriesPer100g: item.calories,
            proteinPer100g: item.protein,
            carbsPer100g: item.carbs,
            fatPer100g: item.fat,
        };

        setIngredients([...ingredients, newIngredient]);
        setSearchResults([]);
        setSearchQuery('');
    };

    const handleRemoveIngredient = (id: string) => {
        setIngredients(ingredients.filter(ing => ing.id !== id));
    };

    const handleUpdateAmount = (id: string, newAmount: number) => {
        setIngredients(ingredients.map(ing =>
            ing.id === id ? { ...ing, amount: newAmount } : ing
        ));
    };

    const handleSaveRecipe = () => {
        if (!name || ingredients.length === 0) return;

        addRecipe({ name, ingredients });
        router.back();
    };

    return (
        <View className="flex-1 bg-background dark:bg-zinc-950 pt-12 px-4">
            <View className="flex-row justify-between items-center mb-6">
                <Text className="text-2xl font-bold text-text dark:text-zinc-50">New Recipe</Text>
                <TouchableOpacity onPress={() => router.back()} className="p-2">
                    <X size={24} color="#1F2937" />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustKeyboardInsets={true}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Basic Info */}
                <View className="bg-card dark:bg-zinc-900 p-4 rounded-2xl mb-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                    <Text className="text-sm font-semibold text-textLight dark:text-zinc-400 mb-2 uppercase tracking-wider">Recipe Name</Text>
                    <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder="e.g. Avocado Toast"
                        className="border-b border-gray-200 dark:border-zinc-700 py-3 text-lg text-text dark:text-zinc-50"
                        placeholderTextColor="#9CA3AF"
                    />
                </View>

                {/* Current Ingredients */}
                {ingredients.length > 0 && (
                    <View className="bg-card dark:bg-zinc-900 p-4 rounded-2xl mb-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                        <Text className="text-sm font-semibold text-textLight dark:text-zinc-400 mb-3 uppercase tracking-wider">Ingredients</Text>
                        {ingredients.map((ing) => (
                            <View key={ing.id} className="flex-row justify-between items-center py-3 border-b border-gray-100 dark:border-zinc-800 last:border-0">
                                <View className="flex-1 mr-4">
                                    <Text className="text-base font-medium text-text dark:text-zinc-50 mb-1" numberOfLines={1}>{ing.name}</Text>
                                    <Text className="text-sm text-textLight dark:text-zinc-400 font-medium">
                                        {Math.round(ing.caloriesPer100g * (ing.amount / 100))} kcal
                                    </Text>
                                </View>

                                <IngredientAmountInput
                                    initialAmount={ing.amount}
                                    onUpdate={(val) => handleUpdateAmount(ing.id, val)}
                                    unit={ing.unit || 'g'}
                                />

                                <TouchableOpacity onPress={() => handleRemoveIngredient(ing.id)} className="p-2 bg-red-50 rounded-full">
                                    <X size={16} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}

                {/* Search */}
                <View className="bg-card dark:bg-zinc-900 p-4 rounded-2xl mb-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                    <Text className="text-sm font-semibold text-textLight dark:text-zinc-400 mb-3 uppercase tracking-wider">Add Ingredient</Text>
                    <View className="flex-row items-center border border-gray-200 dark:border-zinc-700 rounded-xl px-3 bg-gray-50 dark:bg-zinc-800 mb-3">
                        <Search size={20} color="#9CA3AF" />
                        <TextInput
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onSubmitEditing={handleSearch}
                            placeholder="Search OpenFoodFacts..."
                            className="flex-1 py-3 ml-2 text-base text-text dark:text-zinc-50"
                            placeholderTextColor="#9CA3AF"
                            autoCapitalize="none"
                            returnKeyType="search"
                        />
                    </View>

                    {loading ? (
                        <ActivityIndicator size="small" color="#2563EB" className="my-4" />
                    ) : (
                        searchResults.length > 0 ? (
                            searchResults.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    onPress={() => handleAddIngredient(item)}
                                    className="flex-row justify-between items-center py-3 border-b border-gray-100 dark:border-zinc-800 last:border-0"
                                >
                                    <View className="flex-1 mr-4">
                                        <Text className="text-base font-medium text-text dark:text-zinc-50" numberOfLines={1}>{item.name}</Text>
                                        <Text className="text-xs text-textLight dark:text-zinc-400">{item.brand ? `${item.brand} • ` : ''}{item.calories} kcal/100g</Text>
                                    </View>
                                    <Plus size={20} color="#2563EB" />
                                </TouchableOpacity>
                            ))
                        ) : searchQuery === '' && savedRecipes.length > 0 ? (
                            <View className="mt-2">
                                <Text className="text-xs font-bold text-textLight dark:text-zinc-400 uppercase tracking-widest mb-3">Your Saved Recipes</Text>
                                {savedRecipes.map((recipe) => (
                                    <View key={recipe.id} className="flex-row justify-between items-center py-3 border-b border-gray-100 dark:border-zinc-800 last:border-0">
                                        <View className="flex-1 pr-4">
                                            <Text className="text-base font-medium text-text dark:text-zinc-50">{recipe.name}</Text>
                                            <Text className="text-xs text-textLight dark:text-zinc-400">{recipe.totalCalories} kcal • {recipe.ingredients.length} ingredients</Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => {
                                                if (defaultMeal) {
                                                    addLog({
                                                        meal_type: defaultMeal as any,
                                                        name: recipe.name,
                                                        calories: recipe.totalCalories,
                                                        protein: recipe.totalProtein,
                                                        carbs: recipe.totalCarbs,
                                                        fat: recipe.totalFat,
                                                    });
                                                    router.back();
                                                } else {
                                                    // Add recipe ingredients as ingredients to the new recipe
                                                    setIngredients([...ingredients, ...recipe.ingredients]);
                                                }
                                            }}
                                            className="bg-primary/10 px-3 py-1.5 rounded-full"
                                        >
                                            <Text className="text-primary text-xs font-bold">{defaultMeal ? `Log to ${defaultMeal}` : 'Add'}</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        ) : null
                    )}
                </View>

                <TouchableOpacity
                    onPress={handleSaveRecipe}
                    disabled={!name || ingredients.length === 0}
                    className={`py-4 rounded-xl items-center mb-8 ${(!name || ingredients.length === 0) ? 'bg-blue-300' : 'bg-primary'}`}
                >
                    <Text className="text-white font-bold text-lg">Save Recipe</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}
