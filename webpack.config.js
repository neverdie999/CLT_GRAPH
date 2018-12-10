const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const DIR_NAME = __dirname;
const isDebug = !process.env.PRO ? true : false;

const library = [
  'babel-polyfill',
  DIR_NAME + '/client/src/modules/graph-library/index.js',
];

const messageMapping = [
  'babel-polyfill',
  DIR_NAME + '/client/src/modules/message-mapping-gui/index.js',
];

const segmentSetEditor = [
  'babel-polyfill',
  DIR_NAME + '/client/src/modules/segment-set-editor/index.js',
];

const sampleMessageViewer = [
  'babel-polyfill',
  DIR_NAME + '/client/src/modules/sample-message-viewer/index.js',
];

module.exports = {
  entry: {
    library: library,
    messageMapping: messageMapping,
    segmentSetEditor: segmentSetEditor,
		sampleMessageViewer: sampleMessageViewer
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
	},
	plugins: [
      new UglifyJsPlugin({
        uglifyOptions: {
					warnings: false,
					parse: {},
					compress: {},
					mangle: true, // Note `mangle.properties` is `false` by default.
					output: null,
					toplevel: false,
					nameCache: null,
					ie8: false,
					keep_fnames: false,
				},
        extractComments: true
      })
    ],
	mode: 'development'
};
