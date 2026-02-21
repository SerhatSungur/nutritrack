import {
    View, Text, TextInput, ScrollView, Switch,
    TouchableOpacity, Pressable, Keyboard, Appearance,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLogStore } from '../../store/useLogStore';
import { useColorScheme } from 'nativewind';
import { Moon, Sun, Target, User, Droplets, Layout } from 'lucide-react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { haptics } from '../../lib/haptics';

// ─── Sub-Components ──────────────────────────────────────────────────────────

const ProfileNumberInput = ({
    initialValue, onUpdate, unit, maxLength
}: {
    initialValue: number; onUpdate: (val: number) => void; unit: string; maxLength: number;
}) => {
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

const MacroDisplayToggle = ({ isDark }: { isDark: boolean }) => {
    const mode = useLogStore(s => s.displayMacroMode);
    const setMode = useLogStore(s => s.setDisplayMacroMode);

    const handleSetMode = useCallback((newMode: 'remaining' | 'consumed') => {
        if (mode === newMode) return;
        haptics.selection();
        setMode(newMode);
    }, [mode, setMode]);

    const activeBg = isDark ? '#3F3F46' : '#FFFFFF';
    const inactiveText = isDark ? '#71717A' : '#71717A';

    return (
        <View className="py-3">
            <View className="flex-row items-center gap-x-3 mb-4">
                <Layout size={22} color="#3B82F6" />
                <View>
                    <Text className="text-base font-semibold text-text dark:text-zinc-50">Ring-Anzeige</Text>
                    <Text className="text-xs text-textLight dark:text-zinc-400">Wähle, was im Dashboard im Zentrum stehen soll</Text>
                </View>
            </View>

            <View style={{
                flexDirection: 'row',
                backgroundColor: isDark ? '#27272A' : '#F3F4F6',
                padding: 4,
                borderRadius: 12
            }}>
                <View
                    onStartShouldSetResponder={() => true}
                    onResponderRelease={() => handleSetMode('remaining')}
                    style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 8,
                        alignItems: 'center',
                        backgroundColor: mode === 'remaining' ? activeBg : 'transparent',
                    }}
                >
                    <Text style={{
                        fontSize: 14,
                        fontWeight: '700',
                        color: mode === 'remaining' ? '#2563EB' : inactiveText
                    }}>
                        Übrig
                    </Text>
                </View>
                <View
                    onStartShouldSetResponder={() => true}
                    onResponderRelease={() => handleSetMode('consumed')}
                    style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 8,
                        alignItems: 'center',
                        backgroundColor: mode === 'consumed' ? activeBg : 'transparent',
                    }}
                >
                    <Text style={{
                        fontSize: 14,
                        fontWeight: '700',
                        color: mode === 'consumed' ? '#2563EB' : inactiveText
                    }}>
                        Gegessen
                    </Text>
                </View>
            </View>
        </View>
    );
};

