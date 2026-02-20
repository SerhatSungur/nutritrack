import { create } from 'zustand';

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
};

export type RecipeIngredient = {
    id: string;
    name: string;
    amount: number; // in grams or ml
    unit?: string;
    caloriesPer100g: number;
    proteinPer100g: number;
    carbsPer100g: number;
    fatPer100g: number;
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
    setMacroGoals: (goals: MacroTotals) => void;
    setDate: (date: Date) => void;
    addLog: (log: Omit<DailyLog, 'id'>) => void;
    addRecipe: (recipe: Omit<Recipe, 'id' | 'totalCalories' | 'totalProtein' | 'totalCarbs' | 'totalFat'>) => void;
    updateRecipe: (id: string, updates: Partial<Recipe>) => void;
    getDailyTotals: () => MacroTotals;
    getLogsByMeal: (meal: MealType) => DailyLog[];
}

export const useLogStore = create<LogState>((set, get) => ({
    currentDate: new Date(),
    logs: [
        { id: '1', meal_type: 'breakfast', name: 'Oatmeal & Berries', calories: 320, protein: 12, carbs: 45, fat: 6 },
        { id: '2', meal_type: 'lunch', name: 'Chicken Salad', calories: 450, protein: 35, carbs: 12, fat: 18 }
    ],
    recipes: [],
    macroGoals: { calories: 2400, protein: 150, carbs: 250, fat: 80 },
    setMacroGoals: (goals) => set({ macroGoals: goals }),
    setDate: (date) => set({ currentDate: date }),
    addLog: (log) => set((state) => ({
        logs: [...state.logs, { ...log, id: Math.random().toString() }]
    })),
    addRecipe: (recipeData) => set((state) => {
        // Calculate total macros from ingredients
        const totals = recipeData.ingredients.reduce(
            (acc, ing) => {
                const factor = ing.amount / 100;
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
        return get().logs.reduce((acc, log) => ({
            calories: acc.calories + log.calories,
            protein: acc.protein + log.protein,
            carbs: acc.carbs + log.carbs,
            fat: acc.fat + log.fat,
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    },
    getLogsByMeal: (meal) => get().logs.filter((l: DailyLog) => l.meal_type === meal),
}));
