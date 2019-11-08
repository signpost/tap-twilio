'use strict';

/**
 * Utilities for Singer.IO
 */
module.exports = class SingerIO {

    /**
     * Format a Singer.IO record message
     *
     * @param  {String} options.stream name of stream
     * @param  {Object} options.record record (will be JSON.stringified)
     * @returns {String} record message
     */
    static formatRecord({ stream, record }) {
        return JSON.stringify({
            type: 'RECORD',
            stream,
            record,
        });
    }
};
