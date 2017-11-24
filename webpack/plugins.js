const webpack = require("webpack");
const path = require('path');
const AssetsPlugin = require('assets-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const pluginsConfig = (isDebug) => {
  return [
    new CleanWebpackPlugin(['public'], {
      root: path.resolve(__dirname, '../'),
      verbose: true,
      dry: false,
      exclude: ['.keep']
    }),
    new webpack.HotModuleReplacementPlugin(),
    new ExtractTextPlugin({
      filename: isDebug ? '[name].bundle.css' : '[name].[hash].min.css',
      allChunks: true
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': isDebug ? '"development"' : '"production"',
      'process.env.BROWSER': true,
      __DEV__: isDebug,
    }),
    new webpack.ProvidePlugin({
      '$': "jquery",
      'jQuery': "jquery",
      'window.jQuery': "jquery",
      'window.$': 'jquery'
    }),
    // Emit a file with assets paths
    // https://github.com/sporto/assets-webpack-plugin#options
    new AssetsPlugin({
      path: path.resolve(__dirname, '../public'),
      filename: 'assets.json',
      prettyPrint: true,
    }),
    // Move modules that occur in multiple entry chunks to a new entry chunk (the commons chunk).
    // https://webpack.js.org/plugins/commons-chunk-plugin/
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks: module => /node_modules|inspinia/.test(module.resource),
    }),
    ...(isDebug ? [] : [
      new webpack.optimize.ModuleConcatenationPlugin(),
      new webpack.optimize.UglifyJsPlugin(),
      // new webpack.optimize.UglifyJsPlugin({
      //   debug: true,
      //   minimize: true,
      //   sourceMap: true,
      //   compress: {
      //     warnings: false,
      //     screw_ie8: true, // React doesn't support IE8
      //     dead_code: true,
      //   },
      //   mangle: {
      //     screw_ie8: true,
      //   },
      //   output: {
      //     comments: false
      //   }
      // }),
    ]),
  ];
};

module.exports = pluginsConfig;
