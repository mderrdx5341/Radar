const MiniCssExtractPlugin = require("mini-css-extract-plugin");
//const { ProvidePlugin } = require("webpack");
const path = require('path');

module.exports = {
    externals: {
        jquery : 'jQuery',
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: '[name].css',
		}),
        /*new ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",

        })*/
	],
	entry: {
		app: path.resolve(__dirname, './frontend/main.ts'),
	},
    devtool: 'source-map',
    mode: process.env.NODE_ENV === 'development' ? 'development' : 'production', //production, development
    stats: {
        errorDetails: true
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        alias: {
            '@': path.resolve(__dirname, './frontend/src')
        }
    },
    devServer: {
        static: {
            directory: path.resolve(__dirname, './www/'), // Откуда раздавать index.html
        },
        compress: true, // Включает сжатие gzip для ускорения загрузки
        port: 8080,     // Красивый порт http://localhost:8080
        hot: true,      // Включает Hot Module Replacement (живая перезагрузка)
        open: true,     // Автоматически открывает вкладку в браузере при старте
        watchFiles: ['./frontend/**/*', './www/**/*.html'], // За какими файлами следить
    },
    module: {
        rules: [
            {
                test: /\.(png|jpg|jpeg|svg|gif)$/,
                type: 'asset/resource',
                generator: {
                    filename: 'images/[name][ext][query]',
                },
            },
            {
                test: /\.(eot|ttf|woff|woff2)$/,
                type: 'asset/resource',
                generator: {
                    filename: 'fonts/[name][ext][query]',
                },
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: ['babel-loader'],
            },
			{
				test: /\.(scss|css)$/,
				use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader', 'sass-loader'],
			},
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                exclude: /node_modules/,
            },

        ],
	},
	output: {
		path: path.resolve(__dirname, './www/'),
		filename: '[name].js',
	}
}