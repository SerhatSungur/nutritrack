import { Tabs } from 'expo-router';
import { Home, BookOpen, User } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { Platform, useWindowDimensions, View } from 'react-native';
import { DesktopSidebar } from '../../components/DesktopSidebar';

export default function TabLayout() {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { width } = useWindowDimensions();

    // Tailwind's 'md' breakpoint is usually 768px.
    const isDesktop = width >= 768;

    return (
        <View style={{ flex: 1, flexDirection: isDesktop ? 'row' : 'column', backgroundColor: 'var(--background)' }}>
            {/* Inject our sleek Desktop Sidebar on wide screens */}
            {isDesktop && <DesktopSidebar />}

            <View style={{ flex: 1 }}>
                <Tabs screenOptions={{
                    tabBarActiveTintColor: '#2563EB',
                    tabBarInactiveTintColor: isDark ? '#A1A1AA' : '#8E8E93',
                    // Hide the standard mobile bottom bar when on desktop
                    tabBarStyle: isDesktop ? { display: 'none' } : {
                        backgroundColor: isDark ? '#18181B' : '#FFFFFF',
                        borderTopColor: isDark ? '#27272A' : '#E5E7EB',
                        elevation: 0,
                        shadowOpacity: 0,
                    },
                    headerShown: false,
                }}>
                    <Tabs.Screen
                        name="index"
                        options={{
                            title: 'Übersicht',
                            tabBarIcon: ({ color }) => <Home size={24} color={color} />,
                        }}
                    />
                    <Tabs.Screen
                        name="recipes"
                        options={{
                            title: 'Rezepte',
                            tabBarIcon: ({ color }) => <BookOpen size={24} color={color} />,
                        }}
                    />
                    <Tabs.Screen
                        name="profile"
                        options={{
                            title: 'Profil',
                            tabBarIcon: ({ color }) => <User size={24} color={color} />,
                        }}
                    />
                </Tabs>
            </View>
        </View>
    );
}
