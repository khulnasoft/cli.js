'use strict';
var test = require('tape');

test('does it load', function (t) {
  var khulnasoft = require('../');
  t.assert(khulnasoft, 'khulnasoft loaded');
  t.end();
});