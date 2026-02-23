

import { Stack } from "expo-router";
export { ErrorBoundary } from "expo-router";
import "../global.css";
import { View, Platform } from "react-native";
import { useColorScheme, vars } from "nativewind";
import { StatusBar } from "expo-status-bar";
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold } from "@expo-google-fonts/plus-jakarta-sans";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from "react";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";
import { useAuthStore } from "../store/useAuthStore";
import { syncService } from "../lib/syncService";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const themeVars = {
    light: vars({
        "--background": "#F8FAFC",
        "--card": "#FFFFFF",
        "--primary": "#2563EB",
        "--text": "#0F172A",
        "--textLight": "#64748B",
        "--border": "#E2E8F0",
    }),
    dark: vars({
        "--background": "#020617",
        "--card": "#0F172A",
        "--primary": "#3B82F6",
        "--text": "#F8FAFC",
        "--textLight": "#94A3B8",
        "--border": "#1E293B",
    })
};

export default function RootLayout() {
    const { colorScheme } = useColorScheme();
    const activeTheme = colorScheme === 'dark' ? themeVars.dark : themeVars.light;

    const [fontsLoaded, fontError] = useFonts({
        'Plus Jakarta Sans': PlusJakartaSans_400Regular,
        PlusJakartaSans_400Regular,
        PlusJakartaSans_500Medium,
        PlusJakartaSans_600SemiBold,
        PlusJakartaSans_700Bold,
        PlusJakartaSans_800ExtraBold,
    });

    const { initialize: initializeAuth, user, initialized: authInitialized } = useAuthStore();

    useEffect(() => {
        initializeAuth();
    }, []);

    // Pull cloud data once auth is ready and user exists
    useEffect(() => {
        if (authInitialized && user) {
            syncService.pullAll();
        }
    }, [authInitialized, user]);

    // Hide splash screen when fonts are loaded
    useEffect(() => {
        if (fontsLoaded || fontError) {
            SplashScreen.hideAsync().catch(() => { });
        }
    }, [fontsLoaded, fontError]);

    // Hide splash screen when fonts are loaded
    useEffect(() => {
        if (fontsLoaded || fontError) {
            SplashScreen.hideAsync().catch(() => { });
        }
    }, [fontsLoaded, fontError]);

    // Wrap Stack in a View with the theme vars
    // We use style to pass the CSS variables stably and background colors directly
    return (
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
            <View
                style={[{ flex: 1 }, activeTheme as any]}
                className="bg-background"
            >
                <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen
                        name="recipes/create"
                        options={{
                            presentation: 'transparentModal',
                            animation: 'slide_from_right',
                            headerShown: false
                        }}
                    />
                    <Stack.Screen
                        name="recipes/[id]"
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="scanner"
                        options={{
                            presentation: 'fullScreenModal',
                            headerShown: false,
                            animation: 'slide_from_bottom',
                        }}
                    />
                    <Stack.Screen
                        name="auth/login"
                        options={{
                            presentation: 'modal',
                            headerShown: false,
                        }}
                    />
                    <Stack.Screen name="+not-found" />
                </Stack>
            </View>
        </SafeAreaProvider>
    );
}
