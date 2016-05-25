// Common Webpack configuration for the frontend and the backend
// Webpack documentation can be found at https://webpack.github.io/docs/

var path = require('path');
var webpack = require('webpack');

var appConfig = require('./config');

var webpackPlugins = [
  // define a global __PROD__ variable indicating if the application is
  // executed in production mode or not
  new webpack.DefinePlugin({
    __PROD__: appConfig.production
  }),
  // When there are errors while compiling this plugin skips the emitting phase (and recording phase),
  // so there are no assets emitted that include errors.
  new webpack.NoErrorsPlugin()
];

// Recommended webpack plugins when building the application for production  :
if (appConfig.production) {
  webpackPlugins = webpackPlugins.concat([
    // Assign the module and chunk ids by occurrence count. Ids that are used often get lower (shorter) ids.
    // This make ids predictable, reduces to total file size and is recommended.
    new webpack.optimize.OccurenceOrderPlugin(true),
    // Search for equal or similar files and deduplicate them in the output.
    // This comes with some overhead for the entry chunk, but can reduce file size effectively.
    new webpack.optimize.DedupePlugin(),
    // Minimize all JavaScript output of chunks. Loaders are switched into minimizing mode.
    // You can pass an object containing UglifyJs options.
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
      },
      comments: false
    })
  ]);
}

if (appConfig.test) {
  webpackPlugins = webpackPlugins.concat([
    // Ensure that only a single chunk is generated for the unit tests bundle
    // that will be executed trough Karma.
    new webpack.optimize.LimitChunkCountPlugin({maxChunks: 1}),
    // Ignore the fsevents module when bundling the unit tests to avoid a webpack warning about it
    new webpack.IgnorePlugin(/fsevents/)
  ]);
}

module.exports = {
  // set debug to true only in development mode
  debug: !appConfig.production,
  // Developer tool to enhance debugging.
  // In production, a SourceMap is emitted.
  // In development, each module is executed with eval and //@ sourceURL
  devtool: appConfig.production ? '#source-map' : 'eval',

  resolve: {
    // Replace modules by other modules or paths.
    alias: {
      // alias the config file
      'config': path.resolve(__dirname, 'config.js')
    }
  },

  // common module loaders
  module: {
    preLoaders: [
      // apply jshint on all javascript files : perform static code analysis
      // to avoid common errors and embrace best development practices
      {
        test: /\.js$/,
        exclude: /(node_modules|__tests__)/,
        loader: 'jshint'
      }
    ],

    loaders: [
      // use babel loader in order to use es6 syntax in js files,
      // use ng-annotate loader to automatically inject angular modules dependencies
      // (explicit annotations are needed though with es6 syntax)
      {
        test: /\.js$/,
        exclude: /(node_modules|__tests__)/,
        loaders: ['ng-annotate?es6=true', 'babel']
      },
      // use json loader to automatically parse JSON files content when importing them
      {
        test: /\.json$/,
        loader: 'json'
      }
    ]
  },
  // any jshint option http://www.jshint.com/docs/options/
  // default configuration is stored in the .jshintrc file
  jshint: {

    // we use es6 syntax
    esnext: true,

    // jshint errors are displayed by default as warnings
    // set emitErrors to true to display them as errors
    emitErrors: true,

    // jshint to not interrupt the compilation
    // if you want any file with jshint errors to fail
    // set failOnHint to true
    failOnHint: true,
    // do not warn about __PROD__ being undefined as it is a global
    // variable added by webpack through the DefinePlugin
    globals: {
      __PROD__: false,
      expect: false
    }
  },
  plugins: webpackPlugins
};
