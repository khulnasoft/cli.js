'use strict';
require("babel/register")({
  ignore: function (filename) {
    if (filename.indexOf('@khulnasoft/registry/test') !== -1) {
      return false;
    }
    if (filename.indexOf('@khulnasoft/registry/lib') !== -1) {
      return false;
    }
    return true;
  },
//  only: /@khulnasoft\/register\//,
});
var test = require('tape');
var apiKey = '123456789';
var oldkey;
var port = process.env.PORT = process.env.KHULNASOFT_PORT = 12345;

process.env.KHULNASOFT_API = 'http://localhost:' + port + '/api/v1';
process.env.KHULNASOFT_HOST = 'http://localhost:' + port;

var server = require('@khulnasoft/registry/test/fixtures/demo-registry-server');
var utils = require('@khulnasoft/registry/test/fixtures/utils');

// ensure this is required *after* the demo server, since this will
// configure our fake configuration too
var cli = require('../cli/commands');

test('setup', function (t) {
  t.plan(5);
  cli.config('get', 'api').then(function (key) {
    oldkey = key; // just in case
    t.pass('existing user config captured');
  });
  server(port, function () {
    t.pass('started demo server');

    utils.pgSetup().then(function () {
      t.pass('setup pg database');
    });
    server.db.User.remove(function () {
      t.pass('user db emptied');
    });
    server.db.Vuln.remove(function () {
      t.pass('vulnerabilities db emptied');
    });
  });
});

test.skip('prime database', function (t) {
  t.plan(2);

  new server.db.User({
    api: [{
      key: apiKey,
    }, ],
    flags: {
      beta: true,
      betaTerms: true,
    },
    email: 'test@example.com',
  }).save(function (error) {
    if (error) {
      t.fail(error.message);
      return t.bailout();
    }
    t.pass('demo user created');

    cli.config('set', 'api=' + apiKey).then(function () {
      t.pass('api key set');
    });
  });
});

test('cli', function (t) {
  t.plan(2);

  cli.test('semver@2').then(function (res) {
    t.fail(res);
  }).catch(function (error) {
    var res = error.message;
    var pos = res.toLowerCase().indexOf('vulnerability found');
    t.pass(res);
    t.notEqual(pos, -1, 'correctly found vulnerability: ' + res);
  });

});

test('multiple test arguments', function (t) {
  t.plan(1);

  cli.test('semver@2', 'jsbin@3.11.23').then(function (res) {
    t.fail(res);
  }).catch(function (error) {
    var res = error.message;
    var lastLine = res.trim().split('\n').pop();
    t.equals(lastLine.indexOf('Tested 2 projects'), 0, 'successfully tested 2 projects');
  });
});

test('teardown', function (t) {
  t.plan(3);

  delete process.env.KHULNASOFT_API;
  delete process.env.KHULNASOFT_HOST;
  delete process.env.KHULNASOFT_PORT;
  t.notOk(process.env.KHULNASOFT_PORT, 'fake env values cleared');

  server.app.close(function () {
    t.pass('server shutdown');
    cli.config('set', 'api=' + oldkey).then(function () {
      t.pass('user config restored');
      t.end();
    });
  });
});
