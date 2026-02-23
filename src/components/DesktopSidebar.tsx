import { View, Text, Pressable } from 'react-native';
import { Home, BookOpen, User } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useRouter, useSegments } from 'expo-router';
import { haptics } from '../lib/haptics';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring
} from 'react-native-reanimated';

export function DesktopSidebar() {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();
    const segments = useSegments();

    const activeRoute = segments[segments.length - 1] || 'index';

    const bg = isDark ? '#0F172A' : '#FFFFFF';
    const border = isDark ? '#1E293B' : '#E2E8F0';
    const textPrimary = isDark ? '#F8FAFC' : '#0F172A';
    const textSecondary = isDark ? '#94A3B8' : '#64748B';

    const NavItem = ({ item }: { item: any }) => {
        const isActive = activeRoute === item.name;
        const Icon = item.icon;
        const hoverScale = useSharedValue(1);
        const bgOpacity = useSharedValue(isActive ? 1 : 0);

        const animatedStyle = useAnimatedStyle(() => ({
            transform: [{ scale: withSpring(hoverScale.value) }],
            backgroundColor: isActive
                ? (isDark ? '#1E293B' : '#F1F5F9')
                : (isDark ? `rgba(30, 41, 59, ${bgOpacity.value})` : `rgba(241, 245, 249, ${bgOpacity.value})`),
        }));

        const textStyle = useAnimatedStyle(() => ({
            color: isActive ? textPrimary : textSecondary,
            fontWeight: isActive ? '700' : '500',
        }));

        return (
            <Pressable
                onPress={() => {
                    haptics.selection();
                    router.push(`/(tabs)/${item.name === 'index' ? '' : item.name}`);
                }}
                onHoverIn={() => {
                    hoverScale.value = 1.02;
                    bgOpacity.value = withTiming(0.5);
                }}
                onHoverOut={() => {
                    hoverScale.value = 1;
                    bgOpacity.value = withTiming(0);
                }}
            >
                <Animated.View
                    style={[
                        {
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 14,
                            paddingHorizontal: 16,
                            borderRadius: 16,
                        },
                        animatedStyle
                    ]}
                >
                    <Icon size={20} color={isActive ? '#2563EB' : textSecondary} strokeWidth={isActive ? 2.5 : 2} />
                    <Animated.Text
                        style={[
                            { marginLeft: 16, fontSize: 15 },
                            textStyle
                        ]}
                    >
                        {item.label}
                    </Animated.Text>
                </Animated.View>
            </Pressable>
        );
    };

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
            paddingTop: 64,
            paddingHorizontal: 32,
            paddingBottom: 48,
        }}
            className="hidden md:flex flex-col glass"
        >
            <View className="mb-20">
                <Text style={{
                    fontFamily: 'PlusJakartaSans_800ExtraBold',
                    fontSize: 28,
                    color: textPrimary,
                    letterSpacing: -1
                }}>
                    NutriTrack<Text style={{ color: '#2563EB' }}>.</Text>
                </Text>
                <Text style={{ fontSize: 11, fontWeight: '800', color: textSecondary, marginTop: 4, letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.8 }}>
                    Editorial Companion
                </Text>
            </View>

            <View className="flex-1 space-y-2">
                {navItems.map((item) => (
                    <NavItem key={item.name} item={item} />
                ))}
            </View>

            <View style={{ paddingTop: 20, borderTopWidth: 1, borderTopColor: border, opacity: 0.5 }}>
                <Text style={{ fontSize: 11, color: textSecondary, fontWeight: '600', letterSpacing: 0.5 }}>
                    © 2026 NUTRITRACK
                </Text>
            </View>
        </View>
    );
}
