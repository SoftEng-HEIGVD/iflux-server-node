var
	helpers = require('./helpers/rules-helpers'),
	baseTest = require('../base');

module.exports = baseTest('Delete on resources')
	.describe('Register U1')
	.post	({
		url: '/v1/auth/register',
		body: {
			email: 'henri.dupont@localhost.localdomain',
			firstName: 'Henri',
			lastName: 'Dupont',
			password: 'password',
			passwordConfirmation: 'password'
		}
	})
	.expectStatusCode(201)

	.describe('Register U2')
	.post	({
		url: '/v1/auth/register',
		body: {
			email: 'henri.dutoit@localhost.localdomain',
			firstName: 'Henri',
			lastName: 'Dutoit',
			password: 'password',
			passwordConfirmation: 'password'
		}
	})
	.expectStatusCode(201)

	.describe('Signin U1')
	.post({
		url: '/v1/auth/signin',
		body: {
			email: 'henri.dupont@localhost.localdomain',
			password: 'password'
		},
		_storeData: function() { this.setData('t1', this.response.body.token); }
	})
	.expectStatusCode(200)

	.describe('Create Orga1')
	.jwtAuthentication(function() { return this.getData('t1'); })
	.post({
		url: '/v1/organizations',
		body: {
			name: 'Orga1'
		}
	})
	.storeLocationAs('organization', 1)
	.expectStatusCode(201)

	.describe('U1 add U2 in Orga1')
	.post({}, function() {
		return {
			url: this.getData('locationOrganization1') + '/actions',
			body: {
				type: "addUser",
				email: "henri.dutoit@localhost.localdomain"
			}
		};
	})
	.expectStatusCode(200)

	.describe('U1 creates action target template ATT1 in Orga1')
	.post({ url: '/v1/actionTargetTemplates' }, function() {
		return {
			body: {
				name: 'ATT1',
				public: true,
				organizationId: this.getData('organizationId1'),
				target: {
					url: 'http://radiator.localhost.localdomain',
					token: 'token'
				}
			}
		};
	})
	.storeLocationAs('actionTargetTemplate', 1)
	.expectStatusCode(201)

	.describe('U1 creates event source template EST1 in Orga1')
	.post({ url: '/v1/eventSourceTemplates' }, function() {
		return {
			body: {
				name: 'EST1',
				public: true,
				organizationId: this.getData('organizationId1')
			}
		};
	})
	.storeLocationAs('eventSourceTemplate', 1)
	.expectStatusCode(201)

	.describe('U1 creates action target AT1 in Orga1')
	.post({ url: '/v1/actionTargets' }, function() {
		return {
			body: {
				name: 'AT1',
				organizationId: this.getData('organizationId1'),
				actionTargetTemplateId: this.getData('actionTargetTemplateId1')
			}
		};
	})
	.storeLocationAs('actionTarget', 1)
	.expectStatusCode(201)

	.describe('U1 creates event source ES1 in Orga1')
	.post({ url: '/v1/eventSources' }, function() {
		return {
			body: {
				name: 'ES1',
				organizationId: this.getData('organizationId1'),
				eventSourceTemplateId: this.getData('eventSourceTemplateId1')
			}
		};
	})
	.storeLocationAs('eventSource', 1)
	.expectStatusCode(201)

	.describe('U1 creates action type AT1 in Orga1')
	.post({ url: '/v1/actionTypes'}, function() {
		return {
			body: {
				name: 'AT1',
				description: 'Action to reduce the thermostat.',
				public: true,
				type: 'http://localhost.localdomain/v1/schemas/actionTypes/1',
				organizationId: this.getData('organizationId1'),
				schema: {
		      $schema: "http://json-schema.org/draft-04/schema#",
	        type: "object",
		      properties: {
			      message: {
			        type: "string"
			      }
			    }
			  }
			}
		};
	})
	.storeLocationAs('actionType', 1)
	.expectStatusCode(201)

	.describe('U1 create event type ET1 in Orga1')
	.post({ url: '/v1/eventTypes' }, function() {
		return {
			body: {
				name: 'ET1',
				description: 'Represent an increase in the temperature.',
				public: true,
				type: 'http://localhost.localdomain/v1/schemas/eventTypes/1',
				organizationId: this.getData('organizationId1'),
				schema: {
			    $schema: "http://json-schema.org/draft-04/schema#",
			    type: "object",
			    properties: {
			      sensorId: {
			        type: "string"
			      }
			    }
			  }
			}
		};
	})
	.storeLocationAs('eventType', 1)
	.expectStatusCode(201)

	.describe('U1 creates Rule1 in Orga1')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'Rule1',
				active: true,
				organizationId: this.getData('organizationId1'),
				conditions: [{
					eventSourceId: this.getData('eventSourceId1'),
					eventTypeId: this.getData('eventTypeId1')
				}],
				transformations: [{
					actionTargetId: this.getData('actionTargetId1'),
					actionTypeId: this.getData('actionTypeId1'),
					eventTypeId: this.getData('eventTypeId1'),
				}]
			}
		};
	})
	.storeLocationAs('rule', 1)
	.expectStatusCode(201)

	.describe('U1 tries to delete Orga1 - all models are present')
	.delete({}, function() { return { url: this.getData('locationOrganization1') }; })
	.expectStatusCode(403)
	.expectJsonToBe({ message: 'The organization cannot be deleted. The model is referenced by other models.' })

	.describe('U1 deletes Rule1')
	.delete({}, function() { return { url: this.getData('locationRule1') }; })
	.expectStatusCode(204)

	.describe('U1 tries to delete Orga1 - after rule removed')
	.delete({}, function() { return { url: this.getData('locationOrganization1') }; })
	.expectStatusCode(403)
	.expectJsonToBe({ message: 'The organization cannot be deleted. The model is referenced by other models.' })
;