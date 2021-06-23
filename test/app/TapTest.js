'use strict';

const fs = require('fs');
const Highland = require('highland');
const SingerIO = require('../../lib/SingerIO');
const Tap = require('../../app/Tap');

exports.Tap = {

    beforeEach() {

        this.context = {};

        this.context.config = {
            accountSid: '<account-sid>',
            authToken: '<auth-token>',
        };
        patch(fs, 'readFileSync', () => JSON.stringify(this.context.config));

        patch(Tap, 'newTwilio', () => '<twilio>');

        this.context.args = {
            config: '<config-file>',
        };

        this.create = () => new Tap(this.context.args);
    },

    create: {

        success() {

            tap(fs, 'readFileSync', (file, opts) => {
                file.should.equal('<config-file>');
                opts.should.equal('utf8');
            });

            tap(Tap, 'newTwilio', (accountSid, authToken) => {
                accountSid.should.equal('<account-sid>');
                authToken.should.equal('<auth-token>');
            });

            this.create();
        },

        failure: {

            beforeEach() {

                this.assertFailure = expectedError => {

                    try {
                        this.create();
                        throw 'expected failure';
                    } catch(error) {
                        error.should.equal(expectedError);
                    }
                };
            },

            'discovery mode not supported'() {
                this.context.args.discovery = true;
                this.assertFailure('Discovery mode not supported');
            },

            'no config'() {
                delete this.context.args.config;
                this.assertFailure('Usage: tap-twilio --config <config-file>');
            },

            'config missing account SID'() {
                delete this.context.config.accountSid;

                this.assertFailure('Config file must have accountSid and authToken');
            },

            'config missing auth token'() {
                delete this.context.config.authToken;

                this.assertFailure('Config file must have accountSid and authToken');
            },
        },
    },

    start: {

        beforeEach() {

            this.twilio = {
                incomingPhoneNumbers: '<incoming-phone-numbers-api>',
                messaging: {
                    services: '<message-services-api>',
                },
            };
            patch(Tap, 'newTwilio', () => this.twilio);

            this.tap = this.create();

            const expectedMessageStreams = [
                ['<record-1>', '<record-2>'],
                ['<record-3>', '<record-4>'],
            ];

            patch(this.tap, 'streamMessages', () => new Highland(expectedMessageStreams.shift()));

            this.stdout = new Highland();

            this.start = () => this.tap.start(this.stdout);
        },

        async success() {

            const expectedStreams = [
                { api: '<incoming-phone-numbers-api>', stream: 'IncomingPhoneNumbers' },
                { api: '<message-services-api>', stream: 'MessageServices' },
            ];
            tap(this.tap, 'streamMessages', params => {
                params.should.deep.equal(expectedStreams.shift());
            });

            const startPromise = this.start();

            // drain stream
            const records = await this.stdout.collect().toPromise(Promise);
            this.stdout.emit('done');

            await startPromise;

            records.should.deep.equal([
                '<record-1>',
                '<record-3>',
                '<record-2>',
                '<record-4>',
            ]);
        },

        async 'rejects on failure'() {

            const error = new Error('oh no!');
            patch(this.tap, 'streamMessages', () => Highland.fromError(error));

            const startPromise = this.start();

            try {
                await startPromise;
                throw new Error('Expected start() to reject');
            } catch(err) {
                err.should.eq(error);
            }
        },
    },

    async streamMessages() {

        const tapTwilio = this.create();

        patch(tapTwilio, 'streamInstances', api => {
            api.should.equal('<api>');

            return new Highland(['<instance-1>', '<instance-2>']);
        });

        patch(SingerIO, 'formatRecord', params => {
            params.stream.should.equal('<stream>');

            return params.record.replace('instance', 'record');
        });

        const records = await tapTwilio.streamMessages({ api: '<api>', stream: '<stream>' })
            .collect()
            .toPromise(Promise);

        records.should.deep.equal([
            '<record-1>\n',
            '<record-2>\n',
        ]);
    },

    streamInstances: {

        beforeEach() {

            this.api = {
                page: async() => this.page1,
            };

            this.page1 = {
                instances: ['<instance-1>', '<instance-2>'],
                nextPage: async() => this.page2,
            };

            this.page2 = {
                instances: ['<instance-3>', '<instance-4>'],
                nextPage: async() => this.page3,
            };

            this.page3 = {
                instances: ['<instance-5>'],
                nextPage: async() => undefined,
            };

            this.streamInstances = () => this.create().streamInstances(this.api);
        },

        async success() {

            tap(this.api, 'page', options => {
                options.should.deep.equal({});
            });

            const stream = this.streamInstances();
            const instances = await new Highland(stream).collect().toPromise(Promise);

            instances.should.deep.equal([
                '<instance-1>',
                '<instance-2>',
                '<instance-3>',
                '<instance-4>',
                '<instance-5>',
            ]);
        },

        async 'success if all instances returned in first page'() {

            this.page1.nextPage = async() => undefined;

            const stream = this.streamInstances();
            const instances = await new Highland(stream).collect().toPromise(Promise);

            instances.should.deep.equal([
                '<instance-1>',
                '<instance-2>',
            ]);
        },

        async 'success if empty'() {

            this.page1.instances.length = 0;
            this.page1.nextPage = async() => undefined;

            const stream = this.streamInstances();
            const instances = await new Highland(stream).collect().toPromise(Promise);

            instances.should.deep.equal([]);
        },

        async 'propagates API error'() {

            const error = new Error('oh noes!');

            this.api.page = () => Promise.reject(error);

            const stream = this.streamInstances();

            try {
                await new Highland(stream).toPromise(Promise);
                throw new Error('Expected stream error');
            } catch(err) {
                err.should.eq(error);
            }
        },

        async 'optionally passes pageSize to API'() {

            this.context.config.pageSize = '<page-size>';

            patch(this.api, 'page', options => {
                options.should.deep.equal({ pageSize: '<page-size>' });
            });

            const stream = this.streamInstances();
            await new Highland(stream).collect().toPromise(Promise);
        },

    },
};
