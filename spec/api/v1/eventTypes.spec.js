var
	config = require('../../../config/config'),
	baseTest = require('../base');

var testSuite = baseTest('Event type resource')
	.createUser('Register first user')
	.createUser('Register second user', { lastName: 'Dutoit', email: 'henri.dutoit@localhost.localdomain' })
	.signinUser('Signing first user')
	.signinUser('Signing first user', { email: 'henri.dutoit@localhost.localdomain' })
	.createOrganization('Create new organization for first user', { name: 'Orga 1' }, 1)
	.createOrganization('Create second organization for first user', { name: 'Orga 2' }, 1)
	.createOrganization('Create new organization for second user', { name: 'Orga 3' }, 2);

testSuite
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
	.expectJsonToBe({ type: [ 'Type is mandatory.' ]});

testSuite
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
	.expectJsonToBe({ type: [ 'Type must be a valid URL.' ]});

testSuite
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
	.expectJsonToBe({ name: [ 'The name must be at least 3 characters long' ]});

testSuite
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
	.expectJsonToBe({ organizationId: [ 'No organization found.' ]});

testSuite
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
	.expectHeaderToBePresent('x-iflux-generated-id');

testSuite
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
	.expectJsonToBe({ name: [ 'Name is already taken in this organization.' ]});

testSuite
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
	.expectLocationHeader('/v1/eventTypes/:id');

testSuite
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
	.expectJsonToBe({ type: [ 'Type must be unique.' ]});

testSuite
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
	.expectLocationHeader('/v1/eventTypes/:id');

testSuite
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
	.expectLocationHeader('/v1/eventTypes/:id');

testSuite
	.describe('Create ET4 (public) event type for second user in his first organization')
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
	.expectLocationHeader('/v1/eventTypes/:id');

testSuite
	.describe('Create ET5 (private) event type for second user in his first organization')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.post({ url: '/v1/eventTypes' }, function() {
		return {
			body: {
				name: 'ET5',
				description: 'Represent a modification in the temperature.',
				public: false,
				type: 'http://iflux.io/schemas/eventTypes/5',
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
	.storeLocationAs('eventType', 5)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventTypes/:id');

testSuite
	.describe('Create ET6 (private) event type for second user in his first organization without schema')
	.post({ url: '/v1/eventTypes' }, function() {
		return {
			body: {
				name: 'ET6',
				description: 'Event type without schema to validate this is not mandatory.',
				public: false,
				type: 'http://iflux.io/schemas/eventTypes/6',
				organizationId: this.getData('organizationId3'),
			}
		};
	})
	.storeLocationAs('eventType', 6)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventTypes/:id');

testSuite
	.describe('Create ET7 (public) event type for second user in his first organization without schema')
	.post({ url: '/v1/eventTypes' }, function() {
		return {
			body: {
				name: 'ET7',
				description: 'Public event type',
				public: true,
				type: 'http://iflux.io/schemas/eventTypes/7',
				organizationId: this.getData('organizationId3')
			}
		};
	})
	.storeLocationAs('eventType', 7)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/eventTypes/:id');

testSuite
	.describe('Retrieve all the public event types for first user')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.get({ url: '/v1/eventTypes?public' })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.name', '0.public', '0.organizationId', '1.id', '1.name', '1.public', '1.organizationId' ])
	.expectJsonCollectionToHaveSize(5)
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
    }, {
      name: 'ET7',
      description: 'Public event type',
      public: true,
      type: 'http://iflux.io/schemas/eventTypes/7',
      organizationId: this.getData('organizationId3')
		}];
	});

testSuite
	.describe('Retrieve all the event types for first user filtered by name')
	.get({ url: '/v1/eventTypes?public=true&name=%4' })
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
	});

testSuite
	.describe('Retrieve all the event types for first user')
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
	});

testSuite
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
	});

testSuite
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
	});

testSuite
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
	});

testSuite
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
	});

