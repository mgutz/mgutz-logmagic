/*============================================================================
 * Copyright(c) 2010 Mario L Gutierrez <mario@mgutz.com>
 *
 * See the file LICENSE for copying permission.
 *==========================================================================*/

var colors = require('mgutz-colors');
var JSON = require('../../support/json2.js');
var _s = require('underscore.string');
var _ = require('underscore');
var timestamp = require('../helper').timestamp;

var startDate = new Date;

// Simple function to calculate time difference between 2 Javascript date objects
function timeDiff(earlierDate,laterDate) {
  var totalDiff = laterDate.getTime() - earlierDate.getTime();
  var diff = {};
  var s = '';

  diff.days = Math.floor(totalDiff/1000/60/60/24);
  totalDiff -= diff.days*1000*60*60*24;

  diff.hours = Math.floor(totalDiff/1000/60/60);
  totalDiff -= diff.hours*1000*60*60;

  diff.minutes = Math.floor(totalDiff/1000/60);
  totalDiff -= diff.minutes*1000*60;

  diff.seconds = Math.floor(totalDiff/1000);
  totalDiff -= diff.seconds*1000;

  diff.milliseconds = totalDiff;

  s += diff.days + 'T';
  s += _s.lpad(diff.hours, 2, '0') + ':';
  s += _s.lpad(diff.minutes, 2, '0') + ':';
  s += _s.lpad(diff.seconds, 2, '0') + '.';
  s += _s.lpad(diff.milliseconds, 3, '0');

  return s;
}


/**
 * Logs to the console using colors (which may be disabled).
 *
 * @param {Object} options See `Console#setOptions`.
 */
function Console(options) {
  this.schemes = {
    dark: {
      moduleColor: 'black+h',
      logColor: 'white+h',
      fatalColor: 'red+h',
      errorColor: 'red+h',
      warnColor: 'yellow+h',
      infoColor: 'cyan+h',
      debugColor: 'white+h',
      traceColor: 'white+h'
    },

    light: {
      moduleColor: 'black+h',
      logColor: 'black+h',
      fatalColor: 'red+h',
      errorColor: 'red+h',
      warnColor: 'yellow+h',
      infoColor: 'cyan+h',
      debugColor: 'black+h',
      traceColor: 'black+h'
    }
  };

  if (!options) options = {};
  if (!options.scheme) options.scheme = 'dark';
  this.setOptions(options);
  return this;
}


/**
 * Uses a color scheme, setting color functions based on the scheme.
 *
 * @param {String|Object} scheme The name of an existing scheme or the
 * definition.
 */
Console.prototype.useColorScheme = function(scheme) {
  if (typeof scheme === 'string') {
    this.schemeName = scheme;
    scheme = this.schemes[scheme];
    if (!scheme) throw new Error('Scheme not found: '+scheme);
  } else if (scheme.name && !this.schemes[scheme.name]) {
    this.schemeName = scheme.name;
    this.schemes[scheme.name] = scheme;
  }
  else {
    this.schemeName = 'unknown';
  }

  // using scheme so must be allowing colors
  colors.plain = false;

  this.moduleColor = colors.fn(scheme.moduleColor ? scheme.moduleColor : '');
  this.logColor = colors.fn(scheme.logColor ? scheme.logColor : ''),
  this.fatalColor = colors.fn(scheme.fatalColor ? scheme.fatalColor : ''),
  this.errorColor = colors.fn(scheme.errorColor ? scheme.errorColor : ''),
  this.warnColor = colors.fn(scheme.warnColor ? scheme.warnColor : ''),
  this.infoColor = colors.fn(scheme.infoColor ? scheme.infoColor : ''),
  this.debugColor = colors.fn(scheme.debugColor ? scheme.debugColor : ''),
  this.traceColor = colors.fn(scheme.traceColor ? scheme.traceColor : '');

  // corresponds to levels
  this.prefixes = ['FTL', 'ERR', 'WRN', 'INF', 'DBG', 'LOG', 'TRC'];
  this.colorFunctions = [this.fatalColor, this.errorColor,
    this.warnColor, this.infoColor, this.debugColor, this.logColor, this.traceColor ];
}


/**
 * Invoked whenever a message needs to be logged.
 *
 * @param {String} modulename The modulename or namespace.
 * @param {Integer} level The level of this message.
 * @param {String} message The message to be logged.
 * @param {String} obj ???
 */
Console.prototype.callback = function(modulename, level, message, obj) {
  if (arguments.length > 3) {
    if (typeof obj === 'string') {
      message += ' ' + obj;
    }
    else if (_.isObject(obj)) {
      if (Object.keys(obj).length > 0) {
        message += '  ' + JSON.stringify(obj, function(key, value) {
            if (key === '__stack')
              return 'see below';
            else
              return value;
          }, '  '
        );

        var fm = obj['__stack'] ? '\n\n' + obj['__stack'] : '';
        message += fm;
      }
    }
    else {
      message += ' '+obj.toString();
    }
  }

  var messageColor = this.colorFunctions[level];
  var prefix = this.prefixes[level];

  var modName;
  var MAX = 16;
  if (modulename.length > MAX) {
    modName = '...' + modulename.slice(modulename.length - MAX + 3);
  }
  else {
    modName = _s.rpad(modulename, MAX);
  }

  // var now = new Date;
  // var time = now.toLocaleTimeString('%T') + '.' +  _s.lpad(now.getMilliseconds(), 3, '0');

  console.log(this.moduleColor(this.timestamp())+' '+messageColor(prefix)+' '+this.moduleColor(modName)+' '+messageColor(message));
};


/**
 * Sets the options for this color-console sink.
 *
 * @param {Object} options An object { plain: boolean, setScheme: string|object }
 *  plain: Set to true to disable colors.
 *  setScheme Can be 'dark', 'light' or an object
 *    {
 *      moduleColor: '',
 *      warnColor: '',
 *      infoColor: '',
 *      errorColor: '',
 *      traceColor: ''
 *    }
 *
 * @example
 *
 *  // disable colors
 *  setOptions({plain: true});
 *
 *  // use predefined or previously set scheme
 *  setOptions({scheme: 'dark'});
 *
 *  // customize colors
 *  setOptions({scheme: { name: 'custom', moduleColor: 'black', warnColor: 'red+h',
 *    infoColor: 'blue+h', errorColor: 'red', traceColor: 'cyan' });
 */
Console.prototype.setOptions = function(options) {
  if (options.plain)
    colors.plain = options.plain;
  else if (options.scheme)
    this.useColorScheme(options.scheme);

  this.timestamp = options.timestamp || timestamp;
};


module.exports = Console;

