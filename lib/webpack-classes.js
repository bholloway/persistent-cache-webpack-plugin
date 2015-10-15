'use strict';

var path       = require('path'),
    requireDir = require('require-dir'),
    webpackLib = requireDir(path.dirname(require.resolve('webpack')), {recurse: true});

var lookup;

module.exports = {
  getName      : getName,
  getDefinition: getDefinition
};

/**
 * Find the class name of the given instance.
 * @param {object} candidate A possible instance to name.
 * @returns {*}
 */
function getName(candidate) {

  // initialise on first use
  init();

  // lookup the given candidate
  return candidate && (typeof candidate === 'object') && Object.keys(lookup).reduce(findByKey, null);

  function findByKey(reduced, key) {
    return reduced || ((candidate instanceof lookup[key]) && key) || null;
  }
}

function getDefinition(name) {

  // initialise on first use
  init();

  // simple lookup
  return lookup[name] || null;
}

function init() {
  lookup = lookup || Object.keys(webpackLib)
      .reduce(reduceKeys.bind(webpackLib, []), {});

  function reduceKeys(prefix, reduced, key) {
    /* jshint validthis:true */
    var value = this[key];

    // functions with SentenceCaseNames are likely classes
    if ((typeof value === 'function') && (key.charAt(0) === key.charAt(0).toUpperCase())) {
      reduced[prefix.concat(key).join('.')] = value;
    }
    // recurse objects
    else if (value && (typeof value === 'object')) {
      Object.keys(value)
        .reduce(reduceKeys.bind(value, prefix.concat(key)), reduced);
    }

    return reduced;
  }
}
