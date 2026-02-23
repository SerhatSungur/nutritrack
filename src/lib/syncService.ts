import { supabase } from './supabase';
import { useLogStore } from '../store/useLogStore';
import { useAuthStore } from '../store/useAuthStore';

export const syncService = {
    /**
     * Pushes all local data to Supabase.
     */
    async pushAll() {
        const { user } = useAuthStore.getState();
        if (!user) return;

        const { userProfile, macroGoals, waterGoal, displayMacroMode, logs, recipes } = useLogStore.getState();

        try {
            // 1. Sync Profile
            await supabase.from('profiles').upsert({
                id: user.id,
                age: userProfile.age,
                gender: userProfile.gender,
                weight: userProfile.weight,
                height: userProfile.height,
                activity_level: userProfile.activityLevel,
                goal: userProfile.goal,
                water_goal: waterGoal,
                display_macro_mode: displayMacroMode,
                weight_history: useLogStore.getState().weightHistory,
                water_history: useLogStore.getState().waterHistory,
                updated_at: new Date().toISOString(),
            });

            // 2. Sync Logs (Batch)
            // Note: In a real app, you'd want a more sophisticated diffing strategy.
            // For now, we'll use log_date and name as a simple unique constraint if possible,
            // or just push matching IDs.
            for (const log of logs) {
                await supabase.from('daily_logs').upsert({
                    id: log.id,
                    user_id: user.id,
                    name: log.name,
                    meal_type: log.meal_type,
                    calories: log.calories,
                    protein: log.protein,
                    carbs: log.carbs,
                    fat: log.fat,
                    log_date: log.date,
                });
            }

            // 3. Sync Recipes
            for (const recipe of recipes) {
                await supabase.from('recipes').upsert({
                    id: recipe.id,
                    user_id: user.id,
                    name: recipe.name,
                    ingredients: recipe.ingredients,
                    total_calories: recipe.totalCalories,
                    total_protein: recipe.totalProtein,
                    total_carbs: recipe.totalCarbs,
                    total_fat: recipe.totalFat,
                    notes: recipe.notes,
                    is_public: recipe.is_public || false
                });
            }

            console.log('Sync push successful');
        } catch (error) {
            console.error('Sync push failed:', error);
        }
    },

    /**
     * Pulls data from Supabase and updates local store.
     */
    async pullAll() {
        const { user } = useAuthStore.getState();
        if (!user) return;

        try {
            // 1. Fetch Profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();

            if (profile) {
                useLogStore.getState().setUserProfile({
                    age: profile.age,
                    gender: profile.gender,
                    weight: profile.weight,
                    height: profile.height,
                    activityLevel: profile.activity_level,
                    goal: profile.goal,
                });
                useLogStore.getState().setWaterGoal(profile.water_goal);
                useLogStore.getState().setDisplayMacroMode(profile.display_macro_mode);
                useLogStore.setState({
                    weightHistory: profile.weight_history || [],
                    waterHistory: profile.water_history || [],
                });
            }

            // 2. Fetch Logs (Last 30 days)
            const { data: logs } = await supabase
                .from('daily_logs')
                .select('*')
                .eq('user_id', user.id)
                .order('log_date', { ascending: false })
                .limit(500);

            if (logs) {
                // Update store logs (simple merge)
                // This is a naive implementation; production would need better conflict resolution.
                const formattedLogs = logs.map((l: any) => ({
                    id: l.id,
                    meal_type: l.meal_type,
                    name: l.name,
                    calories: l.calories,
                    protein: l.protein,
                    carbs: l.carbs,
                    fat: l.fat,
                    date: l.log_date,
                }));
                // Replace local state with cloud state completely to ensure fresh pull overrides old cache
                useLogStore.setState({ logs: formattedLogs });
            }

            // 3. Fetch Recipes
            const { data: recipes } = await supabase
                .from('recipes')
                .select('*')
                .eq('user_id', user.id);

            if (recipes) {
                const formattedRecipes = recipes.map((r: any) => ({
                    id: r.id,
                    name: r.name,
                    ingredients: r.ingredients,
                    totalCalories: r.total_calories,
                    totalProtein: r.total_protein,
                    totalCarbs: r.total_carbs,
                    totalFat: r.total_fat,
                    notes: r.notes,
                    is_public: r.is_public
                }));
                useLogStore.setState({ recipes: formattedRecipes });
            }

            console.log('Sync pull successful');
        } catch (error) {
            console.error('Sync pull failed:', error);
        }
    },

    /**
     * Fetches public recipes from the community.
     */
    async fetchPublicRecipes() {
        try {
            const { data, error } = await supabase
                .from('recipes')
                .select('*')
                .eq('is_public', true)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            return data.map((r: any) => ({
                id: r.id,
                name: r.name,
                ingredients: r.ingredients,
                totalCalories: r.total_calories,
                totalProtein: r.total_protein,
                totalCarbs: r.total_carbs,
                totalFat: r.total_fat,
                notes: r.notes,
                is_public: r.is_public,
                user_id: r.user_id // Keep track of creator
            }));
        } catch (error) {
            console.error('Failed to fetch public recipes:', error);
            return [];
        }
    }
};
