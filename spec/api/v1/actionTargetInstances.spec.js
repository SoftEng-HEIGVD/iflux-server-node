var
	config = require('../../../config/config'),
	baseTest = require('../base');

module.exports = baseTest('Action target instance resource')
	.createUser('Register first user')
	.createUser('Register second user', { lastName: 'Dutoit', email: 'henri.dutoit@localhost.localdomain' })
	.signinUser('Signing first user')
	.signinUser('Signing first user', { email: 'henri.dutoit@localhost.localdomain' })
	.createOrganization('Create new organization for first user', { name: 'Orga 1' }, 1, 1)
	.createOrganization('Create second organization for first user', { name: 'Orga 2' }, 1, 2)
	.createOrganization('Create new organization for second user', { name: 'Orga 3' }, 2, 3)
	.createActionTargetTemplate('Create first action target template for first user', {
		name: 'Action target template 1',
		public: true,
		configuration: {
			schema: {
				$schema: "http://json-schema.org/draft-04/schema#",
				type: "object",
				properties: {
					botId: {
						type: "string"
					}
				},
				"additionalProperties": false,
				"required": [ "botId" ]
			}
		}
	}, 1, 1 )
	.createActionTargetTemplate('Create second action target template for first user', { name: 'Action target template 2', public: false }, 1, 2 )
	.createActionTargetTemplate('Create first action target template for second user', { name: 'Action target template 3', public: false }, 2, 3 )

	.createActionTargetTemplate('Create action target template with url for first user', {
		name: 'Action target template with url',
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
	}, 1, 1 )

	.createActionTargetTemplate('Create action target template with url and token for first user', {
		name: 'Action target template with url and token',
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
	}, 1, 1 )

	.describe('First user tries to creates an action target instance in an organization he has no access.')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.post({	url: '/v1/actionTargetInstances' }, function() {
		return {
			body: {
				name: 'Slack Message target',
				organizationId: this.getData('organizationId3'),
				actionTargetTemplateId: this.getData('actionTargetTemplateId3')
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToHavePath('organizationId.0')
	.expectJsonToBe({ organizationId: [ 'No organization found.' ]})

	.describe('First user tries to create an action target instance from an action target template he has no access.')
	.post({	url: '/v1/actionTargetInstances' }, function() {
		return {
			body: {
				name: 'Slack Message target',
				organizationId: this.getData('organizationId1'),
				actionTargetTemplateId: this.getData('actionTargetTemplateId3')
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToHavePath('actionTargetTemplateId.0')
	.expectJsonToBe({ actionTargetTemplateId: [ 'No action target template found.' ]})

	.describe('First user tries to create an action target instance with a wrong configuration.')
	.post({ url: '/v1/actionTargetInstances' }, function() {
		return {
			body: {
				name: 'Slack Message target',
				organizationId: this.getData('organizationId1'),
				actionTargetTemplateId: this.getData('actionTargetTemplateId1'),
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
		botId: [ "requires property \"botId\"" ]
	}]})

	.describe('First user creates a first action target instance for his second organization and first action target template.')
	.post({ url: '/v1/actionTargetInstances' }, function() {
		return {
			body: {
				name: 'Slack Message target',
				organizationId: this.getData('organizationId2'),
				actionTargetTemplateId: this.getData('actionTargetTemplateId1'),
				configuration: {
					botId: 'amazingSensor'
				}
			}
		};
	})
	.storeLocationAs('actionTargetInstance', 1)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTargetInstances/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('First user creates a second action target instance for his second organization and second action target template.')
	.post({ url: '/v1/actionTargetInstances' }, function() {
		return {
			body: {
				name: 'Slack Message second target',
				organizationId: this.getData('organizationId2'),
				actionTargetTemplateId: this.getData('actionTargetTemplateId2')
			}
		};
	})
	.storeLocationAs('actionTargetInstance', 2)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTargetInstances/:id')

	.describe('First user tries to create a third action target instance for his first organization and second action target template.')
	.post({ url: '/v1/actionTargetInstances' }, function() {
		return {
			body: {
				name: 'Slack Message third target',
				organizationId: this.getData('organizationId1'),
				actionTargetTemplateId: this.getData('actionTargetTemplateId2')
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToHavePath('actionTargetTemplateId.0')
	.expectJsonToBe({ actionTargetTemplateId: [ 'No action target template found.' ]})

	.describe('First user creates a third action target instance for his first organization and first action target template.')
	.post({ url: '/v1/actionTargetInstances' }, function() {
		return {
			body: {
				name: 'Slack Message third target',
				organizationId: this.getData('organizationId1'),
				actionTargetTemplateId: this.getData('actionTargetTemplateId1')
			}
		};
	})
	.storeLocationAs('actionTargetInstance', 3)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTargetInstances/:id')

	.describe('Second user creates a first action target instance for his organization and first action target template.')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.post({ url: '/v1/actionTargetInstances' }, function() {
		return {
			body: {
				name: 'Slack Message first target for second user',
				organizationId: this.getData('organizationId3'),
				actionTargetTemplateId: this.getData('actionTargetTemplateId1')
			}
		};
	})
	.storeLocationAs('actionTargetInstance', 4)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTargetInstances/:id')

	.describe('Second user creates a second action target instance for his organization and third action target template.')
	.post({ url: '/v1/actionTargetInstances' }, function() {
		return {
			body: {
				name: 'Slack Message second target for second user',
				organizationId: this.getData('organizationId3'),
				actionTargetTemplateId: this.getData('actionTargetTemplateId3')
			}
		};
	})
	.storeLocationAs('actionTargetInstance', 5)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTargetInstances/:id')

	.describe('First user tries to retrieve action target instances.')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.get({ url: '/v1/actionTargetInstances' })
	.expectStatusCode(422)
	.expectJsonToHavePath([ 'actionTargetTemplateId', 'organizationId', 'allOrganizations' ])
	.expectJsonToBe({
		actionTargetTemplateId: [ 'Action target template id should be provided.' ],
		organizationId: [ 'Organization id should be provided.' ],
		allOrganizations: [ 'allOrganizations should be provided.' ]
	})

	.describe('First user tries to mix different way to retrieve action target instances (actionTargetTemplateId is used).')
	.get({}, function() {
		return {
			url: '/v1/actionTargetInstances?allOrganizations&organizationId=' +
				this.getData('organizationId1') +
				'&actionTargetTemplateId=' +
				this.getData('actionTargetTemplateId1')
		};
	})
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('actionTargetInstanceId1'),
			organizationId: this.getData('organizationId2'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1')
		}, {
			id: this.getData('actionTargetInstanceId3'),
			organizationId: this.getData('organizationId1'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1')
		}];
	})

	.describe('First user tries to mix different way to retrieve action target instances (organizationId is used).')
	.get({}, function() { return { url: '/v1/actionTargetInstances?allOrganizations&organizationId=' + this.getData('organizationId1') }; })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('actionTargetInstanceId3'),
			organizationId: this.getData('organizationId1'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1')
		}];
	})

	.describe('First user retrieves all action target instances.')
	.get({ url: '/v1/actionTargetInstances?allOrganizations' })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '2.id', '0.name', '1.name', '2.name', '0.organizationId', '0.actionTargetTemplateId' ])
	.expectJsonCollectionToHaveSize(3)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('actionTargetInstanceId1'),
			name: 'Slack Message target',
			organizationId: this.getData('organizationId2'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1'),
			configuration: { botId: 'amazingSensor' }
		}, {
			id: this.getData('actionTargetInstanceId2'),
			name: 'Slack Message second target',
			organizationId: this.getData('organizationId2'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId2')
		}, {
			id: this.getData('actionTargetInstanceId3'),
			name: 'Slack Message third target',
			organizationId: this.getData('organizationId1'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1')
		}];
	})

	.describe('First user retrieves all action target instances filtered by name.')
	.get({ url: '/v1/actionTargetInstances?allOrganizations&name=Slack Message target' })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('actionTargetInstanceId1'),
			name: 'Slack Message target',
			organizationId: this.getData('organizationId2'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1'),
			configuration: { botId: 'amazingSensor' }
		}];
	})

	.describe('First user retrieves all action target instances for his first organization.')
	.get({}, function() { return { url: '/v1/actionTargetInstances?organizationId=' + this.getData('organizationId1') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.name', '0.organizationId', '0.actionTargetTemplateId' ])
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('actionTargetInstanceId3'),
			name: 'Slack Message third target',
			organizationId: this.getData('organizationId1'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1')
		}];
	})

	.describe('First user retrieves all action target instances for his second organization.')
	.get({}, function() { return { url: '/v1/actionTargetInstances?organizationId=' + this.getData('organizationId2') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '0.name', '1.name', '0.organizationId', '0.actionTargetTemplateId', '0.configuration' ])
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('actionTargetInstanceId1'),
			name: 'Slack Message target',
			organizationId: this.getData('organizationId2'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1'),
			configuration: {botId: 'amazingSensor'}
		}, {
			id: this.getData('actionTargetInstanceId2'),
			name: 'Slack Message second target',
			organizationId: this.getData('organizationId2'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId2')
		}];
	})

	.describe('First user retrieves all action target instances for his second organization filtered by name.')
	.get({}, function() { return { url: '/v1/actionTargetInstances?organizationId=' + this.getData('organizationId2') + '&name=%second%'}; })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('actionTargetInstanceId2'),
			name: 'Slack Message second target',
			organizationId: this.getData('organizationId2'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId2')
		}];
	})

	.describe('First user retrieves all action target instances for his first action target template.')
	.get({}, function() { return { url: '/v1/actionTargetInstances?actionTargetTemplateId=' + this.getData('actionTargetTemplateId1') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '0.name', '1.name', '0.organizationId', '0.actionTargetTemplateId', '0.configuration' ])
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('actionTargetInstanceId1'),
			name: 'Slack Message target',
			organizationId: this.getData('organizationId2'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1'),
			configuration: {botId: 'amazingSensor'}
		}, {
			id: this.getData('actionTargetInstanceId3'),
			name: 'Slack Message third target',
			organizationId: this.getData('organizationId1'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1')
		}];
	})

	.describe('First user retrieves all action target instances for his first action target template filtered by name.')
	.get({}, function() { return { url: '/v1/actionTargetInstances?actionTargetTemplateId=' + this.getData('actionTargetTemplateId1') + '&name=%third%'}; })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('actionTargetInstanceId3'),
			name: 'Slack Message third target',
			organizationId: this.getData('organizationId1'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1')
		}];
	})

	.describe('First user retrieves all action target instances for his second action target template.')
	.get({}, function() { return { url: '/v1/actionTargetInstances?actionTargetTemplateId=' + this.getData('actionTargetTemplateId2') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.name', '0.organizationId', '0.actionTargetTemplateId' ])
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('actionTargetInstanceId2'),
			name: 'Slack Message second target',
			organizationId: this.getData('organizationId2'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId2')
		}];
	})

	.describe('Second user retrieves all action target instances.')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.get({ url: '/v1/actionTargetInstances?allOrganizations' })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '0.name', '1.name', '0.organizationId', '0.actionTargetTemplateId' ])
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('actionTargetInstanceId4'),
			name: 'Slack Message first target for second user',
			organizationId: this.getData('organizationId3'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1')
		}, {
			id: this.getData('actionTargetInstanceId5'),
			name: 'Slack Message second target for second user',
			organizationId: this.getData('organizationId3'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId3')
		}];
	})

	.describe('Second user retrieves all action target instances for his organization.')
	.get({}, function() { return { url: '/v1/actionTargetInstances?organizationId=' + this.getData('organizationId3') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '0.name', '1.name', '0.organizationId', '0.actionTargetTemplateId' ])
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('actionTargetInstanceId4'),
			name: 'Slack Message first target for second user',
			organizationId: this.getData('organizationId3'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1')
		}, {
			id: this.getData('actionTargetInstanceId5'),
			name: 'Slack Message second target for second user',
			organizationId: this.getData('organizationId3'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId3')
		}];
	})

	.describe('Second user retrieves all action target instances for his action target template.')
	.get({}, function() { return { url: '/v1/actionTargetInstances?actionTargetTemplateId=' + this.getData('actionTargetTemplateId3') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.name', '0.organizationId', '0.actionTargetTemplateId' ])
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('actionTargetInstanceId5'),
			name: 'Slack Message second target for second user',
			organizationId: this.getData('organizationId3'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId3')
		}];
	})

	.describe('First user tries to retrieve an action target instance that does not exist.')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.get({}, function() { return { url: this.getData('locationActionTargetInstance1') + '100' }; })
	.expectStatusCode(403)

	.describe('First user tries to retrieve an action target instance from an organization where he is not a member.')
	.get({}, function() { return { url: this.getData('locationActionTargetInstance4') }; })
	.expectStatusCode(403)

	.describe('First user retrieve his first action target instance.')
	.get({}, function() { return { url: this.getData('locationActionTargetInstance1') }; })
	.expectStatusCode(200)
	.expectJsonToBe(function() {
		return {
			id: this.getData('actionTargetInstanceId1'),
			name: 'Slack Message target',
			organizationId: this.getData('organizationId2'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1'),
			configuration: {botId: 'amazingSensor'}
		};
	})

	.describe('First user updates hist first action target instance.')
	.patch({}, function() {
		return {
			url: this.getData('locationActionTargetInstance1'),
			body: {
				name: 'Slack Message target renamed'
			}
		};
	})
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTargetInstances/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('No update sent must let the resource unchanged')
	.patch({}, function() {
		return {
			url: this.getData('locationActionTargetInstance1'),
			body: {}
		};
	})
	.expectStatusCode(304)
	.expectLocationHeader('/v1/actionTargetInstances/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('Second user tries to update the first action target instance of first user.')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.patch({}, function() {
		return {
			url: this.getData('locationActionTargetInstance1'),
			body: {
				name: 'Slack Message target renamed by second user'
			}
		};
	})
	.expectStatusCode(403)

	.describe('First user creates an action target instance with a configuration call to remote system.')
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
	.post({ url: '/v1/actionTargetInstances' }, function() {
		return {
			body: {
				name: 'Instance with configuration',
				organizationId: this.getData('organizationId1'),
				actionTargetTemplateId: this.getData('actionTargetTemplateId4'),
				configuration: {
					test: 'niceStoryBro'
				}
			}
		};
	})
	.storeLocationAs('actionTargetInstance', 1)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTargetInstances/:id')
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

	.describe('First user creates an action target instance with a configuration and a token call to remote system.')
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
	.post({ url: '/v1/actionTargetInstances' }, function() {
		return {
			body: {
				name: 'Instance with configuration and token',
				organizationId: this.getData('organizationId1'),
				actionTargetTemplateId: this.getData('actionTargetTemplateId5'),
				configuration: {
					test: 'niceStoryBro'
				}
			}
		};
	})
	.storeLocationAs('actionTargetInstance', 1)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTargetInstances/:id')
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
;