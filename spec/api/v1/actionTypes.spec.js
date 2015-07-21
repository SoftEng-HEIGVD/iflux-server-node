var
	config = require('../../../config/config'),
	baseTest = require('../base');

module.exports = baseTest('Action type resource')
	.createUser('Register first user')
	.createUser('Register second user', { lastName: 'Dutoit', email: 'henri.dutoit@localhost.localdomain' })
	.signinUser('Signing first user')
	.signinUser('Signing first user', { email: 'henri.dutoit@localhost.localdomain' })
	.createOrganization('Create new organization for first user', { name: 'Orga 1' }, 1)
	.createOrganization('Create second organization for first user', { name: 'Orga 2' }, 1)
	.createOrganization('Create new organization for second user', { name: 'Orga 3' }, 2)

	.describe('Create AT1 (public) action type in organization with missing type')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.post({	url: '/v1/actionTypes' }, function() {
		return {
			body: {
				name: 'AT1',
				description: 'Action to reduce the thermostat.',
				public: true,
				organizationId: this.getData('organizationId3'),
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

	.describe('Create AT1 (public) action type in organization with invalid type')
	.post({	url: '/v1/actionTypes' }, function() {
		return {
			body: {
				name: 'AT1',
				description: 'Action to reduce the thermostat.',
				public: true,
				type: '1234',
				organizationId: this.getData('organizationId3'),
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

	.describe('Create AT1 (public) action type with too short name.')
	.post({	url: '/v1/actionTypes' }, function() {
		return {
			body: {
				name: 'AT',
				description: 'Action to reduce the thermostat.',
				public: true,
				type: 'http://iflux.io/schemas/actionTypes/1',
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
	.expectStatusCode(422)
	.expectJsonToHavePath('name.0')
	.expectJsonToBe({ name: [ 'The name must be at least 3 characters long' ]})

	.describe('Create AT1 (public) action type in organization where user does not have access')
	.post({	url: '/v1/actionTypes' }, function() {
		return {
			body: {
				name: 'AT1',
				description: 'Action to reduce the thermostat.',
				public: true,
				type: 'http://iflux.io/schemas/actionTypes/1',
				organizationId: this.getData('organizationId3'),
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
	.expectJsonToHavePath('organizationId.0')
	.expectJsonToBe({ organizationId: [ 'No organization found.' ]})

	.describe('Create AT1 (public) action type for first user in his first organization')
	.post({ url: '/v1/actionTypes'}, function() {
		return {
			body: {
				name: 'AT1',
				description: 'Action to reduce the thermostat.',
				public: true,
				type: 'http://' + config.host + ':' + config.port + '/v1/schemas/actionTypes/1',
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
	.expectLocationHeader('/v1/actionTypes/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('Try to re-create AT1 action type for first user in his first organization')
	.post({ url: '/v1/actionTypes' }, function() {
		return {
			body: {
				name: 'AT1',
				description: 'Action to reduce the thermostat.',
				public: true,
				type: 'http://' + config.host + ':' + config.port + '/v1/schemas/actionTypes/1/duplicated',
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
	.expectStatusCode(422)
	.expectJsonToBe({ name: [ 'Name is already taken in this organization.' ]})

	.describe('Re-create AT1 action type for first user in his second organization with same name from one of the first organization')
	.post({ url: '/v1/actionTypes' }, function() {
		return {
			body: {
				name: 'AT1',
				description: 'Action to reduce the thermostat.',
				public: true,
				type: 'http://' + config.host + ':' + config.port + '/v1/schemas/actionTypes/1/duplicated',
				organizationId: this.getData('organizationId2'),
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
	.storeLocationAs('actionType', 100)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTypes/:id')

	.describe('Try to create AT1 action type for first user in his first organization with type already taken.')
	.post({ url: '/v1/actionTypes' }, function() {
		return {
			body: {
				name: 'AT1',
				description: 'Action to reduce the thermostat.',
				public: true,
				type: 'http://' + config.host + ':' + config.port + '/v1/schemas/actionTypes/1',
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
	.expectStatusCode(422)
	.expectJsonToHavePath('type.0')
	.expectJsonToBe({ type: [ 'Type must be unique.' ]})

	.describe('Create a AT2 (private) action type for first user in his first organization')
	.post({ url: '/v1/actionTypes' }, function() {
		return {
			body: {
				name: 'AT2',
				description: 'Action to increase the thermostat.',
				public: false,
				type: 'http://iflux.io/schemas/actionTypes/2',
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
	.storeLocationAs('actionType', 2)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTypes/:id')

	.describe('Create AT3 action type for first user in his second organization')
	.post({ url: '/v1/actionTypes' }, function() {
		return {
			body: {
				name: 'AT3',
				description: 'Action to lock the thermostat.',
				public: true,
				type: 'http://iflux.io/schemas/actionTypes/3',
				organizationId: this.getData('organizationId2'),
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
	.storeLocationAs('actionType', 3)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTypes/:id')

	.describe('Create AT4 (public) action type for second user in his first organization')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.post({ url: '/v1/actionTypes' }, function() {
		return {
			body: {
				name: 'AT4',
				description: 'Action to collect data from thermostat.',
				type: 'http://iflux.io/schemas/actionTypes/4',
				public: true,
				organizationId: this.getData('organizationId3'),
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
	.storeLocationAs('actionType', 4)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTypes/:id')

	.describe('Create AT5 (private) action type for second user in his first organization')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.post({ url: '/v1/actionTypes' }, function() {
		return {
			body: {
				name: 'AT5',
				description: 'Action to collect data from thermostat.',
				type: 'http://iflux.io/schemas/actionTypes/5',
				public: false,
				organizationId: this.getData('organizationId3'),
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
	.storeLocationAs('actionType', 5)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTypes/:id')

	.describe('Retrieve all the public action types for first user')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.get({ url: '/v1/actionTypes?public' })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.name', '0.public', '0.organizationId', '1.id', '1.name', '1.public', '1.organizationId' ])
	.expectJsonCollectionToHaveSize(4)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'AT1',
			description: 'Action to reduce the thermostat.',
			public: true,
			type: 'http://' + config.host + ':' + config.port + '/v1/schemas/actionTypes/1',
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
		}, {
			name: 'AT3',
			description: 'Action to lock the thermostat.',
			public: true,
			type: 'http://iflux.io/schemas/actionTypes/3',
			organizationId: this.getData('organizationId2'),
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
			name: 'AT4',
			description: 'Action to collect data from thermostat.',
			public: true,
			type: 'http://iflux.io/schemas/actionTypes/4',
			organizationId: this.getData('organizationId3'),
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
			name: 'AT1',
			description: 'Action to reduce the thermostat.',
			public: true,
			type: 'http://' + config.host + ':' + config.port + '/v1/schemas/actionTypes/1/duplicated',
			organizationId: this.getData('organizationId2'),
			schema: {
				$schema: "http://json-schema.org/draft-04/schema#",
				type: "object",
				properties: {
					message: {
						type: "string"
					}
				}
			}
		}];
	})

	.describe('Retrieve all the public action types for first user filtered by name')
	.get({ url: '/v1/actionTypes?public=true&name=%4' })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'AT4',
			description: 'Action to collect data from thermostat.',
			public: true,
			type: 'http://iflux.io/schemas/actionTypes/4',
			organizationId: this.getData('organizationId3'),
			schema: {
				$schema: "http://json-schema.org/draft-04/schema#",
				type: "object",
				properties: {
					message: {
						type: "string"
					}
				}
			}
		}];
	})

	.describe('Retrieve all the action types for first user')
	.get({ url: '/v1/actionTypes?allOrganizations' })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '2.id', '0.name', '1.name', '2.name', '0.public', '1.public', '2.public', '0.organizationId' ])
	.expectJsonCollectionToHaveSize(4)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'AT1',
			description: 'Action to reduce the thermostat.',
			type: 'http://' + config.host + ':' + config.port + '/v1/schemas/actionTypes/1',
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
		}, {
			name: 'AT2',
			description: 'Action to increase the thermostat.',
			type: 'http://iflux.io/schemas/actionTypes/2',
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
		}, {
			name: 'AT3',
			description: 'Action to lock the thermostat.',
			type: 'http://iflux.io/schemas/actionTypes/3',
			organizationId: this.getData('organizationId2'),
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
			name: 'AT1',
			description: 'Action to reduce the thermostat.',
			public: true,
			type: 'http://' + config.host + ':' + config.port + '/v1/schemas/actionTypes/1/duplicated',
			organizationId: this.getData('organizationId2'),
			schema: {
				$schema: "http://json-schema.org/draft-04/schema#",
				type: "object",
				properties: {
					message: {
						type: "string"
					}
				}
			}
		}];
	})

	.describe('Retrieve all the action types for first user filtered by name')
	.get({ url: '/v1/actionTypes?allOrganizations&name=%1' })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'AT1',
			description: 'Action to reduce the thermostat.',
			type: 'http://' + config.host + ':' + config.port + '/v1/schemas/actionTypes/1',
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
		}, {
			name: 'AT1',
			description: 'Action to reduce the thermostat.',
			public: true,
			type: 'http://' + config.host + ':' + config.port + '/v1/schemas/actionTypes/1/duplicated',
			organizationId: this.getData('organizationId2'),
			schema: {
				$schema: "http://json-schema.org/draft-04/schema#",
				type: "object",
				properties: {
					message: {
						type: "string"
					}
				}
			}
		}];
	})

	.describe('Retrieve all the action types for first user for the first organization')
	.get({}, function() { return { url: '/v1/actionTypes?organizationId=' + this.getData('organizationId1') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '0.name', '1.name', '0.public', '1.public', '0.organizationId', '1.organizationId' ])
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'AT1',
			description: 'Action to reduce the thermostat.',
			type: 'http://' + config.host + ':' + config.port + '/v1/schemas/actionTypes/1',
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
		}, {
			name: 'AT2',
			description: 'Action to increase the thermostat.',
			type: 'http://iflux.io/schemas/actionTypes/2',
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
		}];
	})

	.describe('Retrieve all the action types for first user for the first organization filtered by name')
	.get({}, function() { return { url: '/v1/actionTypes?organizationId=' + this.getData('organizationId1') + '&name=%2'}; })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'AT2',
			description: 'Action to increase the thermostat.',
			type: 'http://iflux.io/schemas/actionTypes/2',
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
		}];
	})

	.describe('Retrieve all the action types for first user for the second organization')
	.get({}, function() { return { url: '/v1/actionTypes?organizationId=' + this.getData('organizationId2') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.name', '0.public', '0.organizationId' ])
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'AT3',
			description: 'Action to lock the thermostat.',
			type: 'http://iflux.io/schemas/actionTypes/3',
			organizationId: this.getData('organizationId2'),
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
			name: 'AT1',
			description: 'Action to reduce the thermostat.',
			public: true,
			type: 'http://' + config.host + ':' + config.port + '/v1/schemas/actionTypes/1/duplicated',
			organizationId: this.getData('organizationId2'),
			schema: {
				$schema: "http://json-schema.org/draft-04/schema#",
				type: "object",
				properties: {
					message: {
						type: "string"
					}
				}
			}
		}];
	})

	.describe('Retrieve all the action types for second user')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.get({ url: '/v1/actionTypes' })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.name', '0.public', '0.organizationId', '1.id', '1.name', '1.public', '1.organizationId' ])
	.expectJsonCollectionToHaveSize(5)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'AT1',
			description: 'Action to reduce the thermostat.',
			public: true,
			type: 'http://' + config.host + ':' + config.port + '/v1/schemas/actionTypes/1',
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
		}, {
			name: 'AT3',
			description: 'Action to lock the thermostat.',
			public: false,
			type: 'http://iflux.io/schemas/actionTypes/3',
			organizationId: this.getData('organizationId2'),
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
			name: 'AT4',
			description: 'Action to collect data from thermostat.',
			public: true,
			type: 'http://iflux.io/schemas/actionTypes/4',
			organizationId: this.getData('organizationId3'),
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
			name: 'AT5',
			description: 'Action to collect data from thermostat.',
			public: false,
			type: 'http://iflux.io/schemas/actionTypes/5',
			organizationId: this.getData('organizationId3'),
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
			name: 'AT1',
			description: 'Action to reduce the thermostat.',
			public: true,
			type: 'http://' + config.host + ':' + config.port + '/v1/schemas/actionTypes/1/duplicated',
			organizationId: this.getData('organizationId2'),
			schema: {
				$schema: "http://json-schema.org/draft-04/schema#",
				type: "object",
				properties: {
					message: {
						type: "string"
					}
				}
			}
		}];
	})

	.describe('Retrieve all the action types for second user filtered by name')
	.get({ url: '/v1/actionTypes?name=%4' })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'AT4',
			description: 'Action to collect data from thermostat.',
			public: true,
			type: 'http://iflux.io/schemas/actionTypes/4',
			organizationId: this.getData('organizationId3'),
			schema: {
				$schema: "http://json-schema.org/draft-04/schema#",
				type: "object",
				properties: {
					message: {
						type: "string"
					}
				}
			}
		}];
	})

	.describe('Retrieve all the public action types for second user')
	.get({ url: '/v1/actionTypes?public' })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.name', '0.public', '0.organizationId', '1.id', '1.name', '1.public', '1.organizationId' ])
	.expectJsonCollectionToHaveSize(4)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'AT1',
			description: 'Action to reduce the thermostat.',
			public: true,
			type: 'http://' + config.host + ':' + config.port + '/v1/schemas/actionTypes/1',
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
		}, {
			name: 'AT3',
			description: 'Action to lock the thermostat.',
			public: true,
			type: 'http://iflux.io/schemas/actionTypes/3',
			organizationId: this.getData('organizationId2'),
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
			name: 'AT4',
			description: 'Action to collect data from thermostat.',
			public: true,
			type: 'http://iflux.io/schemas/actionTypes/4',
			organizationId: this.getData('organizationId3'),
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
			name: 'AT1',
			description: 'Action to reduce the thermostat.',
			public: true,
			type: 'http://' + config.host + ':' + config.port + '/v1/schemas/actionTypes/1/duplicated',
			organizationId: this.getData('organizationId2'),
			schema: {
				$schema: "http://json-schema.org/draft-04/schema#",
				type: "object",
				properties: {
					message: {
						type: "string"
					}
				}
			}
		}];
	})

	.describe('Retrieve all the public action types for second user filtered by name')
	.get({ url: '/v1/actionTypes?public=true&name=%4' })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'AT4',
			description: 'Action to collect data from thermostat.',
			public: true,
			type: 'http://iflux.io/schemas/actionTypes/4',
			organizationId: this.getData('organizationId3'),
			schema: {
				$schema: "http://json-schema.org/draft-04/schema#",
				type: "object",
				properties: {
					message: {
						type: "string"
					}
				}
			}
		}];
	})

	.describe('Try to retrieve all action types and all for a specific organization, only the specific organization is taken into account.')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.get({}, function() { return { url: '/v1/actionTypes?allOrganizations&organizationId=' + this.getData('organizationId2') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.name', '0.public', '0.organizationId' ])
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'AT3',
			description: 'Action to lock the thermostat.',
			type: 'http://iflux.io/schemas/actionTypes/3',
			organizationId: this.getData('organizationId2'),
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
			name: 'AT1',
			description: 'Action to reduce the thermostat.',
			public: true,
			type: 'http://' + config.host + ':' + config.port + '/v1/schemas/actionTypes/1/duplicated',
			organizationId: this.getData('organizationId2'),
			schema: {
				$schema: "http://json-schema.org/draft-04/schema#",
				type: "object",
				properties: {
					message: {
						type: "string"
					}
				}
			}
		}];
	})

	.describe('Try to retrieve action type where the user is not member of the organization')
	.get({}, function() { return { url: this.getData('locationActionType1') + '100' }; })
	.expectStatusCode(403)

	.describe('First user updates AT1 action type')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.patch({}, function() {
		return {
			url: this.getData('locationActionType1'),
			body: {
				name: 'AT1 renamed'
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

	.describe('First user updates AT1 action type with the same type')
	.patch({}, function() {
		return {
			url: this.getData('locationActionType1'),
			body: {
				type: 'http://' + config.host + ':' + config.port + '/v1/schemas/actionTypes/1'
			}
		};
	})
	.expectStatusCode(304)
	.expectLocationHeader('/v1/actionTypes/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('First user updates AT1 action type with invalid type')
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

	.describe('First user updates AT1 action type with different type but not unique')
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

	.describe('First user updates AT1 action type with valid and unique different type')
	.patch({}, function() {
		return {
			url: this.getData('locationActionType1'),
			body: {
				type: 'http://' + config.host + ':' + config.port + '/v1/schemas/actionTypes/11'
			}
		};
	})
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTypes/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('First user updates AT1 action type with a name used in a different organization')
	.patch({}, function() {
		return {
			url: this.getData('locationActionType1'),
			body: {
				name: 'AT3'
			}
		};
	})
	.expectStatusCode(201)
	.expectLocationHeader('/v1/actionTypes/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('First user updates AT1 action type with a name used in the same organization')
	.patch({}, function() {
		return {
			url: this.getData('locationActionType1'),
			body: {
				name: 'AT2'
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ name: [ 'Name is already taken in this organization.' ]})

	.describe('Second user tries to update AT1 action type of first user')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.patch({}, function() {
		return {
			url: this.getData('locationActionType1'),
			body: {
				name: 'AT1 renamed again'
			}
		};
	})
	.expectStatusCode(403)

	.describe('Retrieve an action type schema from its type (url).')
	.get({ url: '/v1/schemas/actionTypes/11' })
	.expectStatusCode(200)

	.describe('Retrieve an action type schema from its type (url) but nothing is found.')
	.get({ url: '/v1/schemas/actionTypes/111' })
	.expectStatusCode(404)

  .describe('First user remove AT1.')
 	.jwtAuthentication(function() { return this.getData('token1'); })
 	.delete({}, function() { return { url: this.getData('locationActionType1') }; })
 	.expectStatusCode(204)

 	.describe('First user tries to retrieve AT1.')
 	.get({}, function() { return { url: this.getData('locationActionType1') }; })
 	.expectStatusCode(403)

 	.describe('First user tries to delete AT4 in an organization where he is not a member.')
 	.get({}, function() { return { url: this.getData('locationActionType4') }; })
 	.expectStatusCode(403)
;