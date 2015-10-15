'use strict';

var path     = require('path'),
    fs       = require('fs'),
    cycle    = require('cycle'),
    defaults = require('lodash.defaults');

var webpackClasses = require('./lib/webpack-classes');

function PersistentCacheWebpackPlugin(options) {
  this.options = defaults(options || {}, {
    file : './webpack.cache.json',
    warn : false,
    stats: false
  });
}
module.exports = PersistentCacheWebpackPlugin;

PersistentCacheWebpackPlugin.prototype.apply = function apply(compiler) {
  var options  = this.options,
      stats    = {},
      failures = [],
      pending;

  compiler.plugin('watch-run', onInit);
  compiler.plugin('run', onInit);
  compiler.plugin('compilation', onCompilation);
  compiler.plugin('after-emit', onDone);

  function onInit(unused, callback) {
    var filePath = path.resolve(options.file);

    stats.deserialiseStart = Date.now();
    if (fs.existsSync(filePath)) {
      fs.readFile(filePath, complete);
    } else {
      complete(true);
    }

    function complete(error, contents) {
      pending = error ? {} : deserialise(contents);
      stats.deserialiseStop = Date.now();
      stats.deserialiseSuccess = !error;
      callback();
    }
  }

  function onCompilation(compilation) {
    defaults(compilation.cache, pending);
  }

  function onDone(compilation, callback) {
    var cache    = compilation.cache,
        filePath = path.resolve(options.file);

    stats.serialiseStart = Date.now();
    fs.writeFile(filePath, serialise(cache), complete);

    function complete(error) {
      stats.serialiseStop = Date.now();
      stats.serialiseSuccess = !error;
      options.warn && printWarnings();
      options.stats && printStats();
      callback();
    }
  }

  function deserialise(text) {

  }

  function serialise(value) {
console.log(Object.keys(value))
    return JSON.stringify(cycle.decycle(value), replacer, 2);

    function replacer(key, value) {

      // object
      if (value && (typeof value === 'object') && (key !== '$props')) {

        // anything other than an Object literal or an Array may be instances
        var isPlain   = Array.isArray(value) || (value.constructor === Object),
            className = !isPlain && webpackClasses.getName(value);
        if (className) {
          return {
            $class: className,
            $props: value
          };
        }
        // could be a failure
        else if (!isPlain) {
          failures.push(key);
        }
      }

      // non-instance
      return value;
    }
  }

  function printWarnings() {

  }

  function printStats() {

  }
}


