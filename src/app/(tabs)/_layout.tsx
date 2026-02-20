import { Tabs } from 'expo-router';
import { Home, BookOpen, User } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { Platform } from 'react-native';

export default function TabLayout() {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <Tabs screenOptions={{
            tabBarActiveTintColor: '#2563EB',
            tabBarInactiveTintColor: isDark ? '#A1A1AA' : '#8E8E93',
            tabBarStyle: {
                backgroundColor: isDark ? '#09090B' : '#FFFFFF', // zinc-950 for deep blend
                borderTopColor: isDark ? '#27272A' : '#E5E7EB', // zinc-800
            },
            headerShown: false
        }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color }) => <Home size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="recipes"
                options={{
                    title: 'Recipes',
                    tabBarIcon: ({ color }) => <BookOpen size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color }) => <User size={24} color={color} />,
                }}
            />
        </Tabs>
    );
}
