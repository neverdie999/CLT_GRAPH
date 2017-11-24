const ExtractTextPlugin = require('extract-text-webpack-plugin');
const reScript = /\.(js|jsx)?$/;
const reStyle = /\.(css|less|scss|sss)$/;
const reImage = /\.(bmp|gif|jpe?g|png|svg)$/;

const rulesConfig = (isDebug) => {
  const staticAssetName = isDebug
    ? '[path][name].[ext]?[hash:8]'
    : '[hash:8].[ext]';

  return [
    {
      test: reScript,
      loader: "babel-loader",
      exclude: [/node_modules/, /inspinia/],
      options: {
        // https://github.com/babel/babel-loader#options
        cacheDirectory: isDebug,

        // https://babeljs.io/docs/usage/options/
        babelrc: false,
        presets: [
          'es2015',
          'stage-0',
          'react',
          ...(isDebug ? [] : ['react-optimize']),
        ],
        plugins: [
          ["transform-object-rest-spread", { "useBuiltIns": true }],
          // Adds component stack to warning messages
          // https://github.com/babel/babel/tree/master/packages/babel-plugin-transform-react-jsx-source
          ...(isDebug ? ['transform-react-jsx-source'] : []),
          // Adds __self attribute to JSX which React will use for some warnings
          // https://github.com/babel/babel/tree/master/packages/babel-plugin-transform-react-jsx-self
          ...(isDebug ? ['transform-react-jsx-self'] : []),
          'transform-decorators-legacy',
        ],
      },
    },
    {
      test: /\.css$/,
      use: ExtractTextPlugin.extract({
        fallback: "style-loader",
        use: "css-loader"
      })
    },
    {
      test: /\.scss/,
      use: ExtractTextPlugin.extract({
        fallback: "style-loader",
        use: ['css-loader', 'sass-loader']
      })
    },
    {
      test: /\.less/,
      use: ExtractTextPlugin.extract({
        fallback: "style-loader",
        use: ['css-loader', 'less-loader']
      })
    },
    {
      exclude: [reScript, reStyle, reImage, /\.json$/, /\.txt$/, /\.md$/],
      test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,
      loader: 'url-loader?limit=100000&mimetype=application/font-woff',
    },
    {
      exclude: [reScript, reStyle, reImage, /\.json$/, /\.txt$/, /\.md$/],
      test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
      loader: 'url-loader?limit=100000&mimetype=application/octet-stream',
    },
    {
      exclude: [reScript, reStyle, reImage, /\.json$/, /\.txt$/, /\.md$/],
      test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
      loader: 'url-loader',
    },
    {
      exclude: [reScript, reStyle, reImage, /\.json$/, /\.txt$/, /\.md$/],
      test: /\.html$/,
      loader: 'html-loader',
    },
    {
      test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
      loader: 'url-loader?limit=100000&mimetype=image/svg+xml'
    },
    {
      test: /\.(png|jpg|gif)(\?v=\d+\.\d+\.\d+)?$/,
      loader: 'file-loader?limit=100000'
    },
  ];
};

module.exports = rulesConfig;
