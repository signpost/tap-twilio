#!/usr/bin/env node
'use strict';

const Highland = require('highland');
const minimist = require('minimist');
const fs = require('fs');
const SingerIO = require('../lib/SingerIO');
const Twilio = require('twilio');

const Tap = class Tap {

    constructor(args) {

        if (args.discovery) {
            // TODO support discovery mode
            throw 'Discovery mode not supported';
        }

        if (!args.config) {
            throw 'Usage: tap-twilio --config <config-file>';
        }

        this._config = JSON.parse(fs.readFileSync(args.config, 'utf8'));

        if (!this._config.accountSid || !this._config.authToken) {
            throw 'Config file must have accountSid and authToken';
        }

        this._twilio = Tap.newTwilio(this._config.accountSid, this._config.authToken);
    }

    /* istanbul ignore next */
    static newTwilio(...args) {
        return new Twilio(...args);
    }

    start(outputStream) {

        const messages = new Highland([
            this.streamMessages({
                api: this._twilio.incomingPhoneNumbers,
                stream: 'IncomingPhoneNumbers',
            }),
        ]).merge();

        return new Promise((resolve, reject) => {
            messages
                .on('error', reject)
                .pipe(outputStream)
                .on('done', resolve);
        });
    }

    /**
     * Stream Singer.io messages from a Twilio resource API
     *
     * @param  {Function} options.api Twilio resource API
     * @param  {String} options.stream Singer.io stream name
     * @returns {Readable} stream of record messages
     */
    streamMessages({ api, stream }) {
        return new Highland(
            this.streamInstances(api)
        ).map(record => `${SingerIO.formatRecord({ stream, record })}\n`);
    }

    /**
     * Stream instances from a Twilio resource API
     *
     * @param  {Function} api Twilio resource API
     * @returns {Readable.<Instance>} objectMode stream of instances
     */
    streamInstances(api) {

        // load using the page() API so we can properly support backpressure

        const pageOptions = {};

        if (this._config.pageSize) {
            pageOptions.pageSize = this._config.pageSize;
        }

        let lastPage;

        return new Highland((push, next) => {
            Promise.resolve().then(() => {
                if (lastPage) {
                    return lastPage.nextPage();
                } else {
                    return api.page(pageOptions);
                }
            }).then(page => {
                if (!page) {
                    // no more pages
                    push(null, Highland.nil);
                } else {
                    lastPage = page;
                    page.instances.forEach(instance => push(null, instance));
                    next();
                }
            }).catch(error => push(error));
        });
    }
};

module.exports = Tap;

/* istanbul ignore if */
if (require.main === module) {
    new Tap(minimist(process.argv.slice(2)))
        .start(process.stdout)
        .catch(error => {
            console.error(error.stack || error); // eslint-disable-line no-console
            process.exitCode = 1;
        });
}
