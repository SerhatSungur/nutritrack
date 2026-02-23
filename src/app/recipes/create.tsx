import { View, Text, TextInput, ScrollView, ActivityIndicator, useWindowDimensions, Pressable, Platform } from 'react-native';
import { CustomSwitch } from '../../components/CustomSwitch';
import { useColorScheme } from 'nativewind';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLogStore, RecipeIngredient } from '../../store/useLogStore';
import { searchFood, FoodItem } from '../../lib/api/foodApi';
import { X, Search, Plus, ScanLine, Star, ChevronLeft, Share2, Globe } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { haptics } from '../../lib/haptics';

const IngredientAmountInput = ({
    initialAmount,
    initialUseServing,
    servingSize,
    unit,
    onUpdate
}: {
    initialAmount: number,
    initialUseServing?: boolean,
    servingSize?: string,
    unit: string,
    onUpdate: (amount: number, useServing: boolean) => void
}) => {
    const [amount, setAmount] = useState(initialAmount ? initialAmount.toString() : '');
    const [useServing, setUseServing] = useState(initialUseServing || false);

    const handleUpdate = (newAmount: string, newUseServing: boolean) => {
        const parsed = parseInt(newAmount) || 0;
        setAmount(parsed.toString());
        setUseServing(newUseServing);
        onUpdate(parsed, newUseServing);
    };

    return (
        <View className="flex-row items-center justify-between border border-gray-200 dark:border-zinc-700 rounded-[10px] bg-gray-50 dark:bg-zinc-800 mr-2 h-[46px] w-[110px] overflow-hidden">
            <TextInput
                value={amount}
                onChangeText={(text) => handleUpdate(text, useServing)}
                keyboardType="numbers-and-punctuation"
                style={{ flex: 1, padding: 0, margin: 0, textAlign: 'center' }}
                className="text-[17px] font-bold text-text dark:text-zinc-50"
                maxLength={4}
                selectTextOnFocus
                returnKeyType="done"
            />
            {servingSize ? (
                <View
                    onStartShouldSetResponder={() => true}
                    onResponderRelease={() => handleUpdate(amount, !useServing)}
                    className="border-l border-gray-200 dark:border-zinc-700 w-[55px] items-center justify-center h-full bg-primary/5 active:bg-primary/10"
                >
                    <Text className="text-[11px] font-extrabold text-primary uppercase tracking-widest" numberOfLines={1} adjustsFontSizeToFit>
                        {useServing ? 'STK.' : unit}
                    </Text>
                </View>
            ) : (
                <View className="border-l border-gray-200 dark:border-zinc-700 w-[45px] items-center justify-center h-full bg-black/5 dark:bg-white/5">
                    <Text className="text-[11px] font-extrabold text-textLight dark:text-zinc-400 uppercase tracking-widest">{unit}</Text>
                </View>
            )}
        </View>
    );
};

