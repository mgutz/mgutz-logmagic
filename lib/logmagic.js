/*
 * Licensed to Paul Querna under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * Paul Querna licenses this file to You under the Apache License, Version 2.0
 * (the 'License'); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var _ = require('underscore');

function LoggerProxy(modulename) {
  this.modulename =  modulename;
  this.level = -1;
}

var _levels = exports.levels = {
  FATAL: 0,
  ERROR: 1,
  WARN: 2,
  INFO: 3,
  DEBUG: 4,
  LOG: 5,
  TRACE: 6
};

var _methods = [];
for (var k in _levels) {
  if (_levels.hasOwnProperty(k))
    _methods[_levels[k]] = k;
}


var _knownSinks = {};
var _knownLoggers = [];
var _knownRoutes = [];

/**
 * Builds a log method for a module.
 *
 * @param {String} moduleName
 * @param {Integer} level
 * @param {Function} callback `function(moduleName, level, message, extra)`
 */
function buildLogMethod(moduleName, level, callback) {
  if (level == _levels.TRACE) {
    return function(msg, extra) {
      if (!extra) extra = {};
      var backtrace = new Error('Backtrace').stack;
      backtrace = backtrace.split('\n');
      backtrace = backtrace.slice(2);
      backtrace = 'Backtrace:\n' + backtrace.join('\n');
      extra['__stack'] = backtrace;
      callback(moduleName, level, msg.stack ? msg.stack : msg, extra.stack ? extra.stack : extra);
    }
  }
  else {
    return function(msg, extra) {
      if (!extra) extra = {};
      callback(moduleName, level, msg.stack ? msg.stack : msg, extra.stack ? extra.stack : extra);
    }
  }
}


function nullFn() {
  /* Intentionally blank. */
}


function applyRoute(route, logger, modulename) {
  var level, level, llstr;

  logger.level = route.level;
  for(var i=0; i < _methods.length; i++) {
    method = _methods[i];
    level = _levels[method];
    methodName = method.toLowerCase();

    if (level <= route.level)
      logger[methodName] = buildLogMethod(modulename, level, route.callback);
    else
      logger[methodName] = nullFn;
  }
}


function routeMatch(a, b) {
  var as = a.split('.');
  var bs = b.split('.');
  var asl = as.length;
  var bsl = bs.length;
  var i = 0;

  while(true) {
    if (asl < i || bsl < i)
      break;

    if (as[i] == bs[i]) {
      if (asl == i)
        return true;
      i++;
      continue;
    }

    if (as[i] == '*')
      return true;

    break;
  }
  return false;
}

function applyRoutes(logger) {
  for(var i=0; i < _knownRoutes.length; i++) {
    var r = _knownRoutes[i];
    if (r.route == exports.ROOT || (logger.modulename && routeMatch(r.route, logger.modulename)))
      applyRoute(r, logger, logger.modulename);
  }
}

exports.local = exports.getLogger = function(modulename) {
  var logger = new LoggerProxy(modulename);
  applyRoutes(logger);
  _knownLoggers.push(logger);
  return logger;
};


/* from coffee-script :) */
var __bind = function(fn, me) {
  return function() {
    return fn.apply(me, arguments);
  };
};


/**
 * Registers a sink.
 *
 * @param {String} instanceName
 * @param {Object|Function} sink If the sink is a function, then an ad-hoc
 * sink is created with the `sink` as the callback. Otherwise, `sink` is
 * assumed to be an object that has a `sink` interface.
 */
exports.registerSink = function(instanceName, sink) {
  if (typeof sink === 'function') {
    sink = {
      name: 'ad-hoc',
      callback: sink
    }
  }

  _knownSinks[instanceName] = sink;
  sink.instanceName = instanceName;

  /* ad-hoc sinks will likely only have a callback, so default others */
  if (!sink.setOptions) sink.setOptions = function() {};
  if (!sink.dispose) sink.dispose = function() {};

  /* ensure callback is bound to sink */
  sink.callback = __bind(sink.callback, sink);
};

exports.route = function(match, level, sinkname) {
  if (!_levels[level])
    throw new Error('Invalid Log level: ' + level);

  /* TODO: Maybe it is okay to route before we have a sink loaded (?) */
  if (_knownSinks[sinkname] === undefined) {
    throw new Error('Invalid Sink: ' + sinkname);
  }

  _knownRoutes.push({route: match, level: _levels[level], callback: _knownSinks[sinkname].callback});

  for(var i=0; i<_knownLoggers.length; i++) {
    var logger = _knownLoggers[i];
    applyRoutes(logger);
  }
};

exports.setSinkOptions = function(instanceName, options) {
  _knownSinks[instanceName].setOptions(options);
};


/**
 * The built-in sink classes.
 */
var sinks = exports.sinks = {};


/**
 * Get sink instances by name.
 *
 * @param {String|Array} names The instance names of sinks.
 * @return Returns an array of sink instances.
 */
exports.getSinkInstances = function(names) {
  if (typeof names === 'string')
    return [_knownSinks[names]];
  else if (_.isArray(names)) {
    var result = [];
    for (var i = 0; i < names.length; i++) {
      result.push(_knownSinks[names[i]]);
    }
    return result;
  }
};


/* LogMagic looks way too complicated. Create simple factory functions. */

/* Creates and registers a new FileSink */
exports.registerFileSink = function(instanceName, filename) {
  var instance = new sinks.File({filename: filename});
  exports.registerSink(instanceName, instance);
  return instance;
};

/* Creates and registers a new Recipients sink */
exports.registerRecipientsSink = function(instanceName, sinkInstances) {
  var list = [],
      name;

  for (var i = 0; i < sinkInstances.length; i++) {
    name = sinkInstances[i];
    if (typeof name === 'string')
      list.push(_knownSinks[name]);
    else {
      if (!name.callback) throw new Error('Invalid sink instance: ' + name);
      list.push(name);
    }
  }

  var instance = new sinks.Recipients({list: list});
  exports.registerSink(instanceName, instance);

  return instance;
};

/* Creates and registers a new ConsoleSink */
exports.registerConsoleSink = function(instanceName, scheme) {
  var instance = new sinks.Console({scheme: scheme});
  exports.registerSink(instanceName, instance);
  return instance;
};

exports.ROOT = '__root__';

(function() {
  var klass, name, sink;
  var modules = ['ansiConsole', 'file', 'grayLog', 'recipients'];

  // export sinks
  for (var i = 0; i < modules.length; i++) {
    name = modules[i];
    sink = require('./sinks/' + name);

    // exports with titleized name
    klass = name.charAt(0).toUpperCase() + name.slice(1);
    exports.sinks[klass] = sink;

    // create default properties
    if (!sink.prototype.name) sink.prototype.name = klass;
    if (!sink.prototype.setOptions) sink.prototype.setOptions = nullFn;
    if (!sink.prototype.dispose) sink.prototype.dispose = nullFn;
  }

  // Register default sinks
  exports.registerSink('console', new sinks.AnsiConsole);
  exports.registerSink('graylog', new sinks.GrayLog);

  // Default logger
  exports.route(exports.ROOT, 'INFO', 'console');
})();
