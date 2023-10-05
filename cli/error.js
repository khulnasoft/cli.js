var Promise = require('es6-promise').Promise; // jshint ignore:line
var config = require('../lib/config');
var chalk = require('chalk');

var errors = {
  connect: 'Check your network connection, failed to connect to Khulnasoft API',
  endpoint: 'The Khulnasoft API is not available on ' + config.API,
  auth: 'Unauthorized: please ensure you are logged using `khulnasoft auth`',
  dotfile: 'Try running `khulnasoft protect -i` to define a Khulnasoft protect policy',
  authfail: 'Authentication failed. Please check the API key on ' + config.ROOT,
  oldkhulnasoft: 'You have an alpha format .khulnasoft file in this directory. Please ' +
    'remove it, and re-create using `khulnasoft protect -i`',
  notfound: 'The package could not be found or does not exist',
  patchfail: 'The patch against "%s" failed. We may not have a patch for ' +
    'this version yet.',
  nodeModules: 'This directory looks like a node project, but is missing the ' +
    'contents of the node_modules directory.\nPlease run `npm install` and ' +
    're-run your khulnasoft command.',
  tryDevDeps: 'Khulnasoft only tests production dependencies by default (which ' +
    'this project had none). Try re-running with the `--dev` flag.',
};

// a key/value pair of error.code (or error.message) as the key, and our nice
// strings as the value.
var codes = {
  ECONNREFUSED: errors.connect,
  404: errors.notfound,
  411: errors.endpoint, // try to post to a weird endpoint
  403: errors.endpoint,
  401: errors.auth,
  Unauthorized: errors.auth,
  MISSING_DOTFILE: errors.dotfile,
  MISSING_NODE_MODULES: errors.nodeModules,
  OLD_DOTFILE_FORMAT: errors.oldkhulnasoft,
  FAIL_PATCH: errors.patchfail,
  NOT_FOUND_HAS_DEV_DEPS: errors.tryDevDeps,
};

module.exports = function error(command) {
  return Promise.reject(new Error('Unknown command "' + command + '"'));
};

module.exports.message = function (error) {
  var message = error; // defaults to a string (which is super unlikely)
  if (error instanceof Error) {
    // try to lookup the error string based either on the error code OR
    // the actual error.message (which can be "Unauthorized" for instance),
    // otherwise send the error message back
    message = codes[error.code || error.message];
    if (message) {
      message = message.replace(/(%s)/g, error.message);
      message = chalk.bold.red(message);
    } else {
      message = error.message;
    }
  }

  return message;
};