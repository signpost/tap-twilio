'use strict';

const SingerIO = require('../../lib/SingerIO');

exports.SingerIO = {

    formatRecord() {
        SingerIO.formatRecord({
            stream: '<stream>',
            record: '<record>',
        }).should.equal(
            '{"type":"RECORD","stream":"<stream>","record":"<record>"}'
        );
    },
};

