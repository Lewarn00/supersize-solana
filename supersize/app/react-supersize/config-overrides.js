const {alias, configPaths} = require('react-app-rewire-alias')
const webpack = require("webpack");

module.exports = function override(config) {
    alias(configPaths())(config)
    // Add fallbacks for Node.js modules
    config.resolve.fallback = {
        fs: false,
        http: require.resolve("stream-http"),
        https: require.resolve("https-browserify"),
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        buffer: require.resolve("buffer-browserify"),
        zlib: false,
        url: false,
        vm: false,
    };

    // Modify output configuration
    config.output = {
        ...config.output,
        publicPath: "/",
    };

    // Add Buffer global if it's missing
    config.plugins = (config.plugins || []).concat(
        new webpack.ProvidePlugin({
            Buffer: ["buffer", "Buffer"],
        })
    );

    // Ignore specific warnings
    const ignoredWarnings = [/Failed to parse source map/];
    config.ignoreWarnings = (config.ignoreWarnings || []).concat(
        ignoredWarnings.map((pattern) => ({ message: pattern }))
    );

    return config;
}