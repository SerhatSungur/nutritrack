module.exports = function (api) {
    api.cache(true);
    return {
        presets: [
            ["babel-preset-expo", { jsxImportSource: "nativewind" }],
            "nativewind/babel",
        ],
        plugins: [
            // Next.js/Vercel often ships without a process.env polyfill on the client in strict edge environments.
            // React Native libraries (and Reanimated) expect process.env.NODE_ENV to exist synchronously.
            // This plugin statically strings-replaces process.env.NODE_ENV to prevent "process is not defined" fatal ReferenceErrors.
            ["transform-inline-environment-variables", {
                "include": ["NODE_ENV", "EXPO_PUBLIC_SUPABASE_URL", "EXPO_PUBLIC_SUPABASE_ANON_KEY", "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID"]
            }],
            "react-native-reanimated/plugin"
        ],
    };
};
