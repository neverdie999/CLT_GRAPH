const path = require('path');

const DIR_NAME = __dirname;
const isDebug = !process.env.PRO ? true : false;

const entry = [
  'babel-polyfill',
  DIR_NAME + '/client/src/index.js',
];



module.exports = {
  entry: entry,
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
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
