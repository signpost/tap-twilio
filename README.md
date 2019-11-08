# tap-twilio

This module is a Singer.io "Tap" for loading data from [Twilio](https://www.twilio.com). At the moment it only returns [*IncomingPhoneNumber*](https://www.twilio.com/docs/phone-numbers/api/incomingphonenumber-resource), but other streams may be added in the future.

## Usage
`tap-twilio --config <config-file>`

## Config File
The config file must be in JSON format.

### Required config keys
 * `accountSid` Twilio Account SID
 * `authToken` Twilio Auth Token

### Optional config keys
 * `pageSize` number of records to load in a single API call