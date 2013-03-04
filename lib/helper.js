exports.timestamp = function timestamp() {
  var d = new Date;

  // Format integers to have at least two digits.
  function f(n) {
    return n < 10 ? '0' + n : n;
  }

  return d.getUTCFullYear()   + '-' +
    f(d.getUTCMonth() + 1) + '-' +
    f(d.getUTCDate())      + 'T' +
    f(d.getUTCHours())     + ':' +
    f(d.getUTCMinutes())   + ':' +
    f(d.getUTCSeconds())   + '.' +
    f(d.getUTCMilliseconds()) + 'Z';
};
