var
	config = require('../../../config/config'),
	baseTest = require('../base');

module.exports = baseTest('Event type resource')
	.createUser('Register first user')
	.createUser('Register second user', { lastName: 'Dutoit', email: 'henri.dutoit@localhost.localdomain' })
	.signinUser('Signing first user')
	.signinUser('Signing first user', { email: 'henri.dutoit@localhost.localdomain' })
	.createOrganization('Create new organization for first user', { name: 'Orga 1' }, 1)
	.createOrganization('Create second organization for first user', { name: 'Orga 2' }, 1)
	.createOrganization('Create new organization for second user', { name: 'Orga 3' }, 2)

	.describe('Create ET1 (public) event type in organization with missing type')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.post({	url: '/v1/eventTypes' }, function() {
		return {
			body: {
				name: 'ET1',
				description: 'Represent an increase in the temperature.',
				public: true,
				organizationId: this.getData('organizationId1'),
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

	.describe('Create ET1 (public) event type in organization with invalid type')
	.post({	url: '/v1/eventTypes' }, function() {
		return {
			body: {
				name: 'ET1',
				description: 'Represent an increase in the temperature.',
				public: true,
				type: '1234',
				organizationId: this.getData('organizationId1'),
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

	.describe('Create ET1 event type with too short name')
	.post({	url: '/v1/eventTypes' }, function() {
		return {
			body: {
				name: 'ET',
				description: 'Represent an increase in the temperature.',
				public: true,
				type: 'http://iflux.io/schemas/eventTypes/1',
				organizationId: this.getData('organizationId1'),
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
	.expectJsonToHavePath('name.0')
	.expectJsonToBe({ name: [ 'The name must be at least 3 characters long' ]})

	.describe('Create ET1 (public) event type in organization where user does not have access')
	.post({	url: '/v1/eventTypes' }, function() {
		return {
			body: {
				name: 'ET1',
				description: 'Represent an increase in the temperature.',
				public: true,
				type: 'http://iflux.io/schemas/eventTypes/1',
				organizationId: this.getData('organizationId3'),
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
	.expectJsonToHavePath('organizationId.0')
	.expectJsonToBe({ organizationId: [ 'No organization found.' ]})

	.describe('Create ET1 event type for first user in his first organization')
	.post({ url: '/v1/eventTypes' }, function() {
		return {
			body: {
				name: 'ET1',
				description: 'Represent an increase in the temperature.',
				public: true,
				type: 'http://' + config.host + ':' + config.port + '/v1/schemas/eventTypes/1',
				organizationId: this.getData('organizationId1'),
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
	.storeLocationAs('eventType', 1)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventTypes/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('Try to re-create ET1 event type for first user in his first organization')
	.post({ url: '/v1/eventTypes' }, function() {
		return {
			body: {
				name: 'ET1',
				description: 'Represent an increase in the temperature.',
				public: true,
				type: 'http://' + config.host + ':' + config.port + '/v1/schemas/eventTypes/1/duplicated',
				organizationId: this.getData('organizationId1'),
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
	.expectJsonToBe({ name: [ 'Name is already taken in this organization.' ]})

	.describe('Re-create ET1 event type for first user in his second organization with the same name from one the first organization')
	.post({ url: '/v1/eventTypes' }, function() {
		return {
			body: {
				name: 'ET1',
				description: 'Represent an increase in the temperature.',
				public: true,
				type: 'http://' + config.host + ':' + config.port + '/v1/schemas/eventTypes/1/duplicated',
				organizationId: this.getData('organizationId2'),
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
	.storeLocationAs('eventType', 100)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventTypes/:id')

	.describe('Try to create ET1 event type for first user in his first organization with type already taken.')
	.post({ url: '/v1/eventTypes' }, function() {
		return {
			body: {
				name: 'ET1',
				description: 'Represent an increase in the temperature.',
				public: true,
				type: 'http://' + config.host + ':' + config.port + '/v1/schemas/eventTypes/1',
				organizationId: this.getData('organizationId1'),
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

	.describe('Create ET2 (private) event type for first user in his first organization')
	.post({ url: '/v1/eventTypes' }, function() {
		return {
			body: {
				name: 'ET2',
				description: 'Represent an decrease in the temperature.',
				public: false,
				type: 'http://iflux.io/schemas/eventTypes/2',
				organizationId: this.getData('organizationId1'),
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
	.storeLocationAs('eventType', 2)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventTypes/:id')

	.describe('Create ET3 event type for first user in his second organization')
	.post({ url: '/v1/eventTypes' }, function() {
		return {
			body: {
				name: 'ET3',
				description: 'Represent an increase in the temperature.',
				public: true,
				type: 'http://iflux.io/schemas/eventTypes/3',
				organizationId: this.getData('organizationId2'),
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
	.storeLocationAs('eventType', 3)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventTypes/:id')

	.describe('Create ET4 event type for second user in his first organization')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.post({ url: '/v1/eventTypes' }, function() {
		return {
			body: {
				name: 'ET4',
				description: 'Represent a modification in the temperature.',
				public: true,
				type: 'http://iflux.io/schemas/eventTypes/4',
				organizationId: this.getData('organizationId3'),
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
	.storeLocationAs('eventType', 4)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventTypes/:id')

	.describe('Retrieve all the event types for first user')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.get({ url: '/v1/eventTypes?allOrganizations' })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '2.id', '0.name', '1.name', '2.name', '0.public', '1.public', '2.public', '0.organizationId' ])
	.expectJsonCollectionToHaveSize(4)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'ET1',
			description: 'Represent an increase in the temperature.',
			public: true,
			type: 'http://' + config.host + ':' + config.port + '/v1/schemas/eventTypes/1',
			organizationId: this.getData('organizationId1'),
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
			name: 'ET2',
			description: 'Represent an decrease in the temperature.',
			public: false,
			type: 'http://iflux.io/schemas/eventTypes/2',
			organizationId: this.getData('organizationId1'),
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
			name: 'ET3',
			description: 'Represent an increase in the temperature.',
			public: true,
			type: 'http://iflux.io/schemas/eventTypes/3',
			organizationId: this.getData('organizationId2'),
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
			name: 'ET1',
			description: 'Represent an increase in the temperature.',
			public: true,
			type: 'http://' + config.host + ':' + config.port + '/v1/schemas/eventTypes/1/duplicated',
			organizationId: this.getData('organizationId2'),
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
		}];
	})

	.describe('Retrieve all the event types for first user filtered by name')
	.get({ url: '/v1/eventTypes?allOrganizations&name=%2' })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'ET2',
			description: 'Represent an decrease in the temperature.',
			public: false,
			type: 'http://iflux.io/schemas/eventTypes/2',
			organizationId: this.getData('organizationId1')
		}];
	})

	.describe('Retrieve all the event types for first user for the first organization')
	.get({}, function() { return { url: '/v1/eventTypes?organizationId=' + this.getData('organizationId1') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '1.id', '0.name', '1.name', '0.public', '1.public', '0.organizationId', '1.organizationId' ])
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'ET1',
			description: 'Represent an increase in the temperature.',
			public: true,
			type: 'http://' + config.host + ':' + config.port + '/v1/schemas/eventTypes/1',
			organizationId: this.getData('organizationId1')
		}, {
			name: 'ET2',
			description: 'Represent an decrease in the temperature.',
			public: false,
			type: 'http://iflux.io/schemas/eventTypes/2',
			organizationId: this.getData('organizationId1')
		}];
	})

	.describe('Retrieve all the event types for first user for the first organization filtered by name')
	.get({}, function() { return { url: '/v1/eventTypes?organizationId=' + this.getData('organizationId1') + '&name=%2'}; })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'ET2',
			description: 'Represent an decrease in the temperature.',
			public: false,
			type: 'http://iflux.io/schemas/eventTypes/2',
			organizationId: this.getData('organizationId1')
		}];
	})

	.describe('Retrieve all the event types for first user for the second organization')
	.get({}, function() { return { url: '/v1/eventTypes?organizationId=' + this.getData('organizationId2') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.name', '0.public', '0.organizationId' ])
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'ET3',
			description: 'Represent an increase in the temperature.',
			public: true,
			type: 'http://iflux.io/schemas/eventTypes/3',
			organizationId: this.getData('organizationId2')
		}, {
			name: 'ET1',
			description: 'Represent an increase in the temperature.',
			public: true,
			type: 'http://' + config.host + ':' + config.port + '/v1/schemas/eventTypes/1/duplicated',
			organizationId: this.getData('organizationId2')
		}];
	})

	.describe('Retrieve all the event types for second user')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.get({ url: '/v1/eventTypes' })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.name', '0.public', '0.organizationId', '1.id', '1.name', '1.public', '1.organizationId' ])
	.expectJsonCollectionToHaveSize(4)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'ET1',
			description: 'Represent an increase in the temperature.',
			public: true,
			type: 'http://' + config.host + ':' + config.port + '/v1/schemas/eventTypes/1',
			organizationId: this.getData('organizationId1')
		}, {
			name: 'ET3',
			description: 'Represent an increase in the temperature.',
			public: true,
			type: 'http://iflux.io/schemas/eventTypes/3',
			organizationId: this.getData('organizationId2')
		}, {
			name: 'ET4',
			description: 'Represent a modification in the temperature.',
			public: true,
			type: 'http://iflux.io/schemas/eventTypes/4',
			organizationId: this.getData('organizationId3')
		}, {
			name: 'ET1',
			description: 'Represent an increase in the temperature.',
			public: true,
			type: 'http://' + config.host + ':' + config.port + '/v1/schemas/eventTypes/1/duplicated',
			organizationId: this.getData('organizationId2')
		}];
	})

	.describe('Retrieve all the event types for second user filtered by name')
	.get({ url: '/v1/eventTypes?name=%4' })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'ET4',
			description: 'Represent a modification in the temperature.',
			public: true,
			type: 'http://iflux.io/schemas/eventTypes/4',
			organizationId: this.getData('organizationId3')
		}];
	})

	.describe('Try to retrieve all event types and all for a specific organization, only the specific organization is taken into account.')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.get({}, function() { return { url: '/v1/eventTypes?allOrganizations&organizationId=' + this.getData('organizationId2') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.name', '0.public', '0.organizationId' ])
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToBeAtLeast(function() {
		return [{
			name: 'ET3',
			description: 'Represent an increase in the temperature.',
			public: true,
			type: 'http://iflux.io/schemas/eventTypes/3',
			organizationId: this.getData('organizationId2')
		}, {
			name: 'ET1',
			description: 'Represent an increase in the temperature.',
			public: true,
			type: 'http://' + config.host + ':' + config.port + '/v1/schemas/eventTypes/1/duplicated',
			organizationId: this.getData('organizationId2')
		}];
	})

	.describe('Try to retrieve event type where the user is not member of the organization')
	.get({}, function() { return { url: this.getData('locationEventType1') + '100' }; })
	.expectStatusCode(403)

	.describe('First user updates ET1 event type')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.patch({}, function() {
		return {
			url: this.getData('locationEventType1'),
			body: {
				name: 'ET1 renamed'
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

	.describe('First user updates ET1 event type with the same type')
	.patch({}, function() {
		return {
			url: this.getData('locationEventType1'),
			body: {
				type: 'http://' + config.host + ':' + config.port + '/v1/schemas/eventTypes/1'
			}
		};
	})
	.expectStatusCode(304)
	.expectLocationHeader('/v1/eventTypes/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('First user updates ET1 event type with invalid type')
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

	.describe('First user updates ET1 event type with different type but not unique')
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

	.describe('First user updates ET1 event type with valid and unique different type')
	.patch({}, function() {
		return {
			url: this.getData('locationEventType1'),
			body: {
				type: 'http://' + config.host + ':' + config.port + '/v1/schemas/eventTypes/11'
			}
		};
	})
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventTypes/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('First user updates ET1 event type with a name used in a different organization')
	.patch({}, function() {
		return {
			url: this.getData('locationEventType1'),
			body: {
				name: 'ET3'
			}
		};
	})
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventTypes/:id')
	.expectHeaderToBePresent('x-iflux-generated-id')

	.describe('First user updates ET1 action type with a name used in the same organization')
	.patch({}, function() {
		return {
			url: this.getData('locationEventType1'),
			body: {
				name: 'ET2'
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ name: [ 'Name is already taken in this organization.' ]})

	.describe('Second user tries to update ET1 event type of first user')
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

	.describe('Retrieve an event type schema from its type (url).')
	.get({ url: '/v1/schemas/eventTypes/11' })
	.expectStatusCode(200)

	.describe('Retrieve an event type schema from its type (url) but nothing is found.')
	.get({ url: '/v1/schemas/eventTypes/111' })
	.expectStatusCode(404)
;