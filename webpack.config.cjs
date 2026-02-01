const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const jsFilename = isProduction
    ? 'bundle.[contenthash].js'
    : 'bundle.js';
  const cssFilename = isProduction
    ? 'style.[contenthash].css'
    : 'style.css';

  return {
    entry: './src/index.js',

    mode: argv.mode || 'production',

    output: {
      filename: jsFilename,
      path: path.resolve(__dirname, 'dist'),
      clean: true,
      publicPath: './',
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: './src/index.html',
        minify: isProduction,
        inject: true, 
        mode: argv.mode || 'production', 
      }),
      new MiniCssExtractPlugin({
        filename: cssFilename,
      }),
    ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
    ],
  },

    devServer: {
      static: './dist',
      port: 3000,
      open: true,
    },
  };
};