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
                    user_id: user.id,
                    name: recipe.name,
                    ingredients: recipe.ingredients,
                    total_calories: recipe.totalCalories,
                    total_protein: recipe.totalProtein,
                    total_carbs: recipe.totalCarbs,
                    total_fat: recipe.totalFat,
                    notes: recipe.notes,
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
                .single();

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
                const formattedLogs = logs.map(l => ({
                    id: l.id,
                    meal_type: l.meal_type,
                    name: l.name,
                    calories: l.calories,
                    protein: l.protein,
                    carbs: l.carbs,
                    fat: l.fat,
                    date: l.log_date,
                }));
                // For simplicity, replace local with cloud on login
                useLogStore.setState({ logs: formattedLogs });
            }

            console.log('Sync pull successful');
        } catch (error) {
            console.error('Sync pull failed:', error);
        }
    },
};
