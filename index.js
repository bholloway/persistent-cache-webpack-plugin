'use strict';

var path     = require('path'),
    fs       = require('fs'),
    defaults = require('lodash.defaults'),
    assign   = require('lodash.assign');

var IGNORE = require('./lib/ignore'),
    cycle  = require('./lib/cycle'),
    encode = require('./lib/encode'),
    decode = require('./lib/decode');

function PersistentCacheWebpackPlugin(options) {
  this.options = defaults(options || {}, {
    webpack: null,
    file   : './webpack.cache.json',
    warn   : true,
    stats  : false,
    persist: true,
    ignore : []
  });
}
module.exports = PersistentCacheWebpackPlugin;

PersistentCacheWebpackPlugin.prototype.apply = function apply(compiler) {
  var options = this.options,
      stats   = {
        deserialise: {
          fs        : {},
          decode: {},
          retrocycle: {}
        },
        serialise  : {
          encode : {},
          decycle: {},
          fs     : {}
        }
      },
      pending;

  compiler.plugin('watch-run', onInit);
  compiler.plugin('run', onInit);
  compiler.plugin('compilation', onCompilation);
  compiler.plugin('after-emit', afterEmit);

  /**
   * Deserialise any existing file into pending cache elements.
   */
  function onInit(unused, callback) {
    var filePath = path.resolve(options.file);

    stats.deserialise.fs.start = Date.now();
    if (fs.existsSync(filePath)) {
      fs.readFile(filePath, complete);
    } else {
      complete(true);
    }

    function complete(error, contents) {
      stats.deserialise.fs.stop = Date.now();

      stats.deserialise.decode.start = Date.now();
      pending = !error && contents && cycle.retrocycle(decode(JSON.parse(contents)));
      stats.deserialise.decode.stop = Date.now();

      stats.deserialise.success = !error;
      callback();
    }
  }

  /**
   * Apply the cache items as defaults.
   */
  function onCompilation(compilation) {
    assign(compilation.cache, pending);
  }

  /**
   * Serialise the cache to file, don't wait for async.
   */
  function afterEmit(compilation, callback) {
    if (options.persist) {
      var cache    = compilation.cache,
          filePath = path.resolve(options.file);

      stats.serialise.encode.start = Date.now();
      var encoded  = encode(cache),
          failures = (encoded.$failed || [])
            .filter(filterIgnored);
      delete encoded.$failed;
      stats.serialise.encode.stop = Date.now();

      stats.failures = failures.length;

      // abort
      if (failures.length) {
        stats.serialise.fs.start = Date.now();
        fs.unlink(filePath, complete.bind(null, true));
      }
      // serialise and write file
      else {
        stats.serialise.decycle.start = Date.now();
        var decycled = cycle.decycle(encoded);
        stats.serialise.decycle.stop = Date.now();

        stats.serialise.fs.start = Date.now();
        var buffer = new Buffer(JSON.stringify(decycled, null, 2));
        stats.serialise.size = buffer.length;
        fs.writeFile(filePath, buffer, complete);
      }
    }
    else {
      complete();
    }

    function complete(error) {
      stats.serialise.fs.stop = Date.now();
      stats.serialise.success = !error;
      options.warn && pushFailures(failures, compilation.warnings, (options.warn === 'verbose'));
      options.stats && printStats(stats);
      callback();
    }
  }

  function filterIgnored(value) {
    return !IGNORE.concat(options.ignore).some(testRegex);

    function testRegex(regex) {
      return regex.test(value);
    }
  }
};

function pushFailures(failures, array, isVerbose) {
  if (failures.length) {
    var text = ['persistent-cache-webpack-plugin: failed to serialise the compiler cache']
      .concat(failures.map(eachFailure).filter(firstOccurance))
      .join('\n');
    array.push(text);
  }

  function eachFailure(value) {
    return isVerbose ? value.map(addIndent).join('\n') : addIndent(value[0], 0);
  }

  function firstOccurance(value, i, array) {
    return (array.indexOf(value) === i);
  }

  function addIndent(value, i) {
    return (new Array(4 + i * 2)).join(' ') + value;
  }
}

function printStats(stats) {
  var text = [
    'persistent-cache-webpack-plugin: statistics',
    '    deserialise:',
    '        success: ' + stats.deserialise.success,
    '        size   : ' + formatFloat(stats.deserialise.size / 1E+6) + ' MB',
    '        time   : ' + getTime(stats.deserialise),
    '    serialise:',
    '        success: ' + stats.serialise.success + ', ' + stats.failures + ' encoder failures',
    '        size   : ' + formatFloat(stats.serialise.size / 1E+6) + ' MB',
    '        time   : ' + getTime(stats.serialise)
  ].join('\n');
  console.log(text);

  function getTime(collection) {
    return collection && Object.keys(collection).filter(isTime).map(eachKey).join(', ') || '-';

    function isTime(key) {
      return collection[key].start && collection[key].stop;
    }

    function eachKey(key) {
      return formatFloat((collection[key].stop - collection[key].start) / 1E+3) + ' seconds ' + key;
    }
  }
}

function formatFloat(value) {
  if (isNaN(value)) {
    return '-';
  }
  else {
    var integer = Math.round(value),
        decimal = Math.floor((value % 1.0) * 1E+3);
    return integer + '.' + String(decimal + '000').slice(0, 3);
  }
}
