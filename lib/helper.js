exports.timestamp = function timestamp() {
  var d = new Date;

  // Format integers to have at least two digits.
  function f2(n) {
    return n < 10 ? '0' + n : n;
  }
  function f3(n) {
    if (n > 99) return n;
    else if (n > 9) return '0' + n;
    else return '00' + n;
  }

  return d.getUTCFullYear()   + '-' +
    f2(d.getUTCMonth() + 1) + '-' +
    f2(d.getUTCDate())      + 'T' +
    f2(d.getUTCHours())     + ':' +
    f2(d.getUTCMinutes())   + ':' +
    f2(d.getUTCSeconds())   + '.' +
    f3(d.getUTCMilliseconds()) + 'Z';
};