export default function ProfileScreen() {
    const macroGoals = useLogStore(s => s.macroGoals);
    const setMacroGoals = useLogStore(s => s.setMacroGoals);
    const waterGoal = useLogStore(s => s.waterGoal);
    const setWaterGoal = useLogStore(s => s.setWaterGoal);

    const { colorScheme, toggleColorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    const handleUpdateGoal = (key: keyof typeof macroGoals, numValue: number) => {
        setMacroGoals({ ...macroGoals, [key]: numValue });
    };

    const handleToggleDark = () => {
        Appearance.setColorScheme(isDark ? 'light' : 'dark');
        toggleColorScheme();
    };

    const headerBg = isDark ? '#18181B' : '#FFFFFF';
    const pageBg = isDark ? '#09090B' : '#F4F4F5';

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: headerBg }} edges={['top']}>
            <View style={{
                backgroundColor: headerBg,
                paddingHorizontal: 20,
                height: 70,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Text style={{
                    fontSize: 28,
                    fontFamily: 'PlusJakartaSans_800ExtraBold',
                    color: isDark ? '#FAFAFA' : '#09090B'
                }}>
                    Profil
                </Text>
            </View>

            <ScrollView
                style={{ flex: 1, backgroundColor: pageBg }}
                className="flex-1 px-4 pt-6"
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 100 }}
                automaticallyAdjustKeyboardInsets={true}
            >
                {/* Account Section */}
                <Animated.View entering={FadeInDown.delay(100).duration(600)}>
                    <View className="bg-card dark:bg-zinc-900 rounded-3xl p-5 mb-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] items-center">
                        <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4">
                            <User size={40} color="#2563EB" />
                        </View>
                        <Text className="text-xl font-bold text-text dark:text-zinc-50 mb-1">Anonymer Benutzer</Text>
                        <Text className="text-sm text-textLight dark:text-zinc-400 text-center mb-6 px-4">
                            Deine Daten werden derzeit lokal gespeichert. Melde dich an, um sie zu synchronisieren.
                        </Text>
                        <View
                            onStartShouldSetResponder={() => true}
                            onResponderRelease={() => {/* Handle login */ }}
                            style={{
                                backgroundColor: '#2563EB',
                                width: '100%',
                                paddingVertical: 14,
                                borderRadius: 12,
                                alignItems: 'center',
                            }}
                        >
                            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>Anmelden / Registrieren</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Preferences Section */}
                <Animated.View entering={FadeInDown.delay(200).duration(600)}>
                    <View className="bg-card dark:bg-zinc-900 rounded-3xl p-5 mb-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                        <Text className="text-sm font-bold text-textLight dark:text-zinc-400 uppercase tracking-wider mb-4 ml-1">Einstellungen</Text>

                        <View className="flex-row items-center justify-between py-3 border-b border-gray-100 dark:border-zinc-800">
                            <View className="flex-row items-center gap-x-3">
                                {isDark
                                    ? <Moon size={22} color="#8B5CF6" />
                                    : <Sun size={22} color="#F59E0B" />
                                }
                                <Text className="text-base font-semibold text-text dark:text-zinc-50">Dunkelmodus</Text>
                            </View>
                            <Switch
                                value={isDark}
                                onValueChange={handleToggleDark}
                                trackColor={{ false: '#E5E7EB', true: '#2563EB' }}
                                thumbColor={'#FFFFFF'}
                            />
                        </View>

                        <MacroDisplayToggle isDark={isDark} />
                    </View>
                </Animated.View>

                {/* Water Goal Section */}
                <Animated.View entering={FadeInDown.delay(300).duration(600)}>
                    <View className="bg-card dark:bg-zinc-900 rounded-3xl p-5 mb-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                        <View className="flex-row items-center mb-4 ml-1 gap-x-2">
                            <Droplets size={20} color="#3B82F6" />
                            <Text className="text-sm font-bold text-textLight dark:text-zinc-400 uppercase tracking-wider">Wasser-Ziel</Text>
                        </View>
                        <View className="flex-row justify-between items-center py-1">
                            <Text className="text-base font-semibold text-text dark:text-zinc-50">Tagesziel</Text>
                            <ProfileNumberInput
                                initialValue={waterGoal}
                                onUpdate={(val) => setWaterGoal(Math.max(100, val))}
                                unit="ml"
                                maxLength={5}
                            />
                        </View>
                    </View>
                </Animated.View>

                {/* Macro Goals Section */}
                <Animated.View entering={FadeInDown.delay(400).duration(600)}>
                    <View className="bg-card dark:bg-zinc-900 rounded-3xl p-5 mb-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                        <View className="flex-row items-center mb-5 ml-1 gap-x-2">
                            <Target size={20} color="#10B981" />
                            <Text className="text-sm font-bold text-textLight dark:text-zinc-400 uppercase tracking-wider">Tägliche Makro-Ziele</Text>
                        </View>

                        {[
                            { label: 'Kalorien', key: 'calories' as const, unit: 'kcal', max: 5 },
                            { label: 'Protein', key: 'protein' as const, unit: 'g', max: 3 },
                            { label: 'Kohlenhydrate', key: 'carbs' as const, unit: 'g', max: 3 },
                            { label: 'Fett', key: 'fat' as const, unit: 'g', max: 3 },
                        ].map(({ label, key, unit, max }, i, arr) => (
                            <View key={key} className={`flex-row justify-between items-center py-3 ${i < arr.length - 1 ? 'border-b border-gray-100 dark:border-zinc-800' : ''}`}>
                                <Text className="text-base font-semibold text-text dark:text-zinc-50">{label}</Text>
                                <ProfileNumberInput
                                    initialValue={macroGoals[key]}
                                    onUpdate={(val) => handleUpdateGoal(key, val)}
                                    unit={unit}
                                    maxLength={max}
                                />
                            </View>
                        ))}
                    </View>
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
}
