export type UserProfile = {
    age: number;
    gender: 'male' | 'female' | 'other';
    weight: number; // kg
    height: number; // cm
    activityLevel: number; // PAL factor (1.2 to 1.9)
    goal: 'lose' | 'maintain' | 'gain';
};

/**
 * Calculates the Basal Metabolic Rate (BMR) using the Mifflin-St Jeor Equation.
 */
export const calculateBMR = (profile: UserProfile): number => {
    const { gender, weight, height, age } = profile;

    // Mifflin-St Jeor Equation
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);

    if (gender === 'male') {
        bmr += 5;
    } else {
        bmr -= 161;
    }

    return bmr;
};

/**
 * Calculates the Total Daily Energy Expenditure (TDEE).
 */
export const calculateTDEE = (profile: UserProfile): number => {
    const bmr = calculateBMR(profile);
    return Math.round(bmr * profile.activityLevel);
};

/**
 * Suggests calorie and macro goals based on user profile and target.
 */
export const suggestGoals = (profile: UserProfile) => {
    const tdee = calculateTDEE(profile);
    let calorieGoal = tdee;

    // Adjust calories based on goal
    if (profile.goal === 'lose') {
        calorieGoal -= 500; // Standard 500kcal deficit
    } else if (profile.goal === 'gain') {
        calorieGoal += 300; // Standard 300kcal surplus
    }

    // Standard macro split: 30% Protein, 40% Carbs, 30% Fat
    // 1g Protein = 4kcal, 1g Carbs = 4kcal, 1g Fat = 9kcal
    const proteinGrams = Math.round((calorieGoal * 0.3) / 4);
    const carbsGrams = Math.round((calorieGoal * 0.4) / 4);
    const fatGrams = Math.round((calorieGoal * 0.3) / 9);

    return {
        calories: Math.max(1200, calorieGoal), // Safety floor
        protein: proteinGrams,
        carbs: carbsGrams,
        fat: fatGrams,
    };
};

export const ACTIVITY_LEVELS = [
    { label: 'Sitzend (Wenig-kein Sport)', value: 1.2 },
    { label: 'Leicht aktiv (1-3 Tage/Woche)', value: 1.375 },
    { label: 'Mäßig aktiv (3-5 Tage/Woche)', value: 1.55 },
    { label: 'Sehr aktiv (6-7 Tage/Woche)', value: 1.725 },
    { label: 'Extrem aktiv (Harter Job/Sport)', value: 1.9 },
];
