'use strict';

exports.env = {
    mocha: true
};

// Permit globals set up by InitTests.js
exports.globals = {

    // Chai
    should: true,
    expect: true,
    assert: true,

    // MonkeyPatcher
    MonkeyPatcher: true,
    patch: true,
    wrap: true,
    tap: true,
};

