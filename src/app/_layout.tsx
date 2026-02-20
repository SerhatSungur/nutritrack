import { Stack } from "expo-router";
import "../global.css";
import { View, Platform } from "react-native";
import { useColorScheme, vars } from "nativewind";
import { StatusBar } from "expo-status-bar";

const themeVars = {
    light: vars({
        "--background": "#F4F4F5",
        "--card": "#FFFFFF",
        "--primary": "#2563EB",
        "--text": "#09090B",
        "--textLight": "#71717A",
    }),
    dark: vars({
        "--background": "#09090B",
        "--card": "#18181B",
        "--primary": "#3B82F6",
        "--text": "#FAFAFA",
        "--textLight": "#A1A1AA",
    })
};

export default function RootLayout() {
    const { colorScheme } = useColorScheme();
    const activeTheme = colorScheme === 'dark' ? themeVars.dark : themeVars.light;

    return (
        <View
            style={activeTheme}
            className={`flex-1 ${colorScheme === 'dark' ? 'bg-black' : 'bg-background'} justify-center`}
        >
            <View
                className={`flex-1 w-full bg-background dark:bg-zinc-950 ${colorScheme === 'dark' ? 'dark' : ''}`}
            >
                <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                <Stack>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen
                        name="recipes/create"
                        options={{
                            presentation: 'modal',
                            title: 'Create Recipe',
                            headerShown: false
                        }}
                    />
                    <Stack.Screen
                        name="recipes/[id]"
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen name="+not-found" />
                </Stack>
            </View>
        </View>
    );
}
