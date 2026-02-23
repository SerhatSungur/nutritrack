const envVarTransformer = function (api) {
    const { types: t } = api;
    return {
        name: "transform-env-vars-v2",
        visitor: {
            MemberExpression(path) {
                // Handle process.env.XYZ
                if (path.get("object").matchesPattern("process.env")) {
                    const key = path.toComputedKey();
                    if (t.isStringLiteral(key)) {
                        const name = key.value;
                        const val = process.env[name] || (name === 'NODE_ENV' ? 'development' : '');
                        path.replaceWith(t.stringLiteral(val));
                    }
                }
                // Handle import.meta.env
                if (path.get("object").matchesPattern("import.meta.env")) {
                    const key = path.toComputedKey();
                    if (t.isStringLiteral(key)) {
                        const name = key.value;
                        const val = process.env[name] || (name === 'MODE' ? 'development' : '');
                        path.replaceWith(t.stringLiteral(val));
                    } else {
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
