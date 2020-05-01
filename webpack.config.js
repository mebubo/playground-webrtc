var path = require('path');

module.exports = {
    mode: "development",

    devtool: "source-map",

    resolve: {
        extensions: [".ts", ".tsx", ".js"]
    },

    entry: {
        bundle: './src/index.ts'
    },

    output: {
        filename: '[name].js',
        path: path.join(__dirname, '/deploy')
    },

    module: {
        rules: [
            {
                test: /\.ts(x?)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "ts-loader"
                    }
                ]
            },
            {
                enforce: "pre",
                test: /\.js$/,
                loader: "source-map-loader"
            }
        ]
    },

    devServer: {
        contentBase: path.join(__dirname, 'static'),
        compress: true,
        port: 1235
    }

};
