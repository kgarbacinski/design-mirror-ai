const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  devtool: 'cheap-module-source-map',

  entry: {
    'background/service-worker': './background/service-worker.ts',
    'content/content-script': './content/content-script.ts',
    'popup/popup': './popup/popup.tsx'
  },

  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].js',
    clean: true
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@shared': path.resolve(__dirname, './shared'),
      '@content': path.resolve(__dirname, './content'),
      '@popup': path.resolve(__dirname, './popup')
    }
  },

  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'popup/popup.html', to: 'popup/popup.html' },
        { from: 'icons', to: 'icons', noErrorOnMissing: true }
      ]
    })
  ]
};
