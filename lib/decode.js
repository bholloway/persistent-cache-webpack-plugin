'use strict';

var assign = require('lodash.assign');

var classes = require('./application-classes');

/**
 * Decode the given acyclic object, instantiating using any embedded class information.
 * @param {object} object The object to decode
 * @returns {object} An acyclic object with possibly typed members
 */
function decode(object) {
  var result = {};

  // enumerable properties
  for (var key in object) {
    var value = object[key];

    // nested object
    if (value && (typeof value === 'object')) {

      // instance
      if (value.$class && value.$props) {
        result[value] = assign(new classes.getDefinition(value.$class), decode(value.$props));
      }
      // plain object
      else {
        result[value] = decode(value);
      }
    }
    // other
    else {
      result[value] = value;
    }
  }

  // complete
  return result;
}

module.exports = decode;