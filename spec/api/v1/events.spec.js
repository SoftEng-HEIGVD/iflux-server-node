var
	baseTest = require('../base');

var testSuite = baseTest('Events resource');

testSuite
	.describe('Anonymous user should be able to post an event')
	.post({
		url: '/v1/events',
		body: {
			timestamp: new Date(),
			source: 'abcd',
      type: 'http://localhost.localdomain/eventType',
      properties: {
        temperature: 12
      }
		}
	})
	.expectStatusCode(204);

testSuite
	.describe('Anonymous user should be able to post an array of events')
	.post({
		url: '/v1/events',
		body: [{
			timestamp: new Date(),
			source: 'abcd',
      type: 'http://localhost.localdomain/eventType',
      properties: {
        temperature: 12
      }
		}, {
      timestamp: new Date(),
      source: 'abcd',
      type: 'http://localhost.localdomain/eventType',
      properties: {
        temperature: 13
      }
    }]
	})
	.expectStatusCode(204);

module.exports = testSuite;
