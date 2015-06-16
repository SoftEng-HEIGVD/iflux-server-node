var  baseTest = require('../base');

module.exports = baseTest('Action type resource')
	.createUser('Register first user')
	.createUser('Register second user', { lastName: 'Dutoit', email: 'henri.dutoit@localhost.localdomain' })
	.signinUser('Signing first user')
	.signinUser('Signing first user', { email: 'henri.dutoit@localhost.localdomain' })
	.createOrganization('Create new organization for first user', { name: 'Orga 1' }, 1)
	.createOrganization('Create second organization for first user', { name: 'Orga 2' }, 1)
	.createOrganization('Create new organization for second user', { name: 'Orga 3' }, 2)
	.createActionTargetTemplate('Create first action target template for first user', { name: 'Action target template 1' }, 1, 1 )
	.createActionTargetTemplate('Create second action target template for first user', { name: 'Action target template 2' }, 1, 2 )
	.createActionTargetTemplate('Create first action target template for second user', { name: 'Action target template 3' }, 2, 3 )

	.describe('Create new action type in action target template with missing type')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.post({	url: '/v1/actionTypes' }, function() {
		return {
			body: {
				name: 'Decrease thermostat',
				description: 'Action to reduce the thermostat.',
				actionTargetTemplateId: this.getData('actionTargetTemplateId3'),
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
	.expectStatusCode(422)
	.expectJsonToHavePath('type.0')
	.expectJsonToBe({ type: [ 'Type is mandatory.' ]})

	.describe('Create new action type in action target template with invalid type')
	.post({	url: '/v1/actionTypes' }, function() {
		return {
			body: {
				name: 'Decrease thermostat',
				description: 'Action to reduce the thermostat.',
				type: '1234',
				actionTargetTemplateId: this.getData('actionTargetTemplateId3'),
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
	.expectStatusCode(422)
	.expectJsonToHavePath('type.0')
	.expectJsonToBe({ type: [ 'Type must be a valid URL.' ]})

	.describe('Create new action type in action target template where user does not have access')
	.post({	url: '/v1/actionTypes' }, function() {
		return {
			body: {
				name: 'Decrease thermostat',
				description: 'Action to reduce the thermostat.',
				type: 'http://iflux.io/schemas/actionTypes/1',
				actionTargetTemplateId: this.getData('actionTargetTemplateId3'),
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
	.expectStatusCode(422)
	.expectJsonToHavePath('actionTargetTemplateId.0')
	.expectJsonToBe({ actionTargetTemplateId: [ 'No action target template found.' ]})

	.describe('Create new action type for first user in his first action target template')
	.post({
		url: '/v1/actionTypes',
		_storeData: function() { this.setData('locationActionType1', this.response.headers.location); }
	},
	function() {
		return {
			body: {
				name: 'Decrease thermostat',
				description: 'Action to reduce the thermostat.',
				type: 'http://iflux.io/schemas/actionTypes/1',
				actionTargetTemplateId: this.getData('actionTargetTemplateId1'),
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
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTypes/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('Create a second action type for first user in his first action target template')
	.post({
		url: '/v1/actionTypes',
		_storeData: function() { this.setData('locationActionType2', this.response.headers.location); }
	},
	function() {
		return {
			body: {
				name: 'Increase thermostat',
				description: 'Action to increase the thermostat.',
				type: 'http://iflux.io/schemas/actionTypes/2',
				actionTargetTemplateId: this.getData('actionTargetTemplateId1'),
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
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTypes/:id')

	.describe('Create new action type for first user in his second action target template')
	.post({
		url: '/v1/actionTypes',
		_storeData: function() { this.setData('locationActionType3', this.response.headers.location); }
	},
	function() {
		return {
			body: {
				name: 'Block thermostat',
				description: 'Action to lock the thermostat.',
				type: 'http://iflux.io/schemas/actionTypes/3',
				actionTargetTemplateId: this.getData('actionTargetTemplateId2'),
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
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTypes/:id')

	.describe('Create new action type for second user in his first action target template')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.post({
		url: '/v1/actionTypes',
		_storeData: function() { this.setData('locationActionType4', this.response.headers.location); }
	},
	function() {
		return {
			body: {
				name: 'Monitor thermostat',
				description: 'Action to collect data from thermostat.',
				type: 'http://iflux.io/schemas/actionTypes/4',
				actionTargetTemplateId: this.getData('actionTargetTemplateId3'),
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
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTypes/:id')

	.describe('Try to retrieve all the action types for first user without specifying the action target template.')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.get({ url: '/v1/actionTypes' })
	.expectStatusCode(422)
	.expectJsonToHavePath('actionTargetTemplateId.0')
	.expectJsonToBe({ actionTargetTemplateId: [ 'The action target template id is mandatory' ]})

	.describe('Try to retrieve all the action types for first user with non-existing action target template.')
	.get({}, function() { return { url: '/v1/actionTypes?actionTargetTemplateId=' + (this.getData('actionTargetTemplateId1') + 100) }; })
	.expectStatusCode(403)

	.describe('Retrieve all the action types of first action target template for first user')
	.get({}, function() { return { url: '/v1/actionTypes?actionTargetTemplateId=' + this.getData('actionTargetTemplateId1') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '0.type', '1.type', '0.name', '1.name', '0.actionTargetTemplateId', '1.actionTargetTemplateId', '0.schema', '1.schema' ])
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast([{
		name: 'Decrease thermostat',
		description: 'Action to reduce the thermostat.',
		schema: {
      $schema: "http://json-schema.org/draft-04/schema#",
       type: "object",
      properties: {
	      message: {
	        type: "string"
	      }
	    }
	  }
	}, {
		name: 'Increase thermostat',
		description: 'Action to increase the thermostat.',
		schema: {
      $schema: "http://json-schema.org/draft-04/schema#",
       type: "object",
      properties: {
	      message: {
	        type: "string"
	      }
	    }
	  }
	}])

	.describe('Retrieve all the action types of first action target template for first user filtered by name')
	.get({}, function() { return { url: '/v1/actionTypes?actionTargetTemplateId=' + this.getData('actionTargetTemplateId1') + '&name=Decrease%' }; })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast([{
		name: 'Decrease thermostat',
		description: 'Action to reduce the thermostat.',
		schema: {
      $schema: "http://json-schema.org/draft-04/schema#",
       type: "object",
      properties: {
	      message: {
	        type: "string"
	      }
	    }
	  }
	}])

	.describe('Retrieve all the action types of second action target template for first user')
	.get({}, function() { return { url: '/v1/actionTypes?actionTargetTemplateId=' + this.getData('actionTargetTemplateId2') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.type', '0.name', '0.actionTargetTemplateId', '0.schema' ])
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast([{
		name: 'Block thermostat',
		description: 'Action to lock the thermostat.',
		schema: {
      $schema: "http://json-schema.org/draft-04/schema#",
       type: "object",
      properties: {
	      message: {
	        type: "string"
	      }
	    }
	  }
	}])

	.describe('Retrieve all the action types of first action target template for second user')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.get({}, function() { return { url: '/v1/actionTypes?actionTargetTemplateId=' + this.getData('actionTargetTemplateId3') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.type', '0.name', '0.actionTargetTemplateId', '0.schema' ])
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast([{
		name: 'Monitor thermostat',
		description: 'Action to collect data from thermostat.',
		schema: {
      $schema: "http://json-schema.org/draft-04/schema#",
       type: "object",
      properties: {
	      message: {
	        type: "string"
	      }
	    }
	  }
	}])

	.describe('First user updates his first action type')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.patch({}, function() {
		return {
			url: this.getData('locationActionType1'),
			body: {
				name: 'Increase thermostat renamed'
			}
		};
	})
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTypes/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('No update sent must let the resource unchanged')
	.patch({}, function() {
		return {
			url: this.getData('locationActionType1'),
			body: {}
		};
	})
	.expectStatusCode(304)
	.expectLocationHeader('/v1/actionTypes/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('First user updates his first action type with the same type')
	.patch({}, function() {
		return {
			url: this.getData('locationActionType1'),
			body: {
				type: 'http://iflux.io/schemas/actionTypes/1'
			}
		};
	})
	.expectStatusCode(304)
	.expectLocationHeader('/v1/actionTypes/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('First user updates his first action type with invalid type')
	.patch({}, function() {
		return {
			url: this.getData('locationActionType1'),
			body: {
				type: '1234'
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ type: [ 'Type must be a valid URL.' ]})

	.describe('First user updates his first action type with different type but not unique')
	.patch({}, function() {
		return {
			url: this.getData('locationActionType1'),
			body: {
				type: 'http://iflux.io/schemas/actionTypes/2'
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ type: [ 'Type must be unique.' ]})

	.describe('First user updates his first action type with valid and unique different type')
	.patch({}, function() {
		return {
			url: this.getData('locationActionType1'),
			body: {
				type: 'http://iflux.io/schemas/actionTypes/11'
			}
		};
	})
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTypes/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('Second user tries to update first action type of first user')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.patch({}, function() {
		return {
			url: this.getData('locationActionType1'),
			body: {
				name: 'Increase thermostat renamed by second user'
			}
		};
	})
	.expectStatusCode(403)
;