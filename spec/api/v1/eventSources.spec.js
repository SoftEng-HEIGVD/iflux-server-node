var
	config = require('../../../config/config'),
	baseTest = require('../base');

module.exports = baseTest('Event source resource')
	.createUser('Register first user')
	.createUser('Register second user', { lastName: 'Dutoit', email: 'henri.dutoit@localhost.localdomain' })
	.signinUser('Signing first user')
	.signinUser('Signing first user', { email: 'henri.dutoit@localhost.localdomain' })
	.createOrganization('Create new organization for first user', { name: 'Orga 1' }, 1, 1)
	.createOrganization('Create second organization for first user', { name: 'Orga 2' }, 1, 2)
	.createOrganization('Create new organization for second user', { name: 'Orga 3' }, 2, 3)
	.createEventSourceTemplate('Create first event source template for first user', {
		name: 'Event source template 1',
		public: true,
		configuration: {
			schema: {
				$schema: "http://json-schema.org/draft-04/schema#",
				type: "object",
				properties: {
					sensorId: {
						type: "string"
					}
				},
				"additionalProperties": false,
				"required": [ "sensorId" ]
			}
		}
	}, 1, 1)
	.createEventSourceTemplate('Create second event source template for first user', { name: 'Event source template 2', public: false }, 1, 2)
	.createEventSourceTemplate('Create first event source template for second user', { name: 'Event source template 3', public: false }, 2, 3)

	.createEventSourceTemplate('Create configurable event source template for first user', {
		name: 'Configurable event source template',
		public: true,
		configuration: {
			url: 'http://localhost:' + config.mockServer.serverPort + '/configure',
			schema: {
				$schema: "http://json-schema.org/draft-04/schema#",
				type: "object",
				properties: {
					test: {
						type: "string"
					}
				},
				"additionalProperties": false,
				"required": [ "test" ]
			}
		}
	}, 1, 1)
	.createEventSourceTemplate('Create configurable with token event source template for first user', {
		name: 'Configurable event source template with token',
		public: true,
		configuration: {
			url: 'http://localhost:' + config.mockServer.serverPort + '/configure',
			token: 'jwtToken',
			schema: {
				$schema: "http://json-schema.org/draft-04/schema#",
				type: "object",
				properties: {
					test: {
						type: "string"
					}
				},
				"additionalProperties": false,
				"required": [ "test" ]
			}
		}
	}, 1, 1)

	.describe('First user tries to creates ES1 event source with too short name.')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.post({	url: '/v1/eventSources' }, function() {
		return {
			body: {
				name: 'ES',
				organizationId: this.getData('organizationId1'),
				eventSourceTemplateId: this.getData('eventSourceTemplateId1')
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToHavePath('name.0')
	.expectJsonToBe({ name: [ 'The name must be at least 3 characters long' ]})

	.describe('First user tries to creates an event source in an organization he has no access.')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.post({	url: '/v1/eventSources' }, function() {
		return {
			body: {
				name: 'iFLUX Thermometer',
				organizationId: this.getData('organizationId3'),
				eventSourceTemplateId: this.getData('eventSourceTemplateId3')
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToHavePath('organizationId.0')
	.expectJsonToBe({ organizationId: [ 'No organization found.' ]})

	.describe('First user tries to create an event source from an event source template he has no access.')
	.post({	url: '/v1/eventSources' }, function() {
		return {
			body: {
				name: 'iFLUX Thermometer',
				organizationId: this.getData('organizationId1'),
				eventSourceTemplateId: this.getData('eventSourceTemplateId3')
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToHavePath('eventSourceTemplateId.0')
	.expectJsonToBe({ eventSourceTemplateId: [ 'No event source template found.' ]})

	.describe('First user tries to create an event source with a wrong configuration.')
	.post({ url: '/v1/eventSources' }, function() {
		return {
			body: {
				name: 'iFLUX Thermometer',
				organizationId: this.getData('organizationId1'),
				eventSourceTemplateId: this.getData('eventSourceTemplateId1'),
				configuration: {
					wrongProperty: 'anyValue'
				}
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToHavePath('configuration')
	.expectJsonToBe({ configuration: [{
		wrongProperty: [ "additionalProperty 'wrongProperty' exists in instance when not allowed" ],
		sensorId: [ "requires property \"sensorId\"" ]
	}]})

	.describe('First user creates a first event source for his second organization and first event source template.')
	.post({ url: '/v1/eventSources' }, function() {
		return {
			body: {
				name: 'iFLUX Thermometer',
				organizationId: this.getData('organizationId2'),
				eventSourceTemplateId: this.getData('eventSourceTemplateId1'),
				configuration: {
					sensorId: 'amazingSensor'
				}
			}
		};
	})
	.storeLocationAs('eventSource', 1)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventSources/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('First user creates a second event source for his second organization and second event source template.')
	.post({ url: '/v1/eventSources' }, function() {
		return {
			body: {
				name: 'iFLUX Thermometer second',
				organizationId: this.getData('organizationId2'),
				eventSourceTemplateId: this.getData('eventSourceTemplateId2')
			}
		};
	})
	.storeLocationAs('eventSource', 2)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventSources/:id')

	.describe('First user tries to create a third event source for his first organization and second event source template.')
	.post({ url: '/v1/eventSources' }, function() {
		return {
			body: {
				name: 'iFLUX Thermometer third',
				organizationId: this.getData('organizationId1'),
				eventSourceTemplateId: this.getData('eventSourceTemplateId2')
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToHavePath('eventSourceTemplateId.0')
	.expectJsonToBe({ eventSourceTemplateId: [ 'No event source template found.' ]})

	.describe('First user creates a third event source for his first organization and first event source template.')
	.post({ url: '/v1/eventSources' }, function() {
		return {
			body: {
				name: 'iFLUX Thermometer third',
				organizationId: this.getData('organizationId1'),
				eventSourceTemplateId: this.getData('eventSourceTemplateId1')
			}
		};
	})
	.storeLocationAs('eventSource', 3)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventSources/:id')

	.describe('Second user creates a first event source for his organization and first event source template.')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.post({ url: '/v1/eventSources' }, function() {
		return {
			body: {
				name: 'iFLUX Thermometer first for second user',
				organizationId: this.getData('organizationId3'),
				eventSourceTemplateId: this.getData('eventSourceTemplateId1')
			}
		};
	})
	.storeLocationAs('eventSource', 4)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventSources/:id')

	.describe('Second user creates a second event source for his organization and third event source template.')
	.post({ url: '/v1/eventSources' }, function() {
		return {
			body: {
				name: 'iFLUX Thermometer second for second user',
				organizationId: this.getData('organizationId3'),
				eventSourceTemplateId: this.getData('eventSourceTemplateId3')
			}
		};
	})
	.storeLocationAs('eventSource', 5)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventSources/:id')

	.describe('Second user creates a third event source for his organization and template in a different organization.')
	.post({ url: '/v1/eventSources' }, function() {
		return {
			body: {
				name: 'iFLUX Thermometer third for second user',
				organizationId: this.getData('organizationId3'),
				eventSourceTemplateId: this.getData('eventSourceTemplateId1')
			}
		};
	})
	.storeLocationAs('eventSource', 6)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventSources/:id')

	.describe('Second user retrieve his third event source.')
	.get({}, function() { return { url: '/v1/eventSources?name=%third%&eventSourceTemplateId=' + this.getData('eventSourceTemplateId1') }; })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'iFLUX Thermometer third for second user',
			organizationId: this.getData('organizationId3'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1')
		}];
	})

	.describe('First user tries to retrieve event sources.')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.get({ url: '/v1/eventSources' })
	.expectStatusCode(422)
	.expectJsonToHavePath([ 'eventSourceTemplateId', 'organizationId', 'allOrganizations' ])
	.expectJsonToBe({
		eventSourceTemplateId: [ 'Event source template id should be provided.' ],
		organizationId: [ 'Organization id should be provided.' ],
		allOrganizations: [ 'allOrganizations should be provided.' ]
	})

	.describe('First user tries to mix different way to retrieve event sources (eventSourceTemplateId is used).')
	.get({}, function() {
		return {
			url: '/v1/eventSources?allOrganizations&organizationId=' +
				this.getData('organizationId1') +
				'&eventSourceTemplateId=' +
				this.getData('eventSourceTemplateId1')
		};
	})
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('eventSourceId1'),
			organizationId: this.getData('organizationId2'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1')
		}, {
			id: this.getData('eventSourceId3'),
			organizationId: this.getData('organizationId1'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1')
		}];
	})

	.describe('First user tries to mix different way to retrieve event sources (organizationId is used).')
	.get({}, function() { return { url: '/v1/eventSources?allOrganizations&organizationId=' + this.getData('organizationId1') }; })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('eventSourceId3'),
			organizationId: this.getData('organizationId1'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1')
		}];
	})

	.describe('First user retrieves all event sources.')
	.get({ url: '/v1/eventSources?allOrganizations' })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '2.id', '0.name', '1.name', '2.name', '0.organizationId', '0.eventSourceTemplateId' ])
	.expectJsonCollectionToHaveSize(3)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('eventSourceId1'),
			name: 'iFLUX Thermometer',
			organizationId: this.getData('organizationId2'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1'),
			configuration: {
				sensorId: 'amazingSensor'
			}
		}, {
			id: this.getData('eventSourceId2'),
			name: 'iFLUX Thermometer second',
			organizationId: this.getData('organizationId2'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId2')
		}, {
			id: this.getData('eventSourceId3'),
			name: 'iFLUX Thermometer third',
			organizationId: this.getData('organizationId1'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1')
		}];
	})

	.describe('First user retrieves all event sources filtered by name.')
	.get({ url: '/v1/eventSources?allOrganizations&name=%25er' })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('eventSourceId1'),
			name: 'iFLUX Thermometer',
			organizationId: this.getData('organizationId2'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1'),
			configuration: {
				sensorId: 'amazingSensor'
			}
		}];
	})

	.describe('First user retrieves all event sources for his first organization.')
	.get({}, function() { return { url: '/v1/eventSources?organizationId=' + this.getData('organizationId1') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.name', '0.organizationId', '0.eventSourceTemplateId' ])
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('eventSourceId3'),
			name: 'iFLUX Thermometer third',
			organizationId: this.getData('organizationId1'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1')
		}];
	})

	.describe('First user retrieves all event sources for his second organization filtered by name.')
	.get({}, function() { return { url: '/v1/eventSources?organizationId=' + this.getData('organizationId2') + '&name=%second%'}; })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('eventSourceId2'),
			name: 'iFLUX Thermometer second',
			organizationId: this.getData('organizationId2'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId2')
		}];
	})

	.describe('First user retrieves all event sources for his second organization.')
	.get({}, function() { return { url: '/v1/eventSources?organizationId=' + this.getData('organizationId2') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '0.name', '1.name', '0.organizationId', '0.eventSourceTemplateId', '0.configuration' ])
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('eventSourceId1'),
			name: 'iFLUX Thermometer',
			organizationId: this.getData('organizationId2'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1'),
			configuration: {sensorId: 'amazingSensor'}
		}, {
			id: this.getData('eventSourceId2'),
			name: 'iFLUX Thermometer second',
			organizationId: this.getData('organizationId2'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId2')
		}];
	})

	.describe('First user retrieves all event sources for his first event source template.')
	.get({}, function() { return { url: '/v1/eventSources?eventSourceTemplateId=' + this.getData('eventSourceTemplateId1') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '0.name', '1.name', '0.organizationId', '0.eventSourceTemplateId' ])
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('eventSourceId1'),
			name: 'iFLUX Thermometer',
			organizationId: this.getData('organizationId2'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1'),
			configuration: {sensorId: 'amazingSensor'}
		}, {
			id: this.getData('eventSourceId3'),
			name: 'iFLUX Thermometer third',
			organizationId: this.getData('organizationId1'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1')
		}];
	})

	.describe('First user retrieves all event sources for his first event source template filtered by name.')
	.get({}, function() { return { url: '/v1/eventSources?eventSourceTemplateId=' + this.getData('eventSourceTemplateId1') + '&name=%third%' }; })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('eventSourceId3'),
			name: 'iFLUX Thermometer third',
			organizationId: this.getData('organizationId1'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1')
		}];
	})

	.describe('First user retrieves all event sources for his second event source template.')
	.get({}, function() { return { url: '/v1/eventSources?eventSourceTemplateId=' + this.getData('eventSourceTemplateId2') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.name', '0.organizationId', '0.eventSourceTemplateId' ])
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('eventSourceId2'),
			name: 'iFLUX Thermometer second',
			organizationId: this.getData('organizationId2'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId2')
		}];
	})

	.describe('Second user retrieves all event sources.')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.get({ url: '/v1/eventSources?allOrganizations' })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '0.name', '1.name', '0.organizationId', '0.eventSourceTemplateId' ])
	.expectJsonCollectionToHaveSize(3)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('eventSourceId4'),
			name: 'iFLUX Thermometer first for second user',
			organizationId: this.getData('organizationId3'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1')
		}, {
			id: this.getData('eventSourceId5'),
			name: 'iFLUX Thermometer second for second user',
			organizationId: this.getData('organizationId3'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId3')
		}, {
			id: this.getData('eventSourceId6'),
			name: 'iFLUX Thermometer third for second user',
			organizationId: this.getData('organizationId3'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1')
		}];
	})

	.describe('Second user retrieves all event sources for his organization.')
	.get({}, function() { return { url: '/v1/eventSources?organizationId=' + this.getData('organizationId3') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '0.name', '1.name', '0.organizationId', '0.eventSourceTemplateId' ])
	.expectJsonCollectionToHaveSize(3)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('eventSourceId4'),
			name: 'iFLUX Thermometer first for second user',
			organizationId: this.getData('organizationId3'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1')
		}, {
			id: this.getData('eventSourceId5'),
			name: 'iFLUX Thermometer second for second user',
			organizationId: this.getData('organizationId3'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId3')
		}, {
			id: this.getData('eventSourceId6'),
			name: 'iFLUX Thermometer third for second user',
			organizationId: this.getData('organizationId3'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1')
		}];
	})

	.describe('Second user retrieves all event sources for his event source template.')
	.get({}, function() { return { url: '/v1/eventSources?eventSourceTemplateId=' + this.getData('eventSourceTemplateId3') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.eventSourceId', '0.name', '0.organizationId', '0.eventSourceTemplateId' ])
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('eventSourceId5'),
			name: 'iFLUX Thermometer second for second user',
			organizationId: this.getData('organizationId3'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId3')
		}];
	})

	.describe('First user tries to retrieve an event source that does not exist.')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.get({}, function() { return { url: this.getData('locationEventSource1') + '100' }; })
	.expectStatusCode(403)

	.describe('First user tries to retrieve an event source from an organization where he is not a member.')
	.get({}, function() { return { url: this.getData('locationEventSource4') }; })
	.expectStatusCode(403)

	.describe('First user retrieve his first event source.')
	.get({}, function() { return { url: this.getData('locationEventSource1') }; })
	.expectStatusCode(200)
	.expectJsonToBeAtLeast(function() {
		return {
			id: this.getData('eventSourceId1'),
			name: 'iFLUX Thermometer',
			organizationId: this.getData('organizationId2'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1'),
			configuration: {sensorId: 'amazingSensor'}
		};
	})

	.describe('First user updates his first event source.')
	.patch({}, function() {
		return {
			url: this.getData('locationEventSource1'),
			body: {
				name: 'iFLUX Thermometer renamed'
			}
		};
	})
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventSources/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('No update sent must let the resource unchanged')
	.patch({}, function() {
		return {
			url: this.getData('locationEventSource1'),
			body: {}
		};
	})
	.expectStatusCode(304)
	.expectLocationHeader('/v1/eventSources/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('First user updates the configuration his first event source.')
	.patch({}, function() {
		return {
			url: this.getData('locationEventSource1'),
			body: {
				configuration: {
					sensorId: 'HighTemperatureSensor'
				}
			}
		};
	})
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventSources/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('First user updates his first event source.')
	.get({}, function() {
		return {
			url: this.getData('locationEventSource1')
		};
	})
	.expectStatusCode(200)
	.expectJsonToBeAtLeast({
		name: 'iFLUX Thermometer renamed',
		configuration: {
			sensorId: 'HighTemperatureSensor'
		}
	})

	.describe('Second user tries to update the first event source of first user.')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.patch({}, function() {
		return {
			url: this.getData('locationEventSource1'),
			body: {
				name: 'iFLUX Thermometer renamed by second user'
			}
		};
	})
	.expectStatusCode(403)

	.describe('First user creates an event source with a configuration call to remote system.')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.mockRequest({
		method: 'POST',
		path: '/configure',
		body: {
			type: 'JSON'
		}
	}, {
		statusCode: 200,
		body: {
			type: 'JSON',
			value: JSON.stringify({ message: 'Configuration done.' })
		}
	}, {
		remainingTimes: 1,
		unlimited: 1
	})
	.post({ url: '/v1/eventSources' }, function() {
		return {
			body: {
				name: 'Source with configuration',
				organizationId: this.getData('organizationId1'),
				eventSourceTemplateId: this.getData('eventSourceTemplateId4'),
				configuration: {
					test: 'niceStoryBro'
				}
			}
		};
	})
	.storeLocationAs('eventSource', 1)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventSources/:id')
	.expectMockServerToHaveReceived(function() {
		return {
			method: 'POST',
			path: '/configure',
			body: {
				type: 'JSON',
				matchType: 'ONLY_MATCHING_FIELDS',
				value: JSON.stringify({
					properties: {
						test: 'niceStoryBro'
					}
				})
			}
		};
	})

	.describe('First user creates an event source with a configuration and a token call to remote system.')
	.mockRequest({
		method: 'POST',
		path: '/configure',
		body: {
			type: 'JSON'
		}
	}, {
		statusCode: 200,
		body: {
			type: 'JSON',
			value: JSON.stringify({ message: 'Configuration done.' })
		}
	}, {
		remainingTimes: 1,
		unlimited: 1
	})
	.post({ url: '/v1/eventSources' }, function() {
		return {
			body: {
				name: 'Source with configuration and token',
				organizationId: this.getData('organizationId1'),
				eventSourceTemplateId: this.getData('eventSourceTemplateId5'),
				configuration: {
					test: 'niceStoryBro'
				}
			}
		};
	})
	.storeLocationAs('eventSource', 6)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventSources/:id')
	.expectMockServerToHaveReceived(function() {
		return {
			method: 'POST',
			path: '/configure',
			headers: [{
				name: 'Authorization',
				values: [ 'bearer jwtToken' ]
			}],
			body: {
				type: 'JSON',
				matchType: 'ONLY_MATCHING_FIELDS',
				value: JSON.stringify({
					properties: {
						test: 'niceStoryBro'
					}
				})
			}
		};
	})

	.describe('First reconfigure an event source.')
	.mockRequest({
		method: 'POST',
		path: '/configure',
		body: {
			type: 'JSON'
		}
	}, {
		statusCode: 200,
		body: {
			type: 'JSON',
			value: JSON.stringify({ message: 'Configuration done.' })
		}
	}, {
		remainingTimes: 1,
		unlimited: 1
	})
	.post({}, function() {
		return {
			url: this.getData('locationEventSource6') + '/configure'
		};
	})
	.expectStatusCode(200)
	.expectMockServerToHaveReceived(function() {
		return {
			method: 'POST',
			path: '/configure',
			headers: [{
				name: 'Authorization',
				values: [ 'bearer jwtToken' ]
			}],
			body: {
				type: 'JSON',
				matchType: 'ONLY_MATCHING_FIELDS',
				value: JSON.stringify({
					properties: {
						test: 'niceStoryBro'
					}
				})
			}
		};
	})

	.describe('First tries to reconfigure an event source that has no configuration.')
	.post({}, function() {
		return {
			url: this.getData('locationEventSource2') + '/configure'
		};
	})
	.expectStatusCode(404)
;