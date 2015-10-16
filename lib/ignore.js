/**
 * Internal warning ignore list.
 */
module.exports = [

  // in built buffer class
  /^unknown-custom-class .*\:Buffer$/,

  // esprima defines several value objects it does not export
  /^unknown-custom-class .*\:WrappingSourceLocation$/,
  /^unknown-custom-class .*\:Position$/,
  /^unknown-custom-class .*\:SourceLocation/
];