const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const jsFilename = isProduction ? 'bundle.[contenthash].js' : 'bundle.js';
  const cssFilename = isProduction ? 'style.[contenthash].css' : 'style.css';

  const publicPath =
    (env && env.GITHUB_PAGES === 'true') || process.env.GITHUB_PAGES === 'true'
      ? '/HomeWork-WeatherApp-hw07/'
      : './';

  return {
    entry: './src/index.ts',

    mode: argv.mode || 'production',

    output: {
      filename: jsFilename,
      path: path.resolve(__dirname, 'dist'),
      clean: true,
      publicPath: publicPath,
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: './src/index.html',
        minify: isProduction,
        inject: true,
      }),
      ...(isProduction
        ? [
            new MiniCssExtractPlugin({
              filename: cssFilename,
            }),
          ]
        : []),
    ],
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      extensionAlias: {
        '.js': ['.ts', '.js'],
        '.jsx': ['.tsx', '.jsx'],
      },
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'ts-loader',
            options: {
              transpileOnly: false,
            },
          },
        },
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
          use: isProduction
            ? [MiniCssExtractPlugin.loader, 'css-loader']
            : ['style-loader', 'css-loader'],
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
      historyApiFallback: true,
    },
  };
};
