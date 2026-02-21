import { create } from 'zustand';
import type { FoodItem } from '../lib/api/foodApi';

export type MacroTotals = {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
};

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type DailyLog = {
    id: string;
    meal_type: MealType;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    date: string; // ISO format string YYYY-MM-DD
};

export type RecipeIngredient = {
    id: string;
    name: string;
    amount: number;
    unit?: string;
    caloriesPer100g: number;
    proteinPer100g: number;
    carbsPer100g: number;
    fatPer100g: number;
    servingSize?: string;
    servingQuantity?: number;
    useServing?: boolean;
};

export type Recipe = {
    id: string;
    name: string;
    ingredients: RecipeIngredient[];
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    notes?: string;
};

interface LogState {
    currentDate: Date;
    logs: DailyLog[];
    recipes: Recipe[];
    macroGoals: MacroTotals;

    // Water tracking
    waterIntake: number; // ml for current date
    waterGoal: number;   // ml target

    // Recent & favorite foods
    recentFoods: FoodItem[];
    favoriteFoods: FoodItem[];

    // UI Settings
    displayMacroMode: 'remaining' | 'consumed';

    // Actions
    setMacroGoals: (goals: MacroTotals) => void;
    setDate: (date: Date) => void;
    addLog: (log: Omit<DailyLog, 'id' | 'date'> & { date?: string }) => void;
    addRecipe: (recipe: Omit<Recipe, 'id' | 'totalCalories' | 'totalProtein' | 'totalCarbs' | 'totalFat'>) => void;
    updateRecipe: (id: string, updates: Partial<Recipe>) => void;
    getDailyTotals: () => MacroTotals;
    getLogsByMeal: (meal: MealType) => DailyLog[];

    addWater: (ml: number) => void;
    setWaterGoal: (ml: number) => void;
    resetWater: () => void;

    addRecentFood: (food: FoodItem) => void;
    toggleFavorite: (food: FoodItem) => void;
    isFavorite: (foodId: string) => boolean;

    setDisplayMacroMode: (mode: 'remaining' | 'consumed') => void;
}

export const useLogStore = create<LogState>((set, get) => ({
    currentDate: new Date(),
    logs: [
        { id: '1', meal_type: 'breakfast', name: 'Oatmeal & Berries', calories: 320, protein: 12, carbs: 45, fat: 6, date: new Date().toISOString().split('T')[0] },
        { id: '2', meal_type: 'lunch', name: 'Chicken Salad', calories: 450, protein: 35, carbs: 12, fat: 18, date: new Date().toISOString().split('T')[0] }
    ],
    recipes: [],
    macroGoals: { calories: 2400, protein: 150, carbs: 250, fat: 80 },

    waterIntake: 0,
    waterGoal: 2500,

    recentFoods: [],
    favoriteFoods: [],

    displayMacroMode: 'remaining',

    setMacroGoals: (goals) => set({ macroGoals: goals }),
    setDate: (date) => set({ currentDate: date }),

    addLog: (log) => set((state) => {
        const logDate = log.date || state.currentDate.toISOString().split('T')[0];
        return {
            logs: [...state.logs, { ...log, id: Math.random().toString(), date: logDate }]
        };
    }),

    addRecipe: (recipeData) => set((state) => {
        const totals = recipeData.ingredients.reduce(
            (acc, ing) => {
                const actualGrams = ing.useServing && ing.servingQuantity ? ing.amount * ing.servingQuantity : ing.amount;
                const factor = actualGrams / 100;
                return {
                    calories: acc.calories + ing.caloriesPer100g * factor,
                    protein: acc.protein + ing.proteinPer100g * factor,
                    carbs: acc.carbs + ing.carbsPer100g * factor,
                    fat: acc.fat + ing.fatPer100g * factor,
                };
            },
            { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );
        const newRecipe: Recipe = {
            ...recipeData,
            id: Math.random().toString(),
            totalCalories: Math.round(totals.calories),
            totalProtein: Math.round(totals.protein),
            totalCarbs: Math.round(totals.carbs),
            totalFat: Math.round(totals.fat),
        };
        return { recipes: [...state.recipes, newRecipe] };
    }),

    updateRecipe: (id, updates) => set((state) => ({
        recipes: state.recipes.map(recipe =>
            recipe.id === id ? { ...recipe, ...updates } : recipe
        )
    })),

    getDailyTotals: () => {
        const targetDate = get().currentDate.toISOString().split('T')[0];
        return get().logs
            .filter((log) => log.date === targetDate)
            .reduce((acc, log) => ({
                calories: acc.calories + log.calories,
                protein: acc.protein + log.protein,
                carbs: acc.carbs + log.carbs,
                fat: acc.fat + log.fat,
            }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    },

    getLogsByMeal: (meal) => {
        const targetDate = get().currentDate.toISOString().split('T')[0];
        return get().logs.filter((l: DailyLog) => l.meal_type === meal && l.date === targetDate);
    },

    addWater: (ml) => set((state) => ({ waterIntake: Math.max(0, state.waterIntake + ml) })),
    setWaterGoal: (ml) => set({ waterGoal: ml }),
    resetWater: () => set({ waterIntake: 0 }),

    addRecentFood: (food) => set((state) => {
        const filtered = state.recentFoods.filter(f => f.id !== food.id);
        return { recentFoods: [food, ...filtered].slice(0, 10) };
    }),

    toggleFavorite: (food) => set((state) => {
        const exists = state.favoriteFoods.some(f => f.id === food.id);
        return {
            favoriteFoods: exists
                ? state.favoriteFoods.filter(f => f.id !== food.id)
                : [food, ...state.favoriteFoods]
        };
    }),

    isFavorite: (foodId) => get().favoriteFoods.some(f => f.id === foodId),

    setDisplayMacroMode: (mode) => set({ displayMacroMode: mode }),
}));
