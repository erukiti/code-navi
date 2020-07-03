import path from 'path'
import { Configuration, RuleSetRule, ProvidePlugin } from 'webpack'
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin')
const HTMLPlugin = require('html-webpack-plugin')

const createBabelLoader = (isMain: boolean): RuleSetRule => {
  return {
    test: /\.(ts|js)x?$/,
    exclude: /node_modules/,
    use: {
      loader: 'babel-loader',
      options: {
        presets: [
          '@babel/preset-react',
          '@babel/preset-typescript',
          '@babel/preset-env',
          // '@emotion/babel-preset-css-prop',
        ],
      },
    },
  }
}

const alias = {
  '~': path.resolve(__dirname, 'src'),
}

export const renderer: Configuration = {
  // mode: process.env.NODE_ENV,
  target: 'web',
  entry: [path.resolve(__dirname, 'src', 'index.tsx')],
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', 'json', '.mjs', '.wasm'],
    alias,
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
  },
  module: {
    rules: [
      createBabelLoader(false),
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.ttf$/,
        use: ['file-loader'],
      },
    ],
  },
  devtool: '#source-map',
  plugins: [
    new MonacoWebpackPlugin({
      languages: ['typescript', 'javascript', 'css'],
    }),
    new HTMLPlugin({
      template: path.join(__dirname, 'src/index.html'),
    }),
  ],
}
