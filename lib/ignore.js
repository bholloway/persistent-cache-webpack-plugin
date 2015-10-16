/**
 * Internal warning ignore list.
 */
module.exports = [
  /^unknown-custom-class .*\:WrappingSourceLocation$/,  // esprima - simply a value object
  /^unknown-custom-class .*\:Position$/                 // esprima - simply a value object
];