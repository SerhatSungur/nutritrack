import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import type { FoodItem } from '../lib/api/foodApi';
import type { UserProfile } from '../lib/nutritionUtils';

const isSameDayString = (d1: string, d2: string) => d1 === d2;

// Lightweight UUID v4 generator to bypass NPM permission issues locally
export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Defensive storage wrapper to prevent bundling errors if AsyncStorage is missing
const getDefensiveStorage = (): StateStorage => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        return {
            getItem: (name) => AsyncStorage.getItem(name),
            setItem: (name, value) => AsyncStorage.setItem(name, value),
            removeItem: (name) => AsyncStorage.removeItem(name),
        };
    } catch (e) {
        // Fallback to in-memory storage if AsyncStorage is not available
        const memoryStorage = new Map<string, string>();
        return {
            getItem: (name) => memoryStorage.get(name) || null,
            setItem: (name, value) => memoryStorage.set(name, value),
            removeItem: (name) => memoryStorage.delete(name),
        };
    }
};

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
    is_public?: boolean;
};

export type HistoryEntry = {
    date: string;
    value: number;
};

interface LogState {
    currentDate: Date;
    logs: DailyLog[];
    recipes: Recipe[];
    macroGoals: MacroTotals;
    userProfile: UserProfile;

    // Water tracking
    waterIntake: number; // ml for current date
    waterGoal: number;   // ml target

    // History data
    weightHistory: HistoryEntry[];
    waterHistory: HistoryEntry[];

    // Recent & favorite foods
    recentFoods: FoodItem[];
    favoriteFoods: FoodItem[];

    // UI Settings
    displayMacroMode: 'remaining' | 'consumed';

    // Actions
    setMacroGoals: (goals: MacroTotals) => void;
    setUserProfile: (profile: Partial<UserProfile>) => void;
    setDate: (date: Date) => void;
    addLog: (log: Omit<DailyLog, 'id' | 'date'> & { date?: string }) => void;
    addRecipe: (recipe: Omit<Recipe, 'id' | 'totalCalories' | 'totalProtein' | 'totalCarbs' | 'totalFat'>) => void;
    updateRecipe: (id: string, updates: Partial<Recipe>) => void;
    getDailyTotals: () => MacroTotals;
    getLogsByMeal: (meal: MealType) => DailyLog[];

    addWater: (ml: number, date?: string) => void;
    setWaterGoal: (ml: number) => void;
    resetWater: () => void;

    addWeight: (weight: number, date?: string) => void;

    deleteRecipe: (id: string) => void;

    addRecentFood: (food: FoodItem) => void;
    toggleFavorite: (food: FoodItem) => void;
    isFavorite: (foodId: string) => boolean;

    setDisplayMacroMode: (mode: 'remaining' | 'consumed') => void;
    clearStore: () => void;
}

