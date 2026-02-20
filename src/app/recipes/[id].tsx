import { View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLogStore } from '../../store/useLogStore';
import { ChevronLeft, PlusCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RecipeDetailScreen() {
 const { id } = useLocalSearchParams();
 const router = useRouter();

 const recipe = useLogStore(state => state.recipes.find(r => r.id === id));
 const updateRecipe = useLogStore(state => state.updateRecipe);
 const addLog = useLogStore(state => state.addLog);

 if (!recipe) {
 return (
 <SafeAreaView className="flex-1 bg-background dark:bg-zinc-950 justify-center items-center">
 <Text className="text-xl font-bold text-textLight dark:text-zinc-400">Recipe not found.</Text>
 <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-primary px-6 py-3 rounded-xl">
 <Text className="text-white font-bold">Go Back</Text>
 </TouchableOpacity>
 </SafeAreaView>
 );
 }

 return (
 <SafeAreaView className="flex-1 bg-background dark:bg-zinc-950" edges={['top']}>
 {/* Header */}
 <View className="px-4 py-3 flex-row items-center border-b border-gray-100 dark:border-zinc-800 bg-card dark:bg-zinc-900">
 <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
 <ChevronLeft size={28} color="#1F2937" />
 </TouchableOpacity>
 <Text className="text-2xl font-bold text-text dark:text-zinc-50 flex-1" numberOfLines={1}>{recipe.name}</Text>
 </View>

 <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
 <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>
 {/* Macros Overview */}
 <View className="bg-card dark:bg-zinc-900 rounded-2xl p-5 mb-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
 <View className="items-center mb-4">
 <Text className="text-5xl font-extrabold text-primary">{recipe.totalCalories}</Text>
 <Text className="text-sm font-semibold text-textLight dark:text-zinc-400 uppercase tracking-widest mt-1">Calories</Text>
 </View>

 <View className="flex-row justify-between border-t border-gray-100 dark:border-zinc-800 pt-4">
 <View className="items-center flex-1">
 <Text className="text-xl font-bold text-text dark:text-zinc-50 mb-1">{recipe.totalProtein}g</Text>
 <Text className="text-xs font-semibold text-textLight dark:text-zinc-400 uppercase tracking-wider">Protein</Text>
 </View>
 <View className="items-center flex-1 border-l border-r border-gray-100 dark:border-zinc-800 px-2">
 <Text className="text-xl font-bold text-text dark:text-zinc-50 mb-1">{recipe.totalCarbs}g</Text>
 <Text className="text-xs font-semibold text-textLight dark:text-zinc-400 uppercase tracking-wider">Carbs</Text>
 </View>
 <View className="items-center flex-1">
 <Text className="text-xl font-bold text-text dark:text-zinc-50 mb-1">{recipe.totalFat}g</Text>
 <Text className="text-xs font-semibold text-textLight dark:text-zinc-400 uppercase tracking-wider">Fat</Text>
 </View>
 </View>
 </View>

 {/* Quick Log Action Buttons */}
 <View className="mb-8 p-4 bg-gray-50 dark:bg-zinc-800/80 rounded-2xl border border-gray-100 dark:border-zinc-800">
 <Text className="text-sm font-bold text-textLight dark:text-zinc-400 mb-4 uppercase tracking-wider text-center">Log Entire Recipe</Text>
 <View className="flex-row flex-wrap justify-between gap-y-3">
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
 className="w-[48%] bg-card dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 flex-row items-center justify-center py-3.5 rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.02)]"
 >
 <PlusCircle size={16} color="#2563EB" className="mr-2" />
 <Text className="text-text dark:text-zinc-50 font-bold capitalize text-base">{meal}</Text>
 </TouchableOpacity>
 ))}
 </View>
 </View>

 {/* Ingredients List */}
 <View className="bg-card dark:bg-zinc-900 rounded-2xl p-5 mb-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
 <Text className="text-md font-bold text-text dark:text-zinc-50 mb-4">Ingredients ({recipe.ingredients.length})</Text>
 {recipe.ingredients.map((ing, idx) => (
 <View key={ing.id} className={`flex-row justify-between py-3 ${idx !== recipe.ingredients.length - 1 ? 'border-b border-gray-100 dark:border-zinc-800' : ''}`}>
 <Text className="text-base font-medium text-text dark:text-zinc-50 flex-1 pr-4">{ing.name}</Text>
 <View className="items-end">
 <Text className="font-semibold text-text dark:text-zinc-50">{ing.amount}g</Text>
 <Text className="text-xs text-textLight dark:text-zinc-400 mt-1">{Math.round(ing.caloriesPer100g * (ing.amount / 100))} kcal</Text>
 </View>
 </View>
 ))}
 </View>

 {/* Notes Section */}
 <View className="bg-card dark:bg-zinc-900 rounded-2xl p-5 mb-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
 <Text className="text-md font-bold text-text dark:text-zinc-50 mb-3">Preparation Notes</Text>
 <TextInput
 multiline
 className="text-base text-text dark:text-zinc-50 min-h-[120px] bg-gray-50 dark:bg-zinc-800 rounded-xl p-4 border border-gray-100 dark:border-zinc-800 mb-3"
 placeholder="Add cooking instructions, tips, or personal tweaks here..."
 placeholderTextColor="#9CA3AF"
 value={recipe.notes || ''}
 onChangeText={(text) => updateRecipe(recipe.id, { notes: text })}
 textAlignVertical="top"
 />
 <TouchableOpacity onPress={() => Keyboard.dismiss()} className="bg-primary ml-auto px-4 py-2 rounded-lg">
 <Text className="text-white font-bold text-sm">Save Notes</Text>
 </TouchableOpacity>
 </View>

 <View className="h-12" />
 </ScrollView>
 </KeyboardAvoidingView>
 </SafeAreaView>
 );
}