export default function CreateRecipeScreen() {
    const router = useRouter();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const addRecipe = useLogStore((state) => state.addRecipe);
    const updateRecipe = useLogStore((state) => state.updateRecipe);
    const savedRecipes = useLogStore((state) => state.recipes);
    const addLog = useLogStore((state) => state.addLog);
    const recentFoods = useLogStore((state) => state.recentFoods);
    const favoriteFoods = useLogStore((state) => state.favoriteFoods);
    const addRecentFood = useLogStore((state) => state.addRecentFood);
    const toggleFavorite = useLogStore((state) => state.toggleFavorite);
    const isFav = useLogStore((state) => state.isFavorite);

    const { defaultMeal, editId, scannedFoodId, scannedFoodName, scannedFoodBrand,
        scannedFoodCalories, scannedFoodProtein, scannedFoodCarbs, scannedFoodFat, scannedFoodUnit } = useLocalSearchParams<Record<string, string>>();

    const [name, setName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
    const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
    const [isPublic, setIsPublic] = useState(false);
    const [loading, setLoading] = useState(false);

    // Pre-fill when editing an existing recipe
    useEffect(() => {
        if (editId && typeof editId === 'string') {
            const recipeToEdit = savedRecipes.find(r => r.id === editId);
            if (recipeToEdit) {
                setName(recipeToEdit.name);
                setIngredients(recipeToEdit.ingredients || []);
                setIsPublic(recipeToEdit.is_public || false);
            }
        }
    }, [editId]);

    const handleAddIngredient = (item: FoodItem) => {
        const hasServing = !!item.servingQuantity && !!item.servingSize;
        const newIngredient: RecipeIngredient = {
            id: item.id + Math.random().toString(),
            name: item.name,
            amount: hasServing ? 1 : 100,
            useServing: hasServing,
            unit: item.unit || 'g',
            caloriesPer100g: item.calories,
            proteinPer100g: item.protein,
            carbsPer100g: item.carbs,
            fatPer100g: item.fat,
            servingSize: item.servingSize,
            servingQuantity: item.servingQuantity,
        };
        addRecentFood(item);
        setIngredients(current => [...current, newIngredient]);
        setSearchResults([]);
        setSearchQuery('');
    };

    // Auto-add scanned food item returned from the barcode scanner
    useEffect(() => {
        if (scannedFoodId && scannedFoodName && scannedFoodCalories) {
            const scannedItem: FoodItem = {
                id: scannedFoodId as string,
                name: scannedFoodName as string,
                brand: scannedFoodBrand as string || '',
                calories: parseFloat(scannedFoodCalories as string) || 0,
                protein: parseFloat(scannedFoodProtein as string || '0'),
                carbs: parseFloat(scannedFoodCarbs as string || '0'),
                fat: parseFloat(scannedFoodFat as string || '0'),
                unit: scannedFoodUnit as string || 'g',
            };
            handleAddIngredient(scannedItem);
        }
    }, [scannedFoodId]);

    const handleSearch = async () => {
        if (!searchQuery) return;
        setLoading(true);
        try {
            const results = await searchFood(searchQuery);
            setSearchResults(results);
        } catch (e) {
            console.error('Search error:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveIngredient = (id: string) => {
        setIngredients(ingredients.filter(ing => ing.id !== id));
    };

    const handleUpdateAmount = (id: string, newAmount: number, newUseServing: boolean) => {
        setIngredients(ingredients.map(ing =>
            ing.id === id ? { ...ing, amount: newAmount, useServing: newUseServing } : ing
        ));
    };

    const handleSaveRecipe = () => {
        if (!name || ingredients.length === 0) return;

        if (editId && typeof editId === 'string') {
            updateRecipe(editId, { name, ingredients, is_public: isPublic });
        } else {
            addRecipe({ name, ingredients, is_public: isPublic });
        }
        router.back();
    };

    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    return (
        <View style={{ flex: 1, flexDirection: 'row', backgroundColor: isDesktop ? 'rgba(0,0,0,0.5)' : 'transparent' }}>
            {isDesktop && (
                <Pressable style={{ flex: 1 }} onPress={() => router.back()} />
            )}
            <SafeAreaView
                className={`bg-background dark:bg-zinc-950 ${isDesktop ? 'shadow-2xl' : 'flex-1'}`}
                edges={['top', 'bottom']}
                style={isDesktop ? { width: 500, height: '100%', borderLeftWidth: 1, borderLeftColor: isDark ? '#27272A' : '#E5E7EB' } : {}}
            >
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
                        <View
                            onStartShouldSetResponder={() => true}
                            onResponderRelease={() => {
                                haptics.lightImpact();
                                router.back();
                            }}
                            className="p-2 mr-2"
                        >
                            <ChevronLeft size={28} color={isDark ? '#FAFAFA' : '#1F2937'} />
                        </View>
                        <Text style={{ fontSize: 22, fontWeight: '800', color: isDark ? '#FAFAFA' : '#09090B' }} className="flex-1" numberOfLines={1}>
                            {editId ? 'Rezept bearbeiten' : 'Neues Rezept'}
                        </Text>
                    </View>
                    <View
                        onStartShouldSetResponder={() => true}
                        onResponderRelease={() => {
                            haptics.lightImpact();
                            router.back();
                        }}
                        className="p-2"
                    >
                        <X size={24} color={isDark ? '#FAFAFA' : '#1F2937'} />
                    </View>
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    automaticallyAdjustKeyboardInsets={true}
                    contentContainerStyle={{ paddingBottom: 100 }}
                >
                    {/* Basic Info */}
                    <Animated.View entering={FadeInDown.delay(100).springify()} className="bg-card dark:bg-zinc-900 p-4 rounded-2xl mb-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                        <Text className="text-sm font-semibold text-textLight dark:text-zinc-400 mb-2 uppercase tracking-wider">Rezeptname</Text>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            placeholder="z.B. Avocado Toast"
                            className="border-b border-gray-200 dark:border-zinc-700 py-3 text-lg font-medium text-text dark:text-zinc-50 outline-none"
                            placeholderTextColor="#9CA3AF"
                        />

                        <View className="flex-row items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-zinc-800">
                            <View className="flex-row items-center gap-x-3">
                                <View className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <Globe size={18} color="#2563EB" />
                                </View>
                                <View>
                                    <Text className="text-base font-semibold text-text dark:text-zinc-50">Öffentlich teilen</Text>
                                    <Text className="text-xs text-textLight dark:text-zinc-400">Für die Community sichtbar machen</Text>
                                </View>
                            </View>
                            <CustomSwitch
                                value={isPublic}
                                onValueChange={setIsPublic}
                            />
                        </View>
                    </Animated.View>

                    {/* Current Ingredients */}
                    {ingredients.length > 0 && (
                        <Animated.View entering={FadeInDown.delay(150).springify()} className="bg-card dark:bg-zinc-900 p-4 rounded-2xl mb-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                            <Text className="text-sm font-semibold text-textLight dark:text-zinc-400 mb-3 uppercase tracking-wider">Zutaten</Text>
                            {ingredients.map((ing) => (
                                <View key={ing.id} className="flex-row justify-between items-center py-3 border-b border-gray-100 dark:border-zinc-800 last:border-0">
                                    <View className="flex-1 mr-4">
                                        <Text className="text-base font-medium text-text dark:text-zinc-50 mb-1" numberOfLines={1}>{ing.name}</Text>
                                        <Text className="text-sm text-textLight dark:text-zinc-400 font-medium">
                                            {Math.round(ing.caloriesPer100g * ((ing.useServing && ing.servingQuantity ? ing.amount * ing.servingQuantity : ing.amount) / 100))} kcal
                                            {ing.useServing && ing.servingSize ? ` • (${ing.servingSize})` : ''}
                                        </Text>
                                    </View>

                                    <IngredientAmountInput
                                        initialAmount={ing.amount}
                                        initialUseServing={ing.useServing}
                                        servingSize={ing.servingSize}
                                        onUpdate={(val, useServ) => handleUpdateAmount(ing.id, val, useServ)}
                                        unit={ing.unit || 'g'}
                                    />

                                    <View
                                        onStartShouldSetResponder={() => true}
                                        onResponderRelease={() => handleRemoveIngredient(ing.id)}
                                        className="p-2 bg-red-50 rounded-full"
                                    >
                                        <X size={16} color="#EF4444" />
                                    </View>
                                </View>
                            ))}
                        </Animated.View>
                    )}

                    {/* Search */}
                    <Animated.View entering={FadeInDown.delay(200).springify()} className="bg-card dark:bg-zinc-900 p-4 rounded-2xl mb-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                        <Text className="text-sm font-semibold text-textLight dark:text-zinc-400 mb-3 uppercase tracking-wider">Zutat hinzufügen</Text>
                        <View className="flex-row items-center border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 mb-3 overflow-hidden pl-3">
                            <Search size={20} color="#9CA3AF" />
                            <TextInput
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                onSubmitEditing={handleSearch}
                                placeholder="Suchen nach Lebensmitteln..."
                                className="flex-1 py-3 ml-2 text-base text-text dark:text-zinc-50 outline-none"
                                placeholderTextColor="#9CA3AF"
                                autoCapitalize="none"
                                returnKeyType="search"
                            />
                            <View
                                onStartShouldSetResponder={() => true}
                                onResponderRelease={() => handleSearch()}
                                className="bg-primary px-4 py-3 h-full justify-center items-center ml-1"
                                style={Platform.OS === 'web' ? { cursor: 'pointer' } as any : undefined}
                            >
                                <Text className="text-white font-bold text-sm uppercase tracking-widest">Suchen</Text>
                            </View>
                            <View
                                onStartShouldSetResponder={() => true}
                                onResponderRelease={() => router.push('/scanner')}
                                className="p-3 bg-primary/10"
                                style={Platform.OS === 'web' ? { cursor: 'pointer' } as any : undefined}
                            >
                                <ScanLine size={18} color="#2563EB" />
                            </View>
                        </View>

                        {loading ? (
                            <ActivityIndicator size="small" color="#2563EB" className="my-4" />
                        ) : (
                            searchResults.length > 0 ? (
                                searchResults.map((item, index) => (
                                    <Animated.View key={item.id} entering={FadeInDown.delay(index * 30).springify()}>
                                        <View
                                            onStartShouldSetResponder={() => true}
                                            onResponderRelease={() => handleAddIngredient(item)}
                                            className="flex-row justify-between items-center py-3 border-b border-gray-100 dark:border-zinc-800 last:border-0"
                                        >
                                            <View className="flex-1 mr-4">
                                                <Text className="text-base font-medium text-text dark:text-zinc-50" numberOfLines={1}>{item.name}</Text>
                                                <Text className="text-xs text-textLight dark:text-zinc-400">
                                                    {item.brand ? `${item.brand} • ` : ''}{item.calories} kcal/100g
                                                    {item.servingSize ? ` • Stück` : ''}
                                                </Text>
                                            </View>
                                            <View className="flex-row items-center gap-x-2">
                                                <View
                                                    onStartShouldSetResponder={() => true}
                                                    onResponderMove={() => { }} // dummy to prevent bubble
                                                    onResponderRelease={(e) => {
                                                        e.stopPropagation();
                                                        toggleFavorite(item);
                                                    }}
                                                    hitSlop={8}
                                                >
                                                    <Star
                                                        size={18}
                                                        color={isFav(item.id) ? '#F59E0B' : '#D1D5DB'}
                                                        fill={isFav(item.id) ? '#F59E0B' : 'none'}
                                                    />
                                                </View>
                                                <Plus size={20} color="#2563EB" />
                                            </View>
                                        </View>
                                    </Animated.View>
                                ))
                            ) : searchQuery === '' ? (
                                <View className="mt-2 text-text dark:text-zinc-50">
                                    {favoriteFoods.length > 0 && (
                                        <>
                                            <Text className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-2">⭐ Favoriten</Text>
                                            {favoriteFoods.map(item => (
                                                <View
                                                    key={item.id}
                                                    onStartShouldSetResponder={() => true}
                                                    onResponderRelease={() => handleAddIngredient(item)}
                                                    className="flex-row justify-between items-center py-3 border-b border-gray-100 dark:border-zinc-800"
                                                >
                                                    <View className="flex-1 mr-4">
                                                        <Text className="text-base font-medium text-text dark:text-zinc-50" numberOfLines={1}>{item.name}</Text>
                                                        <Text className="text-xs text-textLight dark:text-zinc-400">{item.calories} kcal/100g</Text>
                                                    </View>
                                                    <Plus size={20} color="#2563EB" />
                                                </View>
                                            ))}
                                        </>
                                    )}
                                    {recentFoods.length > 0 && (
                                        <>
                                            <Text className="text-xs font-bold text-textLight dark:text-zinc-400 uppercase tracking-widest mb-2 mt-3">Zuletzt verwendet</Text>
                                            {recentFoods.slice(0, 5).map(item => (
                                                <View
                                                    key={item.id}
                                                    onStartShouldSetResponder={() => true}
                                                    onResponderRelease={() => handleAddIngredient(item)}
                                                    className="flex-row justify-between items-center py-3 border-b border-gray-100 dark:border-zinc-800"
                                                >
                                                    <View className="flex-1 mr-4">
                                                        <Text className="text-base font-medium text-text dark:text-zinc-50" numberOfLines={1}>{item.name}</Text>
                                                        <Text className="text-xs text-textLight dark:text-zinc-400">{item.calories} kcal/100g</Text>
                                                    </View>
                                                    <Plus size={20} color="#2563EB" />
                                                </View>
                                            ))}
                                        </>
                                    )}
                                    {savedRecipes.length > 0 && (
                                        <View className="mt-3">
                                            <Text className="text-xs font-bold text-textLight dark:text-zinc-400 uppercase tracking-widest mb-3">Gespeicherte Rezepte</Text>
                                            {savedRecipes.map((recipe) => (
                                                <View key={recipe.id} className="flex-row justify-between items-center py-3 border-b border-gray-100 dark:border-zinc-800 last:border-0">
                                                    <View className="flex-1 pr-4">
                                                        <Text className="text-base font-medium text-text dark:text-zinc-50">{recipe.name}</Text>
                                                        <Text className="text-xs text-textLight dark:text-zinc-400">{recipe.totalCalories} kcal • {recipe.ingredients.length} Zutaten</Text>
                                                    </View>
                                                    <View
                                                        onStartShouldSetResponder={() => true}
                                                        onResponderRelease={() => {
                                                            if (defaultMeal) {
                                                                addLog({ meal_type: defaultMeal as any, name: recipe.name, calories: recipe.totalCalories, protein: recipe.totalProtein, carbs: recipe.totalCarbs, fat: recipe.totalFat });
                                                                router.back();
                                                            } else {
                                                                setIngredients([...ingredients, ...recipe.ingredients]);
                                                            }
                                                        }}
                                                        className="bg-primary/10 px-3 py-1.5 rounded-full"
                                                    >
                                                        <Text className="text-primary text-xs font-bold">{defaultMeal ? 'Hinzufügen' : 'Zutaten'}</Text>
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            ) : null
                        )}
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(300).springify()}>
                        <View
                            onStartShouldSetResponder={() => !(!name || ingredients.length === 0)}
                            onResponderRelease={() => {
                                if (!name || ingredients.length === 0) return;
                                haptics.success();
                                handleSaveRecipe();
                            }}
                            className={`py-4 rounded-xl items-center mb-8 ${(!name || ingredients.length === 0) ? 'bg-blue-300' : 'bg-primary'}`}
                        >
                            <Text className="text-white font-bold text-lg">{editId ? 'Änderungen speichern' : 'Rezept speichern'}</Text>
                        </View>
                    </Animated.View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
