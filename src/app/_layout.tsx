console.log("HELLO FROM APP ENTRY POINT - EVALUATION STARTED");

import { Stack } from "expo-router";
import "../global.css";
import { View, Platform } from "react-native";
import { useColorScheme, vars } from "nativewind";
import { StatusBar } from "expo-status-bar";
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold } from "@expo-google-fonts/plus-jakarta-sans";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuthStore } from "../store/useAuthStore";
import { syncService } from "../lib/syncService";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

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

    // Pull cloud data once auth is ready and user exists
    useEffect(() => {
        if (authInitialized && user) {
            syncService.pullAll();
        }
    }, [authInitialized, user]);

    // Wrap Stack in a View with the theme vars
    // We use style to pass the CSS variables stably and background colors directly
    return (
        <SafeAreaProvider>
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
                            presentation: 'modal',
                            title: 'Create Recipe',
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
