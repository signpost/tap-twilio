'use strict';

const Chai = require('chai');
const MonkeyPatcher = require('monkey-patcher').MonkeyPatcher;

global.should = Chai.should();
global.expect = Chai.expect;
global.assert = Chai.assert;

// Make MonkeyPatcher and methods available to all test modules
// (see also InitMonkeyPatcher.js)
global.MonkeyPatcher = MonkeyPatcher;
global.patch = MonkeyPatcher.patch;
global.wrap = MonkeyPatcher.wrap;
global.tap = MonkeyPatcher.tap;

// SetUp and TearDown MonkeyPatcher for all tests
exports.beforeEach = MonkeyPatcher.setUp;
exports.afterEach = MonkeyPatcher.tearDown;
