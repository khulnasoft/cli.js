var protect = require('../lib/protect');
var test = require('tape');

test('test sensibly bails if gets an old .khulnasoft format', function (t) {
  var vulns2 = require('./fixtures/test-jsbin-vulns-updated.json');
  var dotfile = require('../lib/dotfile');

  t.plan(1);
  dotfile.load(__dirname + '/fixtures/old-khulnasoft-config').then(function (config) {
    return protect.filterIgnored(config.ignore, vulns2.vulnerabilities);
  }).then(function (res) {
    t.fail('was expecting an error, got ' + JSON.stringify(res));
  }).catch(function (e) {
    t.equal(e.code, 'OLD_DOTFILE_FORMAT');
  });
});