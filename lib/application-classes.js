'use strict';

var isPlainObject = require('is-plain-object');

module.exports = {
  getName      : getName,
  getDefinition: getDefinition
};

/**
 * Find the class name of the given instance.
 * @param {object} candidate A possible instance to name
 * @returns {string} The absolute path to the candidate definition where it is an instance or null otherwise
 */
function getName(candidate) {
  var proto   = getProto(candidate),
      isValid = !!proto && !isPlainObject(candidate) && !Array.isArray(candidate);
  if (isValid) {
    for (var key in require.cache) {
      var exports = require.cache[key].exports,
          result  = isPlainObject(exports) ? Object.keys(exports).reduce(test.bind(null, key), null) : test(key);
      if (result) {
        return result;
      }
    }
  }
  return null;

  function test(filename, result, field) {
    if (result) {
      return result;
    } else {
      var candidate    = field ? exports[field] : exports,
          qualified    = [filename, field].filter(Boolean).join('::'),
          isDefinition = (typeof candidate === 'function') && !!candidate.prototype &&
            (typeof candidate.prototype === 'object') && (candidate.prototype === proto);
      return isDefinition && qualified || null;
    }
  }
}

/**
 * Get the class definition by explicit path where already in the require cache.
 * @param {string} name The absolute path to the file containing the class
 * @returns {null}
 */
function getDefinition(name) {
  var split      = name.split('::'),
      path       = split[0],
      field      = split[1],
      exported   = (path in require.cache) && require.cache[path].exports,
      definition = !!exported && (field ? exported[field] : exported);
  return !!definition && !!getProto(definition) && definition || null;
}

/**
 * Retrieve the prototype of the candidate, where appropriate.
 * @param {*} candidate A possible instance
 * @returns {Object} The prototype of the candidate where it is an instance or null otherwise
 */
function getProto(candidate) {
  return !!candidate && (typeof candidate === 'object') && Object.getPrototypeOf(candidate) || null;
}