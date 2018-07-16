const path = require('path');

const DIR_NAME = __dirname;
const isDebug = !process.env.PRO ? true : false;

const library = [
  'babel-polyfill',
  DIR_NAME + '/client/src/index.js',
];

const messageMapping = [
  'babel-polyfill',
  DIR_NAME + '/client/src/message-mapping/index.js',
];

module.exports = {
  entry: {
    library: library,
    messageMapping: messageMapping,
  },
  output: {
    path: path.resolve(DIR_NAME, 'dist'),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [ 'style-loader', 'css-loader' ]
      },
      {
        test: /\.scss$/,
        use: [ 'style-loader', 'css-loader', 'sass-loader' ]
      }
    ]
  }
};
