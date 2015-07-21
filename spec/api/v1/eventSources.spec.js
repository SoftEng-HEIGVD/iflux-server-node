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
				eventSourceTemplateId: this.getData('eventSourceTemplateId1'),
				configuration: {
					sensorId: 'sensorIdForES1'
				}
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToHavePath('name.0')
	.expectJsonToBe({ name: [ 'The name must be at least 3 characters long' ]})

	.describe('First user tries to creates ES1 event source in an organization he has no access.')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.post({	url: '/v1/eventSources' }, function() {
		return {
			body: {
				name: 'ES1',
				organizationId: this.getData('organizationId3'),
				eventSourceTemplateId: this.getData('eventSourceTemplateId3'),
				configuration: {
					sensorId: 'sensorIdForES1'
				}
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToHavePath('organizationId.0')
	.expectJsonToBe({ organizationId: [ 'No organization found.' ]})

	.describe('First user tries to create ES1 event source from an event source template he has no access.')
	.post({	url: '/v1/eventSources' }, function() {
		return {
			body: {
				name: 'ES1',
				organizationId: this.getData('organizationId1'),
				eventSourceTemplateId: this.getData('eventSourceTemplateId3'),
				configuration: {
					sensorId: 'sensorIdForES1'
				}
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToHavePath('eventSourceTemplateId.0')
	.expectJsonToBe({ eventSourceTemplateId: [ 'No event source template found.' ]})

	.describe('First user tries to create ES1 event source with a wrong configuration.')
	.post({ url: '/v1/eventSources' }, function() {
		return {
			body: {
				name: 'ES1',
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

	.describe('First user tries to create ES1 event source without configuration.')
	.post({ url: '/v1/eventSources' }, function() {
		return {
			body: {
				name: 'ES1',
				organizationId: this.getData('organizationId1'),
				eventSourceTemplateId: this.getData('eventSourceTemplateId1')
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToHavePath('configuration')
	.expectJsonToBe({ configuration: [ 'The event source template requires an event source configured.' ] })

	.describe('First user creates ES1 event source for his second organization and first event source template.')
	.post({ url: '/v1/eventSources' }, function() {
		return {
			body: {
				name: 'ES1',
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

	.describe('First user tries to re-create ES1 event source.')
	.post({ url: '/v1/eventSources' }, function() {
		return {
			body: {
				name: 'ES1',
				organizationId: this.getData('organizationId2'),
				eventSourceTemplateId: this.getData('eventSourceTemplateId1'),
				configuration: {
					sensorId: 'amazingSensor'
				}
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToHavePath('name')
	.expectJsonToBe({ name: [ "Name is already taken for this event source template and this organization." ] })

	.describe('First user tries to re-create ES1 event source but in a different event source template.')
	.post({ url: '/v1/eventSources' }, function() {
		return {
			body: {
				name: 'ES1',
				organizationId: this.getData('organizationId2'),
				eventSourceTemplateId: this.getData('eventSourceTemplateId2'),
				configuration: {
					sensorId: 'sensorIdForES1'
				}
			}
		};
	})
	.storeLocationAs('eventSource', 100)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventSources/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('First user tries to re-create ES1 event source but in a different organization.')
	.post({ url: '/v1/eventSources' }, function() {
		return {
			body: {
				name: 'ES1',
				organizationId: this.getData('organizationId1'),
				eventSourceTemplateId: this.getData('eventSourceTemplateId1'),
				configuration: {
					sensorId: 'sensorIdForES1'
				}
			}
		};
	})
	.storeLocationAs('eventSource', 101)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventSources/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('First user creates ES2 event source for his second organization and second event source template.')
	.post({ url: '/v1/eventSources' }, function() {
		return {
			body: {
				name: 'ES2',
				organizationId: this.getData('organizationId2'),
				eventSourceTemplateId: this.getData('eventSourceTemplateId2')
			}
		};
	})
	.storeLocationAs('eventSource', 2)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventSources/:id')

	.describe('First user tries to create ES3 event source for his first organization and second event source template.')
	.post({ url: '/v1/eventSources' }, function() {
		return {
			body: {
				name: 'ES3',
				organizationId: this.getData('organizationId1'),
				eventSourceTemplateId: this.getData('eventSourceTemplateId2')
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToHavePath('eventSourceTemplateId.0')
	.expectJsonToBe({ eventSourceTemplateId: [ 'No event source template found.' ]})

	.describe('First user creates ES3 event source for his first organization and first event source template.')
	.post({ url: '/v1/eventSources' }, function() {
		return {
			body: {
				name: 'ES3',
				organizationId: this.getData('organizationId1'),
				eventSourceTemplateId: this.getData('eventSourceTemplateId1'),
				configuration: {
					sensorId: 'sensorIdForES3'
				}
			}
		};
	})
	.storeLocationAs('eventSource', 3)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventSources/:id')

	.describe('Second user creates ES4 event source for his organization and first event source template.')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.post({ url: '/v1/eventSources' }, function() {
		return {
			body: {
				name: 'ES4',
				organizationId: this.getData('organizationId3'),
				eventSourceTemplateId: this.getData('eventSourceTemplateId1'),
				configuration: {
					sensorId: 'sensorIdForES4'
				}
			}
		};
	})
	.storeLocationAs('eventSource', 4)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventSources/:id')

	.describe('Second user creates ES5 event source for his organization and third event source template.')
	.post({ url: '/v1/eventSources' }, function() {
		return {
			body: {
				name: 'ES5',
				organizationId: this.getData('organizationId3'),
				eventSourceTemplateId: this.getData('eventSourceTemplateId3')
			}
		};
	})
	.storeLocationAs('eventSource', 5)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventSources/:id')

	.describe('Second user creates ES6 event source for his organization and template in a different organization.')
	.post({ url: '/v1/eventSources' }, function() {
		return {
			body: {
				name: 'ES6',
				organizationId: this.getData('organizationId3'),
				eventSourceTemplateId: this.getData('eventSourceTemplateId1'),
				configuration: {
					sensorId: 'sensorIdForES6'
				}
			}
		};
	})
	.storeLocationAs('eventSource', 6)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventSources/:id')

	.describe('Second user retrieve ES6 event source.')
	.get({}, function() { return { url: '/v1/eventSources?name=%6&eventSourceTemplateId=' + this.getData('eventSourceTemplateId1') }; })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'ES6',
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
	.expectJsonCollectionToHaveSize(3)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('eventSourceId1'),
			name: 'ES1',
			organizationId: this.getData('organizationId2'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1')
		}, {
			id: this.getData('eventSourceId3'),
			name: 'ES3',
			organizationId: this.getData('organizationId1'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1')
		}, {
			id: this.getData('eventSourceId101'),
			name: 'ES1',
			organizationId: this.getData('organizationId1'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1')
		}];
	})

	.describe('First user tries to mix different way to retrieve event sources (organizationId is used).')
	.get({}, function() { return { url: '/v1/eventSources?allOrganizations&organizationId=' + this.getData('organizationId1') }; })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('eventSourceId3'),
			name: 'ES3',
			organizationId: this.getData('organizationId1'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1')
		}, {
			id: this.getData('eventSourceId101'),
			name: 'ES1',
			organizationId: this.getData('organizationId1'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1')
		}];
	})

	.describe('First user retrieves all event sources.')
	.get({ url: '/v1/eventSources?allOrganizations' })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '2.id', '0.name', '1.name', '2.name', '0.organizationId', '0.eventSourceTemplateId' ])
	.expectJsonCollectionToHaveSize(5)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('eventSourceId1'),
			name: 'ES1',
			organizationId: this.getData('organizationId2'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1'),
			configuration: {
				sensorId: 'amazingSensor'
			}
		}, {
			id: this.getData('eventSourceId2'),
			name: 'ES2',
			organizationId: this.getData('organizationId2'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId2')
		}, {
			id: this.getData('eventSourceId3'),
			name: 'ES3',
			organizationId: this.getData('organizationId1'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1')
		}, {
			id: this.getData('eventSourceId100'),
			name: 'ES1',
			organizationId: this.getData('organizationId2'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId2')
		}, {
			id: this.getData('eventSourceId101'),
			name: 'ES1',
			organizationId: this.getData('organizationId1'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1')
		}];
	})

	.describe('First user retrieves all event sources filtered by name.')
	.get({ url: '/v1/eventSources?allOrganizations&name=%1' })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(3)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('eventSourceId1'),
			name: 'ES1',
			organizationId: this.getData('organizationId2'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1'),
			configuration: {
				sensorId: 'amazingSensor'
			}
		}, {
			id: this.getData('eventSourceId100'),
			name: 'ES1',
			organizationId: this.getData('organizationId2'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId2')
		}, {
			id: this.getData('eventSourceId101'),
			name: 'ES1',
			organizationId: this.getData('organizationId1'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1')
		}];
	})

	.describe('First user retrieves all event sources for his first organization.')
	.get({}, function() { return { url: '/v1/eventSources?organizationId=' + this.getData('organizationId1') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.name', '0.organizationId', '0.eventSourceTemplateId' ])
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('eventSourceId3'),
			name: 'ES3',
			organizationId: this.getData('organizationId1'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1')
		}, {
			id: this.getData('eventSourceId101'),
			name: 'ES1',
			organizationId: this.getData('organizationId1'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1')
		}];
	})

	.describe('First user retrieves all event sources for his second organization.')
	.get({}, function() { return { url: '/v1/eventSources?organizationId=' + this.getData('organizationId2') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '0.name', '1.name', '0.organizationId', '0.eventSourceTemplateId', '0.configuration' ])
	.expectJsonCollectionToHaveSize(3)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('eventSourceId1'),
			name: 'ES1',
			organizationId: this.getData('organizationId2'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1'),
			configuration: {sensorId: 'amazingSensor'}
		}, {
			id: this.getData('eventSourceId2'),
			name: 'ES2',
			organizationId: this.getData('organizationId2'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId2')
		}, {
			id: this.getData('eventSourceId100'),
			name: 'ES1',
			organizationId: this.getData('organizationId2'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId2')
		}];
	})

	.describe('First user retrieves all event sources for his second organization filtered by name.')
	.get({}, function() { return { url: '/v1/eventSources?organizationId=' + this.getData('organizationId2') + '&name=%2'}; })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('eventSourceId2'),
			name: 'ES2',
			organizationId: this.getData('organizationId2'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId2')
		}];
	})


	.describe('First user retrieves all event sources for his first event source template.')
	.get({}, function() { return { url: '/v1/eventSources?eventSourceTemplateId=' + this.getData('eventSourceTemplateId1') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '0.name', '1.name', '0.organizationId', '0.eventSourceTemplateId' ])
	.expectJsonCollectionToHaveSize(3)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('eventSourceId1'),
			name: 'ES1',
			organizationId: this.getData('organizationId2'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1'),
			configuration: {sensorId: 'amazingSensor'}
		}, {
			id: this.getData('eventSourceId3'),
			name: 'ES3',
			organizationId: this.getData('organizationId1'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1')
		}, {
			id: this.getData('eventSourceId101'),
			name: 'ES1',
			organizationId: this.getData('organizationId1'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1')
		}];
	})

	.describe('First user retrieves all event sources for his first event source template filtered by name.')
	.get({}, function() { return { url: '/v1/eventSources?eventSourceTemplateId=' + this.getData('eventSourceTemplateId1') + '&name=%3' }; })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('eventSourceId3'),
			name: 'ES3',
			organizationId: this.getData('organizationId1'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1')
		}];
	})

	.describe('First user retrieves all event sources for his second event source template.')
	.get({}, function() { return { url: '/v1/eventSources?eventSourceTemplateId=' + this.getData('eventSourceTemplateId2') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.name', '0.organizationId', '0.eventSourceTemplateId' ])
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('eventSourceId2'),
			name: 'ES2',
			organizationId: this.getData('organizationId2'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId2')
		}, {
			id: this.getData('eventSourceId100'),
			name: 'ES1',
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
			name: 'ES4',
			organizationId: this.getData('organizationId3'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1')
		}, {
			id: this.getData('eventSourceId5'),
			name: 'ES5',
			organizationId: this.getData('organizationId3'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId3')
		}, {
			id: this.getData('eventSourceId6'),
			name: 'ES6',
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
			name: 'ES4',
			organizationId: this.getData('organizationId3'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1')
		}, {
			id: this.getData('eventSourceId5'),
			name: 'ES5',
			organizationId: this.getData('organizationId3'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId3')
		}, {
			id: this.getData('eventSourceId6'),
			name: 'ES6',
			organizationId: this.getData('organizationId3'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1')
		}];
	})

	.describe('Second user retrieves all event sources for his event source template.')
	.get({}, function() { return { url: '/v1/eventSources?eventSourceTemplateId=' + this.getData('eventSourceTemplateId3') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.generatedIdentifier', '0.name', '0.organizationId', '0.eventSourceTemplateId' ])
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('eventSourceId5'),
			name: 'ES5',
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

	.describe('First user retrieve ES1 (1) event source.')
	.get({}, function() { return { url: this.getData('locationEventSource1') }; })
	.expectStatusCode(200)
	.expectJsonToBeAtLeast(function() {
		return {
			id: this.getData('eventSourceId1'),
			name: 'ES1',
			organizationId: this.getData('organizationId2'),
			eventSourceTemplateId: this.getData('eventSourceTemplateId1'),
			configuration: {
				sensorId: 'amazingSensor'
			}
		};
	})

	.describe('First user updates ES1 (1) event source.')
	.patch({}, function() {
		return {
			url: this.getData('locationEventSource1'),
			body: {
				name: 'ES1 renamed'
			}
		};
	})
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventSources/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('ES1 not updated should let it unchanged.')
	.patch({}, function() {
		return {
			url: this.getData('locationEventSource1'),
			body: {}
		};
	})
	.expectStatusCode(304)
	.expectLocationHeader('/v1/eventSources/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('First user updates the configuration ES1 (1) event source.')
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

	.describe('Check ES1 (1) event source has been correctly updated.')
	.get({}, function() {
		return {
			url: this.getData('locationEventSource1')
		};
	})
	.expectStatusCode(200)
	.expectJsonToBeAtLeast({
		name: 'ES1 renamed',
		configuration: {
			sensorId: 'HighTemperatureSensor'
		}
	})

	.describe('First user updates ES1 (100) event source with a name used by ES2.')
	.patch({}, function() {
		return {
			url: this.getData('locationEventSource100'),
			body: {
				name: 'ES2'
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ name: [ 'Name is already taken for this event source template and this organization.' ]})

	.describe('First user updates ES1 (100) event source with a name used by ES3.')
	.patch({}, function() {
		return {
			url: this.getData('locationEventSource100'),
			body: {
				name: 'ES3'
			}
		};
	})
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventSources/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('First user updates ES1 (100) event source with a name used by ES1 (1).')
	.patch({}, function() {
		return {
			url: this.getData('locationEventSource100'),
			body: {
				name: 'ES1 renamed'
			}
		};
	})
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventSources/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('Second user tries to update ES1 event source of first user.')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.patch({}, function() {
		return {
			url: this.getData('locationEventSource1'),
			body: {
				name: 'ES1 renamed again'
			}
		};
	})
	.expectStatusCode(403)

	.describe('First user creates ES7 event source with a configuration call to remote system.')
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
				name: 'ES7',
				organizationId: this.getData('organizationId1'),
				eventSourceTemplateId: this.getData('eventSourceTemplateId4'),
				configuration: {
					test: 'niceStoryBro'
				}
			}
		};
	})
	.storeLocationAs('eventSource', 200)
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

	.describe('First user creates ES8 event source with a configuration and a token call to remote system.')
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
	.storeLocationAs('eventSource', 201)
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

	.describe('First user updates ES8 event source with a configuration and a token call to remote system.')
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
	.patch({ }, function() {
		return {
			url: this.getData('locationEventSource201'),
			body: {
				configuration: {
					test: 'configuration updated'
				}
			}
		};
	})
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
						test: 'configuration updated'
					}
				})
			}
		};
	})

	.describe('First reconfigure ES8 event source.')
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
			url: this.getData('locationEventSource201') + '/configure'
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

	.describe('First tries to reconfigure ES2 event source that has no configuration.')
	.post({}, function() {
		return {
			url: this.getData('locationEventSource2') + '/configure'
		};
	})
	.expectStatusCode(404)

  .describe('First user remove ES1.')
 	.delete({}, function() { return { url: this.getData('locationEventSource1') }; })
 	.expectStatusCode(204)

 	.describe('First user tries to retrieve ES1.')
 	.get({}, function() { return { url: this.getData('locationEventSource1') }; })
 	.expectStatusCode(403)

 	.describe('First user tries to delete ES4 in an organization where he is not a member.')
 	.get({}, function() { return { url: this.getData('locationEventSource4') }; })
 	.expectStatusCode(403)
;