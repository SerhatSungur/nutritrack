module.exports = function (api) {
    api.cache(true);
    return {
        presets: [
            ["babel-preset-expo", { jsxImportSource: "nativewind" }],
            "nativewind/babel",
        ],
        plugins: [
            // Next.js/Vercel often ships without a process.env polyfill on the client in strict edge environments.
            // React Native libraries (and Reanimated) expect process.env.NODE_ENV to exist.
            // This custom AST plugin statically string-replaces process.env variables to prevent fatal ReferenceErrors during Vercel builds.
            function (api) {
                const { types: t } = api;
                return {
                    name: "inline-env-vars",
                    visitor: {
                        MemberExpression(path) {
                            if (path.get("object").matchesPattern("process.env")) {
                                const key = path.toComputedKey();
                                if (t.isStringLiteral(key)) {
                                    const name = key.value;
                                    if (name === "NODE_ENV") {
                                        path.replaceWith(t.stringLiteral(process.env.NODE_ENV || "production"));
                                    } else if (name === "EXPO_PUBLIC_SUPABASE_URL") {
                                        path.replaceWith(t.stringLiteral(process.env.EXPO_PUBLIC_SUPABASE_URL || ""));
                                    } else if (name === "EXPO_PUBLIC_SUPABASE_ANON_KEY") {
                                        path.replaceWith(t.stringLiteral(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ""));
                                    } else if (name === "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID") {
                                        path.replaceWith(t.stringLiteral(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || ""));
                                    }
                                }
                            }
                        }
                    }
                };
            },
            "react-native-reanimated/plugin"
        ],
    };
};
