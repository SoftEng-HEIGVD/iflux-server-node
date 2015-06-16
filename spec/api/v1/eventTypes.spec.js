var  baseTest = require('../base');

module.exports = baseTest('Event type resource')
	.createUser('Register first user')
	.createUser('Register second user', { lastName: 'Dutoit', email: 'henri.dutoit@localhost.localdomain' })
	.signinUser('Signing first user')
	.signinUser('Signing first user', { email: 'henri.dutoit@localhost.localdomain' })
	.createOrganization('Create new organization for first user', { name: 'Orga 1' }, 1)
	.createOrganization('Create second organization for first user', { name: 'Orga 2' }, 1)
	.createOrganization('Create new organization for second user', { name: 'Orga 3' }, 2)
	.createEventSourceTemplate('Create first event source template for first user', { name: 'Event source template 1' }, 1, 1)
	.createEventSourceTemplate('Create second event source template for first user', { name: 'Event source template 2' }, 1, 2)
	.createEventSourceTemplate('Create first event source template for second user', { name: 'Event source template 3' }, 2, 3)

	.describe('Create new event type in event source template with missing type')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.post({	url: '/v1/eventTypes' }, function() {
		return {
			body: {
				name: 'Temperature Increase',
				description: 'Represent an increase in the temperature.',
				eventSourceTemplateId: this.getData('eventSourceTemplateId3'),
				schema: {
			    $schema: "http://json-schema.org/draft-04/schema#",
			    type: "object",
			    properties: {
			      sensorId: {
			        type: "string"
			      },
			      temperature: {
			        type: "object",
			        properties: {
			          old: {
			            type: "number"
			          },
			          new: {
			            type: "number"
			          }
			        }
			      }
			    }
			  }
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToHavePath('type.0')
	.expectJsonToBe({ type: [ 'Type is mandatory.' ]})

	.describe('Create new event type in event source template with invalid type')
	.post({	url: '/v1/eventTypes' }, function() {
		return {
			body: {
				name: 'Temperature Increase',
				description: 'Represent an increase in the temperature.',
				type: '1234',
				eventSourceTemplateId: this.getData('eventSourceTemplateId3'),
				schema: {
			    $schema: "http://json-schema.org/draft-04/schema#",
			    type: "object",
			    properties: {
			      sensorId: {
			        type: "string"
			      },
			      temperature: {
			        type: "object",
			        properties: {
			          old: {
			            type: "number"
			          },
			          new: {
			            type: "number"
			          }
			        }
			      }
			    }
			  }
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToHavePath('type.0')
	.expectJsonToBe({ type: [ 'Type must be a valid URL.' ]})

	.describe('Create new event type in event source template where user does not have access')
	.post({	url: '/v1/eventTypes' }, function() {
		return {
			body: {
				name: 'Temperature Increase',
				description: 'Represent an increase in the temperature.',
				type: 'http://iflux.io/schemas/eventTypes/1',
				eventSourceTemplateId: this.getData('eventSourceTemplateId3'),
				schema: {
			    $schema: "http://json-schema.org/draft-04/schema#",
			    type: "object",
			    properties: {
			      sensorId: {
			        type: "string"
			      },
			      temperature: {
			        type: "object",
			        properties: {
			          old: {
			            type: "number"
			          },
			          new: {
			            type: "number"
			          }
			        }
			      }
			    }
			  }
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToHavePath('eventSourceTemplateId.0')
	.expectJsonToBe({ eventSourceTemplateId: [ 'No event source template found.' ]})

	.describe('Create new event type for first user in his first event source template')
	.post({
		url: '/v1/eventTypes',
		_storeData: function() { this.setData('locationEventType1', this.response.headers.location); }
	},
	function() {
		return {
			body: {
				name: 'Temperature Increase',
				description: 'Represent an increase in the temperature.',
				type: 'http://iflux.io/schemas/eventTypes/1',
				eventSourceTemplateId: this.getData('eventSourceTemplateId1'),
				schema: {
			    $schema: "http://json-schema.org/draft-04/schema#",
			    type: "object",
			    properties: {
			      sensorId: {
			        type: "string"
			      },
			      temperature: {
			        type: "object",
			        properties: {
			          old: {
			            type: "number"
			          },
			          new: {
			            type: "number"
			          }
			        }
			      }
			    }
			  }
			}
		};
	})
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventTypes/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('Create duplicated event type for first user in his first event source template')
	.post({ url: '/v1/eventTypes' }, function() {
		return {
			body: {
				name: 'Temperature Increase',
				description: 'Represent an increase in the temperature.',
				type: 'http://iflux.io/schemas/eventTypes/1',
				eventSourceTemplateId: this.getData('eventSourceTemplateId1'),
				schema: {
			    $schema: "http://json-schema.org/draft-04/schema#",
			    type: "object",
			    properties: {
			      sensorId: {
			        type: "string"
			      },
			      temperature: {
			        type: "object",
			        properties: {
			          old: {
			            type: "number"
			          },
			          new: {
			            type: "number"
			          }
			        }
			      }
			    }
			  }
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToHavePath('type.0')
	.expectJsonToBe({ type: [ 'Type must be unique.' ]})

	.describe('Create a second event type for first user in his first event source template')
	.post({
		url: '/v1/eventTypes',
		_storeData: function() { this.setData('locationEventType2', this.response.headers.location); }
	},
	function() {
		return {
			body: {
				name: 'Temperature Decrease',
				description: 'Represent an decrease in the temperature.',
				type: 'http://iflux.io/schemas/eventTypes/2',
				eventSourceTemplateId: this.getData('eventSourceTemplateId1'),
				schema: {
			    $schema: "http://json-schema.org/draft-04/schema#",
			    type: "object",
			    properties: {
			      sensorId: {
			        type: "string"
			      },
			      temperature: {
			        type: "object",
			        properties: {
			          old: {
			            type: "number"
			          },
			          new: {
			            type: "number"
			          }
			        }
			      }
			    }
			  }
			}
		};
	})
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventTypes/:id')

	.describe('Create new event type for first user in his second event source template')
	.post({
		url: '/v1/eventTypes',
		_storeData: function() { this.setData('locationEventType3', this.response.headers.location); }
	},
	function() {
		return {
			body: {
				name: 'Temperature Increase for thermometer 2',
				description: 'Represent an increase in the temperature.',
				type: 'http://iflux.io/schemas/eventTypes/3',
				eventSourceTemplateId: this.getData('eventSourceTemplateId2'),
				schema: {
			    $schema: "http://json-schema.org/draft-04/schema#",
			    type: "object",
			    properties: {
			      sensorId: {
			        type: "string"
			      },
			      temperature: {
			        type: "object",
			        properties: {
			          old: {
			            type: "number"
			          },
			          new: {
			            type: "number"
			          }
			        }
			      }
			    }
			  }
			}
		};
	})
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventTypes/:id')

	.describe('Create new event type for second user in his first event source template')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.post({
		url: '/v1/eventTypes',
		_storeData: function() { this.setData('locationEventType4', this.response.headers.location); }
	},
	function() {
		return {
			body: {
				name: 'Temperature change',
				description: 'Represent a modification in the temperature.',
				type: 'http://iflux.io/schemas/eventTypes/4',
				eventSourceTemplateId: this.getData('eventSourceTemplateId3'),
				schema: {
			    $schema: "http://json-schema.org/draft-04/schema#",
			    type: "object",
			    properties: {
			      sensorId: {
			        type: "string"
			      },
			      temperature: {
			        type: "object",
			        properties: {
			          old: {
			            type: "number"
			          },
			          new: {
			            type: "number"
			          }
			        }
			      }
			    }
			  }
			}
		};
	})
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventTypes/:id')

	.describe('Try to retrieve all the event types for first user without specifying the event source template.')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.get({ url: '/v1/eventTypes' })
	.expectStatusCode(422)
	.expectJsonToHavePath('eventSourceTemplateId.0')
	.expectJsonToBe({ eventSourceTemplateId: [ 'The event source template id is mandatory' ]})

	.describe('Try to retrieve all the event types for first user with non-existing event source template.')
	.get({}, function() { return { url: '/v1/eventTypes?eventSourceTemplateId=' + (this.getData('eventSourceTemplateId1') + 100) }; })
	.expectStatusCode(403)

	.describe('Retrieve all the event types of first event source template for first user')
	.get({}, function() { return { url: '/v1/eventTypes?eventSourceTemplateId=' + this.getData('eventSourceTemplateId1') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '0.type', '0.name', '1.type', '1.name', '0.eventSourceTemplateId', '1.eventSourceTemplateId', '0.schema', '1.schema' ])
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast([{
		name: 'Temperature Increase',
		description: 'Represent an increase in the temperature.',
		type: 'http://iflux.io/schemas/eventTypes/1',
		schema: {
	    $schema: "http://json-schema.org/draft-04/schema#",
	    type: "object",
	    properties: {
	      sensorId: {
	        type: "string"
	      },
	      temperature: {
	        type: "object",
	        properties: {
	          old: {
	            type: "number"
	          },
	          new: {
	            type: "number"
	          }
	        }
	      }
	    }
	  }
	}, {
		name: 'Temperature Decrease',
		description: 'Represent an decrease in the temperature.',
		type: 'http://iflux.io/schemas/eventTypes/2',
		schema: {
	    $schema: "http://json-schema.org/draft-04/schema#",
	    type: "object",
	    properties: {
	      sensorId: {
	        type: "string"
	      },
	      temperature: {
	        type: "object",
	        properties: {
	          old: {
	            type: "number"
	          },
	          new: {
	            type: "number"
	          }
	        }
	      }
	    }
	  }
	}])

	.describe('Retrieve all the event types of first event source template for first user filtered by name')
	.get({}, function() { return { url: '/v1/eventTypes?eventSourceTemplateId=' + this.getData('eventSourceTemplateId1') + '&name=%Increase' }; })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast([{
		name: 'Temperature Increase',
		description: 'Represent an increase in the temperature.',
		type: 'http://iflux.io/schemas/eventTypes/1',
		schema: {
	    $schema: "http://json-schema.org/draft-04/schema#",
	    type: "object",
	    properties: {
	      sensorId: {
	        type: "string"
	      },
	      temperature: {
	        type: "object",
	        properties: {
	          old: {
	            type: "number"
	          },
	          new: {
	            type: "number"
	          }
	        }
	      }
	    }
	  }
	}])

	.describe('Retrieve all the event types of second event source template for first user')
	.get({}, function() { return { url: '/v1/eventTypes?eventSourceTemplateId=' + this.getData('eventSourceTemplateId2') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.type', '0.name', '0.eventSourceTemplateId', '0.schema' ])
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast([{
		name: 'Temperature Increase for thermometer 2',
		description: 'Represent an increase in the temperature.',
		type: 'http://iflux.io/schemas/eventTypes/3',
		schema: {
	    $schema: "http://json-schema.org/draft-04/schema#",
	    type: "object",
	    properties: {
	      sensorId: {
	        type: "string"
	      },
	      temperature: {
	        type: "object",
	        properties: {
	          old: {
	            type: "number"
	          },
	          new: {
	            type: "number"
	          }
	        }
	      }
	    }
	  }
	}])

	.describe('Retrieve all the event types of first event source template for second user')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.get({}, function() { return { url: '/v1/eventTypes?eventSourceTemplateId=' + this.getData('eventSourceTemplateId3') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.type', '0.name', '0.eventSourceTemplateId', '0.schema' ])
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast([{
		name: 'Temperature change',
		description: 'Represent a modification in the temperature.',
		type: 'http://iflux.io/schemas/eventTypes/4',
		schema: {
	    $schema: "http://json-schema.org/draft-04/schema#",
	    type: "object",
	    properties: {
	      sensorId: {
	        type: "string"
	      },
	      temperature: {
	        type: "object",
	        properties: {
	          old: {
	            type: "number"
	          },
	          new: {
	            type: "number"
	          }
	        }
	      }
	    }
	  }
	}])

	.describe('First user updates his first event type')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.patch({}, function() {
		return {
			url: this.getData('locationEventType1'),
			body: {
				name: 'Temperature Increased renamed'
			}
		};
	})
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventTypes/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('No update sent must let the resource unchanged')
	.patch({}, function() {
		return {
			url: this.getData('locationEventType1'),
			body: {}
		};
	})
	.expectStatusCode(304)
	.expectLocationHeader('/v1/eventTypes/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('First user updates his first event type with the same type')
	.patch({}, function() {
		return {
			url: this.getData('locationEventType1'),
			body: {
				type: 'http://iflux.io/schemas/eventTypes/1'
			}
		};
	})
	.expectStatusCode(304)
	.expectLocationHeader('/v1/eventTypes/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('First user updates his first event type with invalid type')
	.patch({}, function() {
		return {
			url: this.getData('locationEventType1'),
			body: {
				type: '1234'
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ type: [ 'Type must be a valid URL.' ]})

	.describe('First user updates his first event type with different type but not unique')
	.patch({}, function() {
		return {
			url: this.getData('locationEventType1'),
			body: {
				type: 'http://iflux.io/schemas/eventTypes/2'
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ type: [ 'Type must be unique.' ]})

	.describe('First user updates his first event type with valid and unique different type')
	.patch({}, function() {
		return {
			url: this.getData('locationEventType1'),
			body: {
				type: 'http://iflux.io/schemas/eventTypes/11'
			}
		};
	})
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventTypes/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('Second user tries to update first event type of first user')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.patch({}, function() {
		return {
			url: this.getData('locationEventType1'),
			body: {
				name: 'Temperature Increase renamed by second user'
			}
		};
	})
	.expectStatusCode(403)
;