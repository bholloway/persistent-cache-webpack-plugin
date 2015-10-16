'use strict';

var isPlainObject = require('is-plain-object');

var classes = require('./application-classes');

/**
 * Encode the given acyclic object with class information.
 * @param {object} object The object to encode
 * @param {Array.<string>} [path] Optional path information for the object where it is nested in another object
 * @param {Array.<object>} [exclusions] Optional object list to detect circular references
 * @returns {object} An acyclic object with additional encoded inforation
 */
function encode(object, path, exclusions) {
  var failed  = [],
      result  = {};

  // ensure valid path and exclusions
  path = path || [];
  exclusions = exclusions || [];

  // enumerable properties
  for (var key in object) {
    var value = object[key];

    // objects
    if (value && (typeof value === 'object') && (exclusions.indexOf(value) < 0)) {
      var className     = classes.getName(value),
          analysis      = /function ([^\(]+)\(/.exec(Function.prototype.toString.call(value.constructor)),
          qualifiedName = ((key.length < 60) ? key : key.slice(0, 30) + '...' + key.slice(-30)) +
            ':' +
            (className ? className.split(/[\\\/]/).pop().split('.').shift() :
              (analysis && analysis[1] || Object.prototype.toString.apply(value).slice(8, -1))),
          propPath      = path.concat(qualifiedName);

      // add to exclusions before recursing
      exclusions.push(value);

      // depth first
      var recursed = encode(value, propPath, exclusions);

      // propagate failures but don't keep them in the tree
      if (recursed.$failed) {
        failed.push.apply(failed, recursed.$failed);
        delete recursed.$failed;
      }

      // exclude deleted fields
      if (recursed.$deleted) {
        failed.push(['read-only-prop ' + qualifiedName + '.' + recursed.$deleted]
          .concat(propPath)
          .concat(recursed.$deleted));
      }
      // encode recognised class
      else if (className) {
        result[key] = {
          $class: className,
          $props: recursed
        };
      }
      // include otherwise
      else {

        // unrecognised custom class
        if (!isPlainObject(value) && !Array.isArray(value)) {
          failed.push(['unknown-custom-class ' + qualifiedName].concat(propPath));
        }

        // default to plain object
        result[key] = recursed;
      }
    }
    // include non-objects
    else {
      result[key] = value;
    }
  }

  // mark failures
  if (failed.length) {
    result.$failed = failed;
  }

  // complete
  return result;
}

module.exports = encode;