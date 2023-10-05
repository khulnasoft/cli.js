module.exports = watch;

var khulnasoft = require('../../lib/');

function watch(path) {
  if (!path) {
    path = process.cwd();
  }
  // console.log('creating watch for %s...', path);
  return khulnasoft.watch(path || process.cwd()).then(function (res) {
    if (res.ok) {
      return '✓ Watching "' + res.watch.name + '@' + res.watch.version + '"';
    }
  });
}