export const useLogStore = create<LogState>()(
    persist(
        (set, get) => ({
            currentDate: new Date(),
            logs: [],
            recipes: [],
            macroGoals: { calories: 2400, protein: 150, carbs: 250, fat: 80 },
            userProfile: {
                age: 30,
                gender: 'male',
                weight: 80,
                height: 180,
                activityLevel: 1.2,
                goal: 'maintain',
            },

            waterIntake: 0,
            waterGoal: 2500,

            weightHistory: [],
            waterHistory: [],

            recentFoods: [],
            favoriteFoods: [],

            displayMacroMode: 'remaining',

            setMacroGoals: (goals) => set({ macroGoals: goals }),
            setUserProfile: (updates) => set((state) => {
                const newProfile = { ...state.userProfile, ...updates };

                // If weight changed, add to history
                let newWeightHistory = state.weightHistory;
                if (updates.weight !== undefined) {
                    const today = new Date().toISOString().split('T')[0];
                    newWeightHistory = [
                        ...state.weightHistory.filter(h => h.date !== today),
                        { date: today, value: updates.weight }
                    ].sort((a, b) => a.date.localeCompare(b.date));
                }

                return {
                    userProfile: newProfile,
                    weightHistory: newWeightHistory
                };
            }),
            setDate: (date) => set({ currentDate: date }),

            addLog: (log) => set((state) => {
                const logDate = log.date || state.currentDate.toISOString().split('T')[0];
                return {
                    logs: [...state.logs, { ...log, id: generateUUID(), date: logDate }]
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
                    id: generateUUID(),
                    totalCalories: Math.round(totals.calories),
                    totalProtein: Math.round(totals.protein),
                    totalCarbs: Math.round(totals.carbs),
                    totalFat: Math.round(totals.fat),
                    is_public: recipeData.is_public || false
                };
                return { recipes: [...state.recipes, newRecipe] };
            }),

            updateRecipe: (id, updates) => set((state) => ({
                recipes: state.recipes.map(recipe =>
                    recipe.id === id ? { ...recipe, ...updates } : recipe
                )
            })),

            deleteRecipe: (id) => set((state) => ({
                recipes: state.recipes.filter(recipe => recipe.id !== id)
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

            addWater: (ml, date) => set((state) => {
                const targetDate = date || state.currentDate.toISOString().split('T')[0];
                const isCurrentDate = isSameDayString(targetDate, state.currentDate.toISOString().split('T')[0]);

                // Update today's live intake if applicable
                const newIntake = isCurrentDate ? Math.max(0, state.waterIntake + ml) : state.waterIntake;

                // Update history
                const currentHistoryVal = state.waterHistory.find(h => h.date === targetDate)?.value || 0;
                const newHistory = [
                    ...state.waterHistory.filter(h => h.date !== targetDate),
                    { date: targetDate, value: Math.max(0, currentHistoryVal + ml) }
                ].sort((a, b) => a.date.localeCompare(b.date));

                return {
                    waterIntake: newIntake,
                    waterHistory: newHistory
                };
            }),
            setWaterGoal: (ml) => set({ waterGoal: ml }),
            resetWater: () => set({ waterIntake: 0, waterHistory: [] }),

            addWeight: (weight, date) => set((state) => {
                const targetDate = date || new Date().toISOString().split('T')[0];
                const newHistory = [
                    ...state.weightHistory.filter(h => h.date !== targetDate),
                    { date: targetDate, value: weight }
                ].sort((a, b) => a.date.localeCompare(b.date));

                // Also update the live userProfile if it's the latest entry
                const latestDate = newHistory[newHistory.length - 1]?.date;
                const updateProfile = latestDate === targetDate;

                return {
                    weightHistory: newHistory,
                    userProfile: updateProfile ? { ...state.userProfile, weight } : state.userProfile
                };
            }),

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

            clearStore: () => set({
                logs: [],
                recipes: [],
                waterIntake: 0,
                waterHistory: [],
                weightHistory: [],
                recentFoods: [],
                favoriteFoods: []
            }),
        }),
        {
            name: 'nutritrack-storage',
            storage: createJSONStorage(() => getDefensiveStorage()),
            // Don't persist currentDate as we want it to reset to "today" on app start
            partialize: (state) => {
                const { currentDate, ...rest } = state;
                return rest;
            },
        }
    )
);

// ─── Auto-Sync Subscriber ──────────────────────────────────────────────────

// We use a small timeout to debounce multiple rapid changes
let syncTimeout: NodeJS.Timeout | null = null;

useLogStore.subscribe((state, prevState) => {
    // Only sync if certain fields changed
    const relevantFieldsChanged =
        state.userProfile !== prevState.userProfile ||
        state.macroGoals !== prevState.macroGoals ||
        state.waterGoal !== prevState.waterGoal ||
        state.waterIntake !== prevState.waterIntake ||
        state.logs.length !== prevState.logs.length ||
        state.recipes.length !== prevState.recipes.length;

    if (relevantFieldsChanged) {
        if (syncTimeout) clearTimeout(syncTimeout);
        syncTimeout = setTimeout(async () => {
            try {
                // Lazy import syncService to avoid circular dependency
                const { syncService } = await import('../lib/syncService');
                await syncService.pushAll();
            } catch (error) {
                console.error('Auto-sync failed:', error);
            }
        }, 2000); // 2 second debounce
    }
});

