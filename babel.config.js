module.exports = function (api) {
    api.cache(true);
    return {
        presets: [
            ["babel-preset-expo", { jsxImportSource: "nativewind" }],
            "nativewind/babel",
        ],
        plugins: [
            "react-native-reanimated/plugin",
            function () {
                return {
                    name: "transform-import-meta",
                    visitor: {
                        MetaProperty(path) {
                            if (path.node.meta.name === 'import' && path.node.property.name === 'meta') {
                                path.replaceWithSourceString("({ env: { MODE: (typeof process !== 'undefined' && process.env && process.env.NODE_ENV) ? process.env.NODE_ENV : 'production' } })");
                            }
                        }
                    }
                };
            }
        ],
    };
};
