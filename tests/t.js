var logmagic = require('../lib/logmagic');
var log = logmagic.local('mylib.foo.bar');
log.info('Hello!');
log.error('more stuff', {SOME_VAR: 'myvalue'});
log.trace('testing trace v0');

//logmagic.route(logmagic.ROOT, logmagic.TRACE, 'graylog');

log.trace('testing trace v1', {slug: 1});

log = logmagic.local('mylib.foo.cars');
log.trace('hello world', {counter: 33, account_id: 42, txnid: 'fxxxxx'});

logmagic.route('mylib.colors', 'TRACE', 'console');
log = logmagic.local('mylib.colors');
function tryIt(header, log) {
  console.log('\n' + header);
  var cyclic = {request: {account: {id: 45}, txtId: 'XXXXXXXXXXXXX', cyclic: cyclic}};
  console.log('===============================================================================');
  log.fatal('hello fatal', {request: {account: {id: 45}, txtId: 'XXXXXXXXXXXXX'}});
  log.error('hello error', {request: {account: {id: 45}, txtId: 'XXXXXXXXXXXXX'}});
  log.info('hello info', {request: {account: {id: 45}, txtId: 'XXXXXXXXXXXXX'}});
  log.warn('hello warn', {request: {account: {id: 45}, txtId: 'XXXXXXXXXXXXX'}});
  log.debug('hello debug', {request: {account: {id: 45}, txtId: 'XXXXXXXXXXXXX'}});
  log.log('hello log', {request: {account: {id: 45}, txtId: 'XXXXXXXXXXXXX'}});
  log.trace('hello trace', {special: 'aaa', account_id: 42, txnid: 'fxxxxx', full_message: 'loooong message'});

  log.debug('hello cyclic', cyclic);

  log.debug('object with string', 'some string');
  log.debug('object with null', null);
  log.debug('object with undefined', undefined);
}

tryIt('Colorful', log);

logmagic.setSinkOptions('console', {plain: true});
tryIt('Plain', log);

logmagic.setSinkOptions('console', {scheme: 'light'});
tryIt('Light', log);


logmagic.setSinkOptions('console', {scheme: {moduleColor: 'green'}});
tryIt('Custom colors', log);


logmagic.registerFileSink('fileLog', 'file.log');
logmagic.route(logmagic.ROOT, 'TRACE', 'fileLog');
tryIt('File > file.log', log);

logmagic.registerRecipientsSink('recipients', ['fileLog', 'console']);
logmagic.route(logmagic.ROOT, 'TRACE', 'recipients');
tryIt('Route to console and file', log);

logmagic.registerSink('ad-hoc', function(module, level, message) { console.log(message); });
logmagic.route(logmagic.ROOT, 'TRACE', 'ad-hoc');
tryIt('ad-hoc', log);

//console.log(log);
