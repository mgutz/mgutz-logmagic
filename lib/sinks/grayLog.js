var os = require('os');

var logobj = {
  version: "1.0",
  host: os.hostname(),
  timestamp: null,
  short_message: null,
  full_message: null,
  timestamp: null,
  level: null,
  facility: null,
};

var logcache = {};

function clone(obj) {
  /* Shallow object clone */
  var target = {};
  for (var i in obj) {
    if (obj.hasOwnProperty(i)) {
      target[i] = obj[i];
    }
  }
  return target;
}

logstr = function(module, level, message, obj) {

  if (level > 7) {
    level = 7;
  }

  var l = null;

  if (obj) {
    /* begin fucking voodoo */

    /**
     * The 'easy' way to do this, is to create a new
     * object every time:
     *  l = clone(logobj);
     *
     * But because of how node stores things in its slots,
     * this is about 50% as fast as this hack using the keys
     * of an object to store only one instance of it....
     *
     * The observation we make is that most applications have a
     * limited set of parameters that they pass into be logged,
     * and the 'key' to this log object is almost always a static
     * string.
     */
    var keys = "";
    /* This is faster than Object.keys(obj).join(""); */
    for (var i in obj) {
      keys += i;
    }

    l = logcache[keys];
    if (!l) {
      l = clone(logobj);
      logcache[keys] = l;
    }

    for (var i in obj) {
      if (obj.hasOwnProperty(i)) {
        if (i == 'full_message') {
          l['full_message'] = obj[i];
        }
        else {
          l["_" + i] = obj[i];
        }
      }
    }
  }
  else {
    l = logobj;
  }


  l.facility = module;
  l.timestamp = (new Date().getTime()) / 1000;
  l.short_message = message;
  l.level = level;

  return JSON.stringify(l);
}

function GrayLog() {
  return this;
}

GrayLog.prototype.setOptions = function(options) {
    // nothing yet
};

GrayLog.prototype.callback = function(modulename, level, message, obj) {
  /* Outputs a GLEF-style JSON to stderr */
  var str = graylog.logstr(modulename, level, message, obj);
  process.stderr.write(str + "\n");
};

module.exports = GrayLog;

