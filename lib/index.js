module.exports = khulnasoft;

var cluster = require('cluster');
var hook = require('./hook');

function khulnasoft(options) {
  if (!options) {
    options = {};
  }

  if (options.api) {
    khulnasoft.api = options.api;
  }

  khulnasoft.id = options.id || khulnasoft.config.get('id');

  // FIXME add in pid + whether master + hostname + all these fields

  khulnasoft.config.isMaster = cluster.isMaster;

  if (options.monitor && khulnasoft.config.isMaster) {
    if (!khulnasoft.api) {
      throw new Error('Khulnasoft monitors require an authenticated account ' +
        'and API key');
    }
    khulnasoft.monitor.capture();
    hook();
  }

  return khulnasoft;
}

khulnasoft.api = require('./api-key')();
khulnasoft.modules = require('./modules');
khulnasoft.watch = require('./watch');
khulnasoft.test = require('./test');
khulnasoft.monitor = require('./monitor');
khulnasoft.bus = require('./bus');
khulnasoft.dotfile = require('./dotfile');
khulnasoft.isolate = {
  okay: function () {
    return true;
  },
};

// this is the user config, and not the internal config
khulnasoft.config = require('./user-config');