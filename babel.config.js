const envVarTransformer = function (api) {
    const { types: t } = api;
    const allowlist = [
        'NODE_ENV',
        'EXPO_PUBLIC_SUPABASE_URL',
        'EXPO_PUBLIC_SUPABASE_ANON_KEY',
        'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID'
    ];
    return {
        name: "transform-env-vars-v3",
        visitor: {
            MemberExpression(path) {
                // Handle process.env.XYZ
                if (path.get("object").matchesPattern("process.env")) {
                    const key = path.toComputedKey();
                    if (t.isStringLiteral(key)) {
                        const name = key.value;
                        if (allowlist.includes(name)) {
                            const val = process.env[name] || (name === 'NODE_ENV' ? 'development' : '');
                            path.replaceWith(t.stringLiteral(val));
                        }
                        // If not in allowlist, do NOTHING. Let Metro/Webpack handle it.
                    }
                }
                // Handle import.meta.env
                if (path.get("object").matchesPattern("import.meta.env")) {
                    const key = path.toComputedKey();
                    if (t.isStringLiteral(key)) {
                        const name = key.value;
                        // Always replace import.meta.env properties as they cause SyntaxErrors in non-ESM
                        const val = process.env[name] || (name === 'MODE' ? (process.env.NODE_ENV || 'development') : '');
                        path.replaceWith(t.stringLiteral(val));
                    } else {
                        // Replace naked import.meta.env with a safe object
                        path.replaceWith(t.objectExpression([
                            t.objectProperty(t.identifier("MODE"), t.stringLiteral(process.env.NODE_ENV || "development")),
                            t.objectProperty(t.identifier("PROD"), t.booleanLiteral(process.env.NODE_ENV === 'production')),
                            t.objectProperty(t.identifier("DEV"), t.booleanLiteral(process.env.NODE_ENV !== 'production')),
                        ]));
                    }
                }
            },
            MetaProperty(path) {
                if (path.get("meta").isIdentifier({ name: "import" }) &&
                    path.get("property").isIdentifier({ name: "meta" })) {
                    path.replaceWith(t.objectExpression([
                        t.objectProperty(t.identifier("env"), t.objectExpression([
                            t.objectProperty(t.identifier("MODE"), t.stringLiteral(process.env.NODE_ENV || "development")),
                            t.objectProperty(t.identifier("PROD"), t.booleanLiteral(process.env.NODE_ENV === 'production')),
                            t.objectProperty(t.identifier("DEV"), t.booleanLiteral(process.env.NODE_ENV !== 'production')),
                        ]))
                    ]));
                }
            }
        }
    };
};

module.exports = function (api) {
    api.cache(true);
    return {
        presets: [
            ["babel-preset-expo", { jsxImportSource: "nativewind" }],
            "nativewind/babel",
        ],
        plugins: [
            envVarTransformer,
            "react-native-reanimated/plugin"
        ],
        overrides: [
            {
                test: /[/\\]node_modules[/\\]/,
                plugins: [envVarTransformer]
            }
        ]
    };
};
