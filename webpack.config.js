const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const { VueLoaderPlugin } = require('vue-loader')

module.exports = {
    mode: 'development',
    entry: path.resolve(__dirname, "src/main.js"),
    output: {
        filename: '[name].[hash:8].js',
        path: path.resolve(__dirname, './dist')
    },
    plugins: [new VueLoaderPlugin(), new CleanWebpackPlugin(), new HtmlWebpackPlugin({ template: path.resolve(__dirname, './public/index.html'), favicon: path.resolve(__dirname, './public/favicon.ico') })],
    module: {
        rules: [
            { test: /\.vue$/, loader: 'vue-loader' },
            {
                test: /\.(jpe?g|png|gif|ico)$/i, use: [{
                    loader: 'url-loader', options: {
                        limit: 10240, esModule: false, fallback: {
                            loader: 'file-loader', options: { name: 'img/[name].[hash:8].[ext]' }
                        }
                    }
                }]
            },
            {
                test: /\.css$/, use: ['style-loader', 'css-loader']
            },
            // {
            //     test: /\.js$/,
            //     exclude: /node_modules/,
            //     use: [{
            //         loader: 'babel-loader',
            //         options: {
            //             presets: [['@babel/env',
            //                 { 'useBuiltIns': 'usage', 'corejs': 3 }]]
            //         }
            //     }]
            // },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: { presets: [['@babel/env', { 'useBuiltIns': 'usage', 'corejs': 3 }]] }
                    },
                    // 'eslint-loader'
                ]
            },
        ]
    },
    devtool: 'inline-source-map',
    devServer: {
        static: './dist'
    },

}