testSuite
	.describe('Retrieve all the event types for second user')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.get({ url: '/v1/eventTypes' })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.name', '0.public', '0.organizationId', '1.id', '1.name', '1.public', '1.organizationId' ])
	.expectJsonCollectionToHaveSize(7)
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
			name: 'ET5',
			description: 'Represent a modification in the temperature.',
			public: false,
			type: 'http://iflux.io/schemas/eventTypes/5',
			organizationId: this.getData('organizationId3')
		}, {
			name: 'ET1',
			description: 'Represent an increase in the temperature.',
			public: true,
			type: 'http://' + config.host + ':' + config.port + '/v1/schemas/eventTypes/1/duplicated',
			organizationId: this.getData('organizationId2')
		}, {
      name: 'ET6',
      description: 'Event type without schema to validate this is not mandatory.',
      public: false,
      type: 'http://iflux.io/schemas/eventTypes/6',
      organizationId: this.getData('organizationId3'),
    }, {
      name: 'ET7',
      description: 'Public event type',
      public: true,
      type: 'http://iflux.io/schemas/eventTypes/7',
      organizationId: this.getData('organizationId3')
    }];
	});

testSuite
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
	});

testSuite
	.describe('Retrieve all the public event types for second user')
	.get({ url: '/v1/eventTypes?public' })
	.expectStatusCode(200)
	.expectJsonToHavePath([ '0.id', '0.name', '0.public', '0.organizationId', '1.id', '1.name', '1.public', '1.organizationId' ])
	.expectJsonCollectionToHaveSize(5)
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
		}, {
			name: 'ET1',
			description: 'Represent an increase in the temperature.',
			public: true,
			type: 'http://' + config.host + ':' + config.port + '/v1/schemas/eventTypes/1/duplicated',
			organizationId: this.getData('organizationId2')
    }, {
      name: 'ET7',
      description: 'Public event type',
      public: true,
      type: 'http://iflux.io/schemas/eventTypes/7',
      organizationId: this.getData('organizationId3')
		}];
	});

testSuite
	.describe('Retrieve all the event types for second user filtered by name')
	.get({ url: '/v1/eventTypes?public=true&name=%4' })
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
	});

testSuite
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
	});

testSuite
	.describe('First user retrieves public event type where the user is not member of the organization')
	.get({}, function() { return { url: this.getData('locationEventType7') }; })
	.expectStatusCode(200);

testSuite
	.describe('First user tries to retrieve private event type where the user is not member of the organization')
	.get({}, function() { return { url: this.getData('locationEventType6') }; })
	.expectStatusCode(403);

testSuite
	.describe('Try to retrieve event type where the user is not member of the organization')
	.get({}, function() { return { url: this.getData('locationEventType1') + '100' }; })
	.expectStatusCode(403);

testSuite
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
	.expectHeaderToBePresent('x-iflux-generated-id');

testSuite
	.describe('No update sent must let the resource unchanged')
	.patch({}, function() {
		return {
			url: this.getData('locationEventType1'),
			body: {}
		};
	})
	.expectStatusCode(304)
	.expectLocationHeader('/v1/eventTypes/:id')
	.expectHeaderToBePresent('x-iflux-generated-id');

testSuite
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
	.expectHeaderToBePresent('x-iflux-generated-id');

testSuite
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
	.expectJsonToBe({ type: [ 'Type must be a valid URL.' ]});

testSuite
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
	.expectJsonToBe({ type: [ 'Type must be unique.' ]});

testSuite
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
	.expectHeaderToBePresent('x-iflux-generated-id');

testSuite
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
	.expectHeaderToBePresent('x-iflux-generated-id');

testSuite
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
	.expectJsonToBe({ name: [ 'Name is already taken in this organization.' ]});

testSuite
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
	.expectStatusCode(403);

testSuite
	.describe('Retrieve an event type schema from its type (url).')
	.get({ url: '/v1/schemas/eventTypes/11' })
	.expectStatusCode(200);

testSuite
	.describe('Retrieve an event type schema from its type (url) but nothing is found.')
	.get({ url: '/v1/schemas/eventTypes/111' })
	.expectStatusCode(404);

testSuite
  .describe('First user remove ET1.')
 	.jwtAuthentication(function() { return this.getData('token1'); })
 	.delete({}, function() { return { url: this.getData('locationEventType1') }; })
 	.expectStatusCode(204);

testSuite
 	.describe('First user tries to retrieve ET1.')
 	.get({}, function() { return { url: this.getData('locationEventType1') }; })
 	.expectStatusCode(403);

testSuite
 	.describe('First user tries to delete ET4 in an organization where he is not a member.')
 	.delete({}, function() { return { url: this.getData('locationEventType4') }; })
 	.expectStatusCode(403);

module.exports = testSuite;