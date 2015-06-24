var
	config = require('../../../config/config'),
	baseTest = require('../base');

module.exports = baseTest('Event source instance resource')
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

	.describe('First user tries to creates an event source instance in an organization he has no access.')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.post({	url: '/v1/eventSourceInstances' }, function() {
		return {
			body: {
				name: 'iFLUX Thermometer instance',
				organizationId: this.getData('organizationId3'),
				eventSourceTemplateId: this.getData('eventSourceTemplateId3')
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToHavePath('organizationId.0')
	.expectJsonToBe({ organizationId: [ 'No organization found.' ]})

	.describe('First user tries to create an event source instance from an event source template he has no access.')
	.post({	url: '/v1/eventSourceInstances' }, function() {
		return {
			body: {
				name: 'iFLUX Thermometer instance',
				organizationId: this.getData('organizationId1'),
				eventSourceTemplateId: this.getData('eventSourceTemplateId3')
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToHavePath('eventSourceTemplateId.0')
	.expectJsonToBe({ eventSourceTemplateId: [ 'No event source template found.' ]})

	.describe('First user tries to create an event source instance with a wrong configuration.')
	.post({ url: '/v1/eventSourceInstances' }, function() {
		return {
			body: {
				name: 'iFLUX Thermometer instance',
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

	.describe('First user creates a first event source instance for his second organization and first event source template.')
	.post({ url: '/v1/eventSourceInstances' }, function() {
		return {
			body: {
				name: 'iFLUX Thermometer instance',
				organizationId: this.getData('organizationId2'),
				eventSourceTemplateId: this.getData('eventSourceTemplateId1'),
				configuration: {
					sensorId: 'amazingSensor'
				}
			}
		};
	})
	.storeLocationAs('eventSourceInstance', 1)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventSourceInstances/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('First user creates a second event source instance for his second organization and second event source template.')
	.post({ url: '/v1/eventSourceInstances' }, function() {
		return {
			body: {
				name: 'iFLUX Thermometer second instance',
				organizationId: this.getData('organizationId2'),
				eventSourceTemplateId: this.getData('eventSourceTemplateId2')
			}
		};
	})
	.storeLocationAs('eventSourceInstance', 2)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventSourceInstances/:id')

	.describe('First user tries to create a third event source instance for his first organization and second event source template.')
	.post({ url: '/v1/eventSourceInstances' }, function() {
		return {
			body: {
				name: 'iFLUX Thermometer third instance',
				organizationId: this.getData('organizationId1'),
				eventSourceTemplateId: this.getData('eventSourceTemplateId2')
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToHavePath('eventSourceTemplateId.0')
	.expectJsonToBe({ eventSourceTemplateId: [ 'No event source template found.' ]})

	.describe('First user creates a third event source instance for his first organization and first event source template.')
	.post({ url: '/v1/eventSourceInstances' }, function() {
		return {
			body: {
				name: 'iFLUX Thermometer third instance',
				organizationId: this.getData('organizationId1'),
				eventSourceTemplateId: this.getData('eventSourceTemplateId1')
			}
		};
	})
	.storeLocationAs('eventSourceInstance', 3)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventSourceInstances/:id')

	.describe('Second user creates a first event source instance for his organization and first event source template.')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.post({ url: '/v1/eventSourceInstances' }, function() {
		return {
			body: {
				name: 'iFLUX Thermometer first instance for second user',
				organizationId: this.getData('organizationId3'),
				eventSourceTemplateId: this.getData('eventSourceTemplateId1')
			}
		};
	})
	.storeLocationAs('eventSourceInstance', 4)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventSourceInstances/:id')

	.describe('Second user creates a second event source instance for his organization and third event source template.')
	.post({ url: '/v1/eventSourceInstances' }, function() {
		return {
			body: {
				name: 'iFLUX Thermometer second instance for second user',
				organizationId: this.getData('organizationId3'),
				eventSourceTemplateId: this.getData('eventSourceTemplateId3')
			}
		};
	})
	.storeLocationAs('eventSourceInstance', 5)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventSourceInstances/:id')

	.describe('First user tries to retrieve event source instances.')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.get({ url: '/v1/eventSourceInstances' })
	.expectStatusCode(422)
	.expectJsonToHavePath([ 'eventSourceTemplateId', 'organizationId', 'allOrganizations' ])
	.expectJsonToBe({
		eventSourceTemplateId: [ 'Event source template id should be provided.' ],
		organizationId: [ 'Organization id should be provided.' ],
		allOrganizations: [ 'allOrganizations should be provided.' ]
	})

	.describe('First user tries to mix different way to retrieve event source instances (eventSourceTemplateId is used).')
	.get({}, function() {
		return {
			url: '/v1/eventSourceInstances?allOrganizations&organizationId=' +
				this.getData('organizationId1') +
				'&eventSourceTemplateId=' +
				this.getData('eventSourceTemplateId1')
		};
	})
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('eventSourceInstanceId1'),
			organizationId: this.getData('organizationId2'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1')
		}, {
			id: this.getData('eventSourceInstanceId3'),
			organizationId: this.getData('organizationId1'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1')
		}];
	})

	.describe('First user tries to mix different way to retrieve event source instances (organizationId is used).')
	.get({}, function() { return { url: '/v1/eventSourceInstances?allOrganizations&organizationId=' + this.getData('organizationId1') }; })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('eventSourceInstanceId3'),
			organizationId: this.getData('organizationId1'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1')
		}];
	})

	.describe('First user retrieves all event source instances.')
	.get({ url: '/v1/eventSourceInstances?allOrganizations' })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '2.id', '0.name', '1.name', '2.name', '0.organizationId', '0.eventSourceTemplateId' ])
	.expectJsonCollectionToHaveSize(3)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('eventSourceInstanceId1'),
			name: 'iFLUX Thermometer instance',
			organizationId: this.getData('organizationId2'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1'),
			configuration: {
				sensorId: 'amazingSensor'
			}
		}, {
			id: this.getData('eventSourceInstanceId2'),
			name: 'iFLUX Thermometer second instance',
			organizationId: this.getData('organizationId2'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId2')
		}, {
			id: this.getData('eventSourceInstanceId3'),
			name: 'iFLUX Thermometer third instance',
			organizationId: this.getData('organizationId1'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1')
		}];
	})

	.describe('First user retrieves all event source instances filtered by name.')
	.get({ url: '/v1/eventSourceInstances?allOrganizations&name=%25er instance' })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('eventSourceInstanceId1'),
			name: 'iFLUX Thermometer instance',
			organizationId: this.getData('organizationId2'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1'),
			configuration: {
				sensorId: 'amazingSensor'
			}
		}];
	})

	.describe('First user retrieves all event source instances for his first organization.')
	.get({}, function() { return { url: '/v1/eventSourceInstances?organizationId=' + this.getData('organizationId1') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.name', '0.organizationId', '0.eventSourceTemplateId' ])
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('eventSourceInstanceId3'),
			name: 'iFLUX Thermometer third instance',
			organizationId: this.getData('organizationId1'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1')
		}];
	})

	.describe('First user retrieves all event source instances for his second organization filtered by name.')
	.get({}, function() { return { url: '/v1/eventSourceInstances?organizationId=' + this.getData('organizationId2') + '&name=%second%'}; })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('eventSourceInstanceId2'),
			name: 'iFLUX Thermometer second instance',
			organizationId: this.getData('organizationId2'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId2')
		}];
	})

	.describe('First user retrieves all event source instances for his second organization.')
	.get({}, function() { return { url: '/v1/eventSourceInstances?organizationId=' + this.getData('organizationId2') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '0.name', '1.name', '0.organizationId', '0.eventSourceTemplateId', '0.configuration' ])
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('eventSourceInstanceId1'),
			name: 'iFLUX Thermometer instance',
			organizationId: this.getData('organizationId2'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1'),
			configuration: {sensorId: 'amazingSensor'}
		}, {
			id: this.getData('eventSourceInstanceId2'),
			name: 'iFLUX Thermometer second instance',
			organizationId: this.getData('organizationId2'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId2')
		}];
	})

	.describe('First user retrieves all event source instances for his first event source template.')
	.get({}, function() { return { url: '/v1/eventSourceInstances?eventSourceTemplateId=' + this.getData('eventSourceTemplateId1') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '0.name', '1.name', '0.organizationId', '0.eventSourceTemplateId', '0.configuration' ])
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('eventSourceInstanceId1'),
			name: 'iFLUX Thermometer instance',
			organizationId: this.getData('organizationId2'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1'),
			configuration: {sensorId: 'amazingSensor'}
		}, {
			id: this.getData('eventSourceInstanceId3'),
			name: 'iFLUX Thermometer third instance',
			organizationId: this.getData('organizationId1'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1')
		}];
	})

	.describe('First user retrieves all event source instances for his first event source template filtered by name.')
	.get({}, function() { return { url: '/v1/eventSourceInstances?eventSourceTemplateId=' + this.getData('eventSourceTemplateId1') + '&name=%third%' }; })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('eventSourceInstanceId3'),
			name: 'iFLUX Thermometer third instance',
			organizationId: this.getData('organizationId1'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1')
		}];
	})

	.describe('First user retrieves all event source instances for his second event source template.')
	.get({}, function() { return { url: '/v1/eventSourceInstances?eventSourceTemplateId=' + this.getData('eventSourceTemplateId2') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.name', '0.organizationId', '0.eventSourceTemplateId' ])
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('eventSourceInstanceId2'),
			name: 'iFLUX Thermometer second instance',
			organizationId: this.getData('organizationId2'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId2')
		}];
	})

	.describe('Second user retrieves all event source instances.')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.get({ url: '/v1/eventSourceInstances?allOrganizations' })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '0.name', '1.name', '0.organizationId', '0.eventSourceTemplateId' ])
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('eventSourceInstanceId4'),
			name: 'iFLUX Thermometer first instance for second user',
			organizationId: this.getData('organizationId3'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1')
		}, {
			id: this.getData('eventSourceInstanceId5'),
			name: 'iFLUX Thermometer second instance for second user',
			organizationId: this.getData('organizationId3'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId3')
		}];
	})

	.describe('Second user retrieves all event source instances for his organization.')
	.get({}, function() { return { url: '/v1/eventSourceInstances?organizationId=' + this.getData('organizationId3') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '0.name', '1.name', '0.organizationId', '0.eventSourceTemplateId' ])
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('eventSourceInstanceId4'),
			name: 'iFLUX Thermometer first instance for second user',
			organizationId: this.getData('organizationId3'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1')
		}, {
			id: this.getData('eventSourceInstanceId5'),
			name: 'iFLUX Thermometer second instance for second user',
			organizationId: this.getData('organizationId3'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId3')
		}];
	})

	.describe('Second user retrieves all event source instances for his event source template.')
	.get({}, function() { return { url: '/v1/eventSourceInstances?eventSourceTemplateId=' + this.getData('eventSourceTemplateId3') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.eventSourceInstanceId', '0.name', '0.organizationId', '0.eventSourceTemplateId' ])
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('eventSourceInstanceId5'),
			name: 'iFLUX Thermometer second instance for second user',
			organizationId: this.getData('organizationId3'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId3')
		}];
	})

	.describe('First user tries to retrieve an event source instance that does not exist.')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.get({}, function() { return { url: this.getData('locationEventSourceInstance1') + '100' }; })
	.expectStatusCode(403)

	.describe('First user tries to retrieve an event source instance from an organization where he is not a member.')
	.get({}, function() { return { url: this.getData('locationEventSourceInstance4') }; })
	.expectStatusCode(403)

	.describe('First user retrieve his first event source instance.')
	.get({}, function() { return { url: this.getData('locationEventSourceInstance1') }; })
	.expectStatusCode(200)
	.expectJsonToBeAtLeast(function() {
		return {
			id: this.getData('eventSourceInstanceId1'),
			name: 'iFLUX Thermometer instance',
			organizationId: this.getData('organizationId2'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1'),
			configuration: {sensorId: 'amazingSensor'}
		};
	})

	.describe('First user updates hist first event source instance.')
	.patch({}, function() {
		return {
			url: this.getData('locationEventSourceInstance1'),
			body: {
				name: 'iFLUX Thermometer instance renamed'
			}
		};
	})
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventSourceInstances/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('No update sent must let the resource unchanged')
	.patch({}, function() {
		return {
			url: this.getData('locationEventSourceInstance1'),
			body: {}
		};
	})
	.expectStatusCode(304)
	.expectLocationHeader('/v1/eventSourceInstances/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('Second user tries to update the first event source instance of first user.')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.patch({}, function() {
		return {
			url: this.getData('locationEventSourceInstance1'),
			body: {
				name: 'iFLUX Thermometer instance renamed by second user'
			}
		};
	})
	.expectStatusCode(403)

	.describe('First user creates an event source instance with a configuration call to remote system.')
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
	.post({ url: '/v1/eventSourceInstances' }, function() {
		return {
			body: {
				name: 'Instance with configuration',
				organizationId: this.getData('organizationId1'),
				eventSourceTemplateId: this.getData('eventSourceTemplateId4'),
				configuration: {
					test: 'niceStoryBro'
				}
			}
		};
	})
	.storeLocationAs('eventSourceInstance', 1)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventSourceInstances/:id')
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

	.describe('First user creates an event source instance with a configuration and a token call to remote system.')
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
	.post({ url: '/v1/eventSourceInstances' }, function() {
		return {
			body: {
				name: 'Instance with configuration and token',
				organizationId: this.getData('organizationId1'),
				eventSourceTemplateId: this.getData('eventSourceTemplateId5'),
				configuration: {
					test: 'niceStoryBro'
				}
			}
		};
	})
	.storeLocationAs('eventSourceInstance', 6)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventSourceInstances/:id')
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

	.describe('First reconfigure an event source instance.')
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
			url: this.getData('locationEventSourceInstance6') + '/configure'
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

	.describe('First tries to reconfigure an event source instance that has no configuration.')
	.post({}, function() {
		return {
			url: this.getData('locationEventSourceInstance2') + '/configure'
		};
	})
	.expectStatusCode(404)
;