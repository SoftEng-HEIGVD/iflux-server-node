var
	config = require('../../../config/config'),
	baseTest = require('../base');

module.exports = baseTest('Action target resource')
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

	.describe('First user tries to creates an action target in an organization he has no access.')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.post({	url: '/v1/actionTargets' }, function() {
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

	.describe('First user tries to create an action target from an action target template he has no access.')
	.post({	url: '/v1/actionTargets' }, function() {
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

	.describe('First user tries to create an action target with a wrong configuration.')
	.post({ url: '/v1/actionTargets' }, function() {
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

	.describe('First user creates a first action target for his second organization and first action target template.')
	.post({ url: '/v1/actionTargets' }, function() {
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
	.storeLocationAs('actionTarget', 1)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTargets/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('First user creates a second action target for his second organization and second action target template.')
	.post({ url: '/v1/actionTargets' }, function() {
		return {
			body: {
				name: 'Slack Message second target',
				organizationId: this.getData('organizationId2'),
				actionTargetTemplateId: this.getData('actionTargetTemplateId2')
			}
		};
	})
	.storeLocationAs('actionTarget', 2)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTargets/:id')

	.describe('First user tries to create a third action target for his first organization and second action target template.')
	.post({ url: '/v1/actionTargets' }, function() {
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

	.describe('First user creates a third action target for his first organization and first action target template.')
	.post({ url: '/v1/actionTargets' }, function() {
		return {
			body: {
				name: 'Slack Message third target',
				organizationId: this.getData('organizationId1'),
				actionTargetTemplateId: this.getData('actionTargetTemplateId1')
			}
		};
	})
	.storeLocationAs('actionTarget', 3)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTargets/:id')

	.describe('Second user creates a first action target for his organization and first action target template.')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.post({ url: '/v1/actionTargets' }, function() {
		return {
			body: {
				name: 'Slack Message first target for second user',
				organizationId: this.getData('organizationId3'),
				actionTargetTemplateId: this.getData('actionTargetTemplateId1')
			}
		};
	})
	.storeLocationAs('actionTarget', 4)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTargets/:id')

	.describe('Second user creates a second action target for his organization and third action target template.')
	.post({ url: '/v1/actionTargets' }, function() {
		return {
			body: {
				name: 'Slack Message second target for second user',
				organizationId: this.getData('organizationId3'),
				actionTargetTemplateId: this.getData('actionTargetTemplateId3')
			}
		};
	})
	.storeLocationAs('actionTarget', 5)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTargets/:id')

	.describe('First user tries to retrieve action targets.')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.get({ url: '/v1/actionTargets' })
	.expectStatusCode(422)
	.expectJsonToHavePath([ 'actionTargetTemplateId', 'organizationId', 'allOrganizations' ])
	.expectJsonToBe({
		actionTargetTemplateId: [ 'Action target template id should be provided.' ],
		organizationId: [ 'Organization id should be provided.' ],
		allOrganizations: [ 'allOrganizations should be provided.' ]
	})

	.describe('First user tries to mix different way to retrieve action targets (actionTargetTemplateId is used).')
	.get({}, function() {
		return {
			url: '/v1/actionTargets?allOrganizations&organizationId=' +
				this.getData('organizationId1') +
				'&actionTargetTemplateId=' +
				this.getData('actionTargetTemplateId1')
		};
	})
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('actionTargetId1'),
			organizationId: this.getData('organizationId2'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1')
		}, {
			id: this.getData('actionTargetId3'),
			organizationId: this.getData('organizationId1'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1')
		}];
	})

	.describe('First user tries to mix different way to retrieve action targets (organizationId is used).')
	.get({}, function() { return { url: '/v1/actionTargets?allOrganizations&organizationId=' + this.getData('organizationId1') }; })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('actionTargetId3'),
			organizationId: this.getData('organizationId1'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1')
		}];
	})

	.describe('First user retrieves all action targets.')
	.get({ url: '/v1/actionTargets?allOrganizations' })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '2.id', '0.name', '1.name', '2.name', '0.organizationId', '0.actionTargetTemplateId' ])
	.expectJsonCollectionToHaveSize(3)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('actionTargetId1'),
			name: 'Slack Message target',
			organizationId: this.getData('organizationId2'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1'),
			configuration: { botId: 'amazingSensor' }
		}, {
			id: this.getData('actionTargetId2'),
			name: 'Slack Message second target',
			organizationId: this.getData('organizationId2'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId2')
		}, {
			id: this.getData('actionTargetId3'),
			name: 'Slack Message third target',
			organizationId: this.getData('organizationId1'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1')
		}];
	})

	.describe('First user retrieves all action targets filtered by name.')
	.get({ url: '/v1/actionTargets?allOrganizations&name=Slack Message target' })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('actionTargetId1'),
			name: 'Slack Message target',
			organizationId: this.getData('organizationId2'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1'),
			configuration: { botId: 'amazingSensor' }
		}];
	})

	.describe('First user retrieves all action targets for his first organization.')
	.get({}, function() { return { url: '/v1/actionTargets?organizationId=' + this.getData('organizationId1') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.name', '0.organizationId', '0.actionTargetTemplateId' ])
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('actionTargetId3'),
			name: 'Slack Message third target',
			organizationId: this.getData('organizationId1'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1')
		}];
	})

	.describe('First user retrieves all action targets for his second organization.')
	.get({}, function() { return { url: '/v1/actionTargets?organizationId=' + this.getData('organizationId2') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '0.name', '1.name', '0.organizationId', '0.actionTargetTemplateId', '0.configuration' ])
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('actionTargetId1'),
			name: 'Slack Message target',
			organizationId: this.getData('organizationId2'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1'),
			configuration: {botId: 'amazingSensor'}
		}, {
			id: this.getData('actionTargetId2'),
			name: 'Slack Message second target',
			organizationId: this.getData('organizationId2'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId2')
		}];
	})

	.describe('First user retrieves all action targets for his second organization filtered by name.')
	.get({}, function() { return { url: '/v1/actionTargets?organizationId=' + this.getData('organizationId2') + '&name=%second%'}; })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('actionTargetId2'),
			name: 'Slack Message second target',
			organizationId: this.getData('organizationId2'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId2')
		}];
	})

	.describe('First user retrieves all action targets for his first action target template.')
	.get({}, function() { return { url: '/v1/actionTargets?actionTargetTemplateId=' + this.getData('actionTargetTemplateId1') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '0.name', '1.name', '0.organizationId', '0.actionTargetTemplateId', '0.configuration' ])
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('actionTargetId1'),
			name: 'Slack Message target',
			organizationId: this.getData('organizationId2'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1'),
			configuration: {botId: 'amazingSensor'}
		}, {
			id: this.getData('actionTargetId3'),
			name: 'Slack Message third target',
			organizationId: this.getData('organizationId1'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1')
		}];
	})

	.describe('First user retrieves all action targets for his first action target template filtered by name.')
	.get({}, function() { return { url: '/v1/actionTargets?actionTargetTemplateId=' + this.getData('actionTargetTemplateId1') + '&name=%third%'}; })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('actionTargetId3'),
			name: 'Slack Message third target',
			organizationId: this.getData('organizationId1'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1')
		}];
	})

	.describe('First user retrieves all action targets for his second action target template.')
	.get({}, function() { return { url: '/v1/actionTargets?actionTargetTemplateId=' + this.getData('actionTargetTemplateId2') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.name', '0.organizationId', '0.actionTargetTemplateId' ])
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('actionTargetId2'),
			name: 'Slack Message second target',
			organizationId: this.getData('organizationId2'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId2')
		}];
	})

	.describe('Second user retrieves all action targets.')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.get({ url: '/v1/actionTargets?allOrganizations' })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '0.name', '1.name', '0.organizationId', '0.actionTargetTemplateId' ])
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('actionTargetId4'),
			name: 'Slack Message first target for second user',
			organizationId: this.getData('organizationId3'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1')
		}, {
			id: this.getData('actionTargetId5'),
			name: 'Slack Message second target for second user',
			organizationId: this.getData('organizationId3'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId3')
		}];
	})

	.describe('Second user retrieves all action targets for his organization.')
	.get({}, function() { return { url: '/v1/actionTargets?organizationId=' + this.getData('organizationId3') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '0.name', '1.name', '0.organizationId', '0.actionTargetTemplateId' ])
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('actionTargetId4'),
			name: 'Slack Message first target for second user',
			organizationId: this.getData('organizationId3'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1')
		}, {
			id: this.getData('actionTargetId5'),
			name: 'Slack Message second target for second user',
			organizationId: this.getData('organizationId3'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId3')
		}];
	})

	.describe('Second user retrieves all action targets for his action target template.')
	.get({}, function() { return { url: '/v1/actionTargets?actionTargetTemplateId=' + this.getData('actionTargetTemplateId3') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.actionTargetId', '0.name', '0.organizationId', '0.actionTargetTemplateId' ])
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			id: this.getData('actionTargetId5'),
			name: 'Slack Message second target for second user',
			organizationId: this.getData('organizationId3'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId3')
		}];
	})

	.describe('First user tries to retrieve an action target that does not exist.')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.get({}, function() { return { url: this.getData('locationActionTarget1') + '100' }; })
	.expectStatusCode(403)

	.describe('First user tries to retrieve an action target from an organization where he is not a member.')
	.get({}, function() { return { url: this.getData('locationActionTarget4') }; })
	.expectStatusCode(403)

	.describe('First user retrieve his first action target.')
	.get({}, function() { return { url: this.getData('locationActionTarget1') }; })
	.expectStatusCode(200)
	.expectJsonToBeAtLeast(function() {
		return {
			id: this.getData('actionTargetId1'),
			name: 'Slack Message target',
			organizationId: this.getData('organizationId2'),
			actionTargetTemplateId: this.getData('actionTargetTemplateId1'),
			configuration: {botId: 'amazingSensor'}
		};
	})

	.describe('First user updates hist first action target.')
	.patch({}, function() {
		return {
			url: this.getData('locationActionTarget1'),
			body: {
				name: 'Slack Message target renamed'
			}
		};
	})
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTargets/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('No update sent must let the resource unchanged')
	.patch({}, function() {
		return {
			url: this.getData('locationActionTarget1'),
			body: {}
		};
	})
	.expectStatusCode(304)
	.expectLocationHeader('/v1/actionTargets/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('Second user tries to update the first action target of first user.')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.patch({}, function() {
		return {
			url: this.getData('locationActionTarget1'),
			body: {
				name: 'Slack Message target renamed by second user'
			}
		};
	})
	.expectStatusCode(403)

	.describe('First user creates an action target with a configuration call to remote system.')
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
	.post({ url: '/v1/actionTargets' }, function() {
		return {
			body: {
				name: 'Target with configuration',
				organizationId: this.getData('organizationId1'),
				actionTargetTemplateId: this.getData('actionTargetTemplateId4'),
				configuration: {
					test: 'niceStoryBro'
				}
			}
		};
	})
	.storeLocationAs('actionTarget', 1)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTargets/:id')
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

	.describe('First user creates an action target with a configuration and a token call to remote system.')
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
	.post({ url: '/v1/actionTargets' }, function() {
		return {
			body: {
				name: 'Target with configuration and token',
				organizationId: this.getData('organizationId1'),
				actionTargetTemplateId: this.getData('actionTargetTemplateId5'),
				configuration: {
					test: 'niceStoryBro'
				}
			}
		};
	})
	.storeLocationAs('actionTarget', 6)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTargets/:id')
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

	.describe('First user reconfigure his action target.')
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
			url: this.getData('locationActionTarget6') + '/configure'
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

	.describe('First user tries to reconfigure an action target that has no configuration.')
	.post({}, function() {
		return {
			url: this.getData('locationActionTarget2') + '/configure'
		};
	})
	.expectStatusCode(404)
;