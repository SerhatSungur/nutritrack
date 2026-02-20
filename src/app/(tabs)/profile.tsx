import { View, Text, TextInput, ScrollView, Switch, TouchableOpacity, Platform, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLogStore } from '../../store/useLogStore';
import { useColorScheme } from 'nativewind';
import { Moon, Sun, Target, User } from 'lucide-react-native';
import { useState } from 'react';

const ProfileNumberInput = ({ initialValue, onUpdate, unit, maxLength }: { initialValue: number, onUpdate: (val: number) => void, unit: string, maxLength: number }) => {
    const [value, setValue] = useState(initialValue ? initialValue.toString() : '0');
    return (
        <View className="flex-row items-center justify-between bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 h-[46px] px-3 rounded-xl min-w-[124px]">
            <TextInput
                value={value}
                onChangeText={setValue}
                onEndEditing={() => {
                    const parsed = parseInt(value) || 0;
                    setValue(parsed.toString());
                    onUpdate(parsed);
                }}
                keyboardType="numbers-and-punctuation"
                style={{ flex: 1, padding: 0, margin: 0, textAlign: 'center' }}
                className="text-[17px] font-bold text-text dark:text-zinc-50"
                maxLength={maxLength}
                selectTextOnFocus
                returnKeyType="done"
            />
            <View className="border-l border-gray-200 dark:border-zinc-700 pl-3 ml-2 flex-row items-center h-[28px]">
                <Text className="text-[11px] font-extrabold text-textLight dark:text-zinc-400 uppercase tracking-widest">{unit}</Text>
            </View>
        </View>
    );
};

export default function ProfileScreen() {
    const { macroGoals, setMacroGoals } = useLogStore();
    const { colorScheme, toggleColorScheme } = useColorScheme();

    const handleUpdateGoal = (key: keyof typeof macroGoals, numValue: number) => {
        setMacroGoals({
            ...macroGoals,
            [key]: numValue
        });
    };

    return (
        <View className="flex-1 bg-background dark:bg-zinc-950 pt-12">
            {/* Header */}
            <View className="px-6 py-4 flex-row justify-between items-center bg-card dark:bg-zinc-900 shadow-[0_2px_8px_rgba(0,0,0,0.02)] z-10">
                <Text className="text-3xl font-extrabold text-text dark:text-zinc-50">Profile</Text>
            </View>

            <ScrollView
                className="flex-1 px-4 pt-6 md:px-8"
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 100 }}
                automaticallyAdjustKeyboardInsets={true}
            >

                <View className="md:max-w-2xl md:mx-auto w-full">
                    {/* Account Section (Placeholder for Supabase Auth in next step) */}
                    <View className="bg-card dark:bg-zinc-900 rounded-3xl p-5 mb-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] items-center">
                        <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4">
                            <User size={40} color="#2563EB" />
                        </View>
                        <Text className="text-xl font-bold text-text dark:text-zinc-50 mb-1">Anonymous User</Text>
                        <Text className="text-sm text-textLight dark:text-zinc-400 text-center mb-6 px-4">
                            Your data is currently saved locally. Sign in to sync across devices.
                        </Text>
                        <TouchableOpacity className="bg-primary w-full py-3.5 rounded-xl items-center shadow-sm">
                            <Text className="text-white font-bold text-base">Sign In / Sign Up</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Preferences Section */}
                    <View className="bg-card dark:bg-zinc-900 rounded-3xl p-5 mb-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                        <Text className="text-sm font-bold text-textLight dark:text-zinc-400 uppercase tracking-wider mb-4 ml-1">Preferences</Text>

                        <View className="flex-row items-center justify-between py-3 border-b border-gray-100 dark:border-zinc-800">
                            <View className="flex-row items-center">
                                {colorScheme === 'dark' ? (
                                    <Moon size={22} color="#8B5CF6" className="mr-3" />
                                ) : (
                                    <Sun size={22} color="#F59E0B" className="mr-3" />
                                )}
                                <Text className="text-base font-semibold text-text dark:text-zinc-50">Dark Mode</Text>
                            </View>
                            <Switch
                                value={colorScheme === 'dark'}
                                onValueChange={toggleColorScheme}
                                trackColor={{ false: '#E5E7EB', true: '#2563EB' }}
                                thumbColor={'#FFFFFF'}
                            />
                        </View>
                    </View>

                    {/* Macro Goals Section */}
                    <View className="bg-card dark:bg-zinc-900 rounded-3xl p-5 mb-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                        <View className="flex-row items-center mb-5 ml-1">
                            <Target size={20} color="#10B981" className="mr-2" />
                            <Text className="text-sm font-bold text-textLight dark:text-zinc-400 uppercase tracking-wider">Daily Macro Goals</Text>
                        </View>

                        <View className="flex-row justify-between items-center py-3 border-b border-gray-100 dark:border-zinc-800">
                            <Text className="text-base font-semibold text-text dark:text-zinc-50">Calories</Text>
                            <ProfileNumberInput
                                initialValue={macroGoals.calories}
                                onUpdate={(val) => handleUpdateGoal('calories', val)}
                                unit="kcal"
                                maxLength={5}
                            />
                        </View>

                        <View className="flex-row justify-between items-center py-3 border-b border-gray-100 dark:border-zinc-800">
                            <Text className="text-base font-semibold text-text dark:text-zinc-50">Protein</Text>
                            <ProfileNumberInput
                                initialValue={macroGoals.protein}
                                onUpdate={(val) => handleUpdateGoal('protein', val)}
                                unit="g"
                                maxLength={3}
                            />
                        </View>

                        <View className="flex-row justify-between items-center py-3 border-b border-gray-100 dark:border-zinc-800">
                            <Text className="text-base font-semibold text-text dark:text-zinc-50">Carbs</Text>
                            <ProfileNumberInput
                                initialValue={macroGoals.carbs}
                                onUpdate={(val) => handleUpdateGoal('carbs', val)}
                                unit="g"
                                maxLength={3}
                            />
                        </View>

                        <View className="flex-row justify-between items-center py-3">
                            <Text className="text-base font-semibold text-text dark:text-zinc-50">Fat</Text>
                            <ProfileNumberInput
                                initialValue={macroGoals.fat}
                                onUpdate={(val) => handleUpdateGoal('fat', val)}
                                unit="g"
                                maxLength={3}
                            />
                        </View>

                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
