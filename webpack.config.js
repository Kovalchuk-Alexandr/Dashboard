const config = {
    // mode: "production",
    mode: "development",
    entry: {
        index: "./src/js/index.js",
        // contacts: './src/js/contacts.js',
        // about: './src/js/about.js',
    },
    output: {
        filename: "[name].bundle.js",
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"],
            },
        ],
    },
    devtool: "inline-source-map",
};

module.exports = config;
