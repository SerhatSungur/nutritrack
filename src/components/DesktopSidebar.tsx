import { View, Text, TouchableOpacity } from 'react-native';
import { Home, BookOpen, User } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useRouter, useSegments } from 'expo-router';
import { haptics } from '../lib/haptics';

export function DesktopSidebar() {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();
    const segments = useSegments();

    // We can infer the active route from the segments
    // e.g., ['(tabs)', 'index'] or ['(tabs)', 'recipes']
    const activeRoute = segments[segments.length - 1] || 'index';

    const bg = isDark ? '#18181B' : '#FFFFFF';
    const border = isDark ? '#27272A' : '#E5E7EB';
    const textPrimary = isDark ? '#FAFAFA' : '#09090B';
    const textSecondary = isDark ? '#A1A1AA' : '#71717A';

    const navItems = [
        { name: 'index', label: 'Übersicht', icon: Home },
        { name: 'recipes', label: 'Rezepte', icon: BookOpen },
        { name: 'profile', label: 'Profil', icon: User },
    ];

    return (
        <View style={{
            width: 280,
            height: '100%',
            backgroundColor: bg,
            borderRightWidth: 1,
            borderRightColor: border,
            paddingTop: 60,
            paddingHorizontal: 24,
            paddingBottom: 40,
        }}
            className="hidden md:flex flex-col shadow-xl shadow-black/5"
        >
            <View className="mb-14">
                <Text style={{
                    fontFamily: 'PlusJakartaSans_800ExtraBold',
                    fontSize: 26,
                    color: textPrimary,
                    letterSpacing: -0.5
                }}>
                    NutriTrack<Text style={{ color: '#2563EB' }}>.</Text>
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: textSecondary, marginTop: 4, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    Dashboard
                </Text>
            </View>

            <View className="flex-1 space-y-3">
                {navItems.map((item) => {
                    const isActive = activeRoute === item.name;
                    const Icon = item.icon;
                    return (
                        <TouchableOpacity
                            key={item.name}
                            activeOpacity={0.7}
                            onPress={() => {
                                haptics.selection();
                                router.push(`/(tabs)/${item.name === 'index' ? '' : item.name}`);
                            }}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 14,
                                paddingHorizontal: 16,
                                borderRadius: 12,
                                backgroundColor: isActive ? (isDark ? '#27272A' : '#F3F4F6') : 'transparent',
                            }}
                        >
                            <Icon size={22} color={isActive ? textPrimary : textSecondary} strokeWidth={isActive ? 2.5 : 2} />
                            <Text style={{
                                marginLeft: 14,
                                fontSize: 16,
                                fontWeight: isActive ? '700' : '600',
                                color: isActive ? textPrimary : textSecondary,
                            }}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <View>
                {/* Minimal Footer */}
                <Text style={{ fontSize: 12, color: textSecondary, opacity: 0.6, fontWeight: '500' }}>
                    © 2026 NutriTrack
                </Text>
            </View>
        </View>
    );
}
