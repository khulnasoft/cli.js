module.exports = monitor;

var fs = require('then-fs');
var khulnasoft = require('../../lib/');
var config = require('../../lib/config');
var url = require('url');

function monitor(path) {
  if (!path) {
    path = process.cwd();
  }

  return fs.exists(path).then(function (exists) {
    if (!exists) {
      throw new Error('khulnasoft monitor should be pointed at an existing project');
    }

    return khulnasoft.modules(path)
      .then(khulnasoft.monitor.bind(null, { method: 'cli' }))
      .then(function (res) {
        var endpoint = url.parse(config.API);
        endpoint.pathname = '/monitor/' + res.id;
        return 'Captured a snapshot of this project\'s dependencies.\n' +
        'Explore this snapshot at ' +  url.format(endpoint) + '\n' +
        'Notifications about newly disclosed vulnerabilities\n' +
        'related to these dependencies will be emailed to you.\n';
      });

  });

}
