var baseTest = require('../base');

var testSuite = baseTest('Rule evaluation');

testSuite
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
	.expectStatusCode(201);

testSuite
	.describe('Signin U1')
	.post({
		url: '/v1/auth/signin',
		body: {
			email: 'henri.dupont@localhost.localdomain',
			password: 'password'
		},
		_storeData: function() { this.setData('t1', this.response.body.token); }
	})
	.expectStatusCode(200);

testSuite
	.describe('Create Orga1')
	.jwtAuthentication(function() { return this.getData('t1'); })
	.post({
		url: '/v1/organizations',
		body: {
			name: 'Orga1'
		}
	})
	.storeLocationAs('organization', 1)
	.expectStatusCode(201);

testSuite
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
	.expectStatusCode(201);

testSuite
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
	.expectStatusCode(201);

testSuite
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
	.expectStatusCode(201);

testSuite
  .describe('U1 retrieves AT1 to store the generated identifier')
  .get({
    _storeData: function() { this.setData('actionTargetGID1', this.response.body.generatedIdentifier); }
  }, function() {
    return {
      url: this.getData('locationActionTarget1')
    };
  })
  .expectStatusCode(200);

testSuite
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
	.expectStatusCode(201);

testSuite
  .describe('U1 retrieves ES1 to store the generated identifier')
  .get({
    _storeData: function() {
      this.setData('eventSourceGID1', this.response.body.generatedIdentifier); }
  }, function() {
    return {
      url: this.getData('locationEventSource1')
    };
  })
  .expectStatusCode(200);

testSuite
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
	.expectStatusCode(201);

testSuite
  .describe('U1 retrieves action type AT1 to store the type')
  .get({
    _storeData: function() { this.setData('actionTypeType1', this.response.body.type); }
  }, function() {
    return {
      url: this.getData('locationActionType1')
    };
  })
  .expectStatusCode(200);

testSuite
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
	.expectStatusCode(201);

testSuite
  .describe('U1 retrieves event type ET1 to store the type')
  .get({
    _storeData: function() { this.setData('eventTypeType1', this.response.body.type); }
  }, function() {
    return {
      url: this.getData('locationEventType1')
    };
  })
  .expectStatusCode(200);

testSuite
	.describe('U1 creates Rule1 in Orga1 - ES + ET')
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
					actionTypeId: this.getData('actionTypeId1')
				}]
			}
		};
	})
	.storeLocationAs('rule', 1)
	.expectStatusCode(201);

testSuite
	.describe('U1 creates Rule2 in Orga1 - ET')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'Rule2',
				active: true,
				organizationId: this.getData('organizationId1'),
				conditions: [{
					eventTypeId: this.getData('eventTypeId1')
        }],
				transformations: [{
					actionTargetId: this.getData('actionTargetId1'),
					actionTypeId: this.getData('actionTypeId1')
				}]
			}
		};
	})
	.storeLocationAs('rule', 2)
	.expectStatusCode(201);

testSuite
	.describe('U1 creates Rule3 in Orga1 - ES')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'Rule3',
				active: true,
				organizationId: this.getData('organizationId1'),
				conditions: [{
          eventSourceId: this.getData('eventSourceId1')
        }],
				transformations: [{
					actionTargetId: this.getData('actionTargetId1'),
					actionTypeId: this.getData('actionTypeId1')
				}]
			}
		};
	})
	.storeLocationAs('rule', 3)
	.expectStatusCode(201);

testSuite
	.describe('U1 creates Rule4 in Orga1 - FN')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'Rule4',
				active: true,
				organizationId: this.getData('organizationId1'),
				conditions: [{
          fn: {
            expression: 'return event.properties.test == 1',
            sampleEvent: {
              test: 1
            }
          }
        }],
				transformations: [{
					actionTargetId: this.getData('actionTargetId1'),
					actionTypeId: this.getData('actionTypeId1')
				}]
			}
		};
	})
	.storeLocationAs('rule', 4)
	.expectStatusCode(201);

testSuite
	.describe('U1 creates Rule5 in Orga1 - ES + FN')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'Rule5',
				active: true,
				organizationId: this.getData('organizationId1'),
				conditions: [{
          eventSourceId: this.getData('eventSourceId1'),
          fn: {
            expression: 'return event.properties.test == 1',
            sampleEvent: {
              test: 1
            }
          }
        }],
				transformations: [{
					actionTargetId: this.getData('actionTargetId1'),
					actionTypeId: this.getData('actionTypeId1')
				}]
			}
		};
	})
	.storeLocationAs('rule', 5)
	.expectStatusCode(201);

testSuite
	.describe('U1 creates Rule6 in Orga1 - ET + FN')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'Rule6',
				active: true,
				organizationId: this.getData('organizationId1'),
				conditions: [{
          eventTypeId: this.getData('eventTypeId1'),
          fn: {
            expression: 'return event.properties.test == 1',
            sampleEvent: {
              test: 1
            }
          }
        }],
				transformations: [{
					actionTargetId: this.getData('actionTargetId1'),
					actionTypeId: this.getData('actionTypeId1')
				}]
			}
		};
	})
	.storeLocationAs('rule', 6)
	.expectStatusCode(201);

testSuite
	.describe('U1 creates Rule7 in Orga1 - ES + ET + FN')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'Rule7',
				active: true,
				organizationId: this.getData('organizationId1'),
				conditions: [{
          eventSourceId: this.getData('eventSourceId1'),
          eventTypeId: this.getData('eventTypeId1'),
          fn: {
            expression: 'return event.properties.test == 1',
            sampleEvent: {
              test: 1
            }
          }
        }],
				transformations: [{
					actionTargetId: this.getData('actionTargetId1'),
					actionTypeId: this.getData('actionTypeId1')
				}]
			}
		};
	})
	.storeLocationAs('rule', 7)
	.expectStatusCode(201);

testSuite
	.describe('U1 creates Rule8 in Orga1 - ES + ET - AT')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'Rule8',
				active: true,
				organizationId: this.getData('organizationId1'),
				conditions: [{
					eventSourceId: this.getData('eventSourceId1'),
					eventTypeId: this.getData('eventTypeId1')
        }],
				transformations: [{
					actionTargetId: this.getData('actionTargetId1'),
					actionTypeId: this.getData('actionTypeId1')
				}]
			}
		};
	})
	.storeLocationAs('rule', 8)
	.expectStatusCode(201);

testSuite
	.describe('U1 creates Rule9 in Orga1 - ES + ET - AT + ET')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'Rule9',
				active: true,
				organizationId: this.getData('organizationId1'),
				conditions: [{
					eventSourceId: this.getData('eventSourceId1'),
					eventTypeId: this.getData('eventTypeId1')
        }],
				transformations: [{
					actionTargetId: this.getData('actionTargetId1'),
					actionTypeId: this.getData('actionTypeId1'),
          eventTypeId: this.getData('eventTypeId1')
				}]
			}
		};
	})
	.storeLocationAs('rule', 9)
	.expectStatusCode(201);

testSuite
	.describe('U1 creates Rule10 in Orga1 - ES + ET - AT + FN')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'Rule10',
				active: true,
				organizationId: this.getData('organizationId1'),
				conditions: [{
					eventSourceId: this.getData('eventSourceId1'),
					eventTypeId: this.getData('eventTypeId1')
        }],
				transformations: [{
					actionTargetId: this.getData('actionTargetId1'),
					actionTypeId: this.getData('actionTypeId1'),
          fn: {
            expression: 'return { result: event.properties.test };',
            sample: {
              event: {
                test: 2
              }
            }
          }
				}]
			}
		};
	})
	.storeLocationAs('rule', 10)
	.expectStatusCode(201);

testSuite
	.describe('U1 creates Rule11 in Orga1 - ES + ET - AT + FN + ET')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'Rule11',
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
          fn: {
            expression: 'return { result: event.properties.test };',
            sample: {
              event: {
                test: 2
              }
            }
          }
				}]
			}
		};
	})
	.storeLocationAs('rule', 11)
	.expectStatusCode(201);

testSuite
	.describe('U1 creates Rule12 in Orga1 - ES - AT + FN + ET')
	.post({ url: '/v1/rules'}, function() {
		return {
			body: {
				name: 'Rule12',
				active: true,
				organizationId: this.getData('organizationId1'),
				conditions: [{
					eventSourceId: this.getData('eventSourceId1')
        }],
				transformations: [{
					actionTargetId: this.getData('actionTargetId1'),
					actionTypeId: this.getData('actionTypeId1'),
          eventTypeId: this.getData('eventTypeId1'),
          fn: {
            expression: 'return { result: event.properties.test };',
            sample: {
              event: {
                test: 2
              }
            }
          }
				}]
			}
		};
	})
	.storeLocationAs('rule', 12)
	.expectStatusCode(201);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// START - Conditions Validations
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

testSuite
  .describe('Validation of Rule1 - Match - ET + ST')
 	.post({}, function() {
    return {
      url: this.getData('locationRule1') + '/validate',
      body: {
        timestamp: new Date(),
        source: this.getData('eventSourceGID1'),
        type: this.getData('eventTypeType1'),
        properties: {
          test: 1
        }
      }
    };
  })
 	.expectStatusCode(200)
 	.expectJsonToBeAtLeast({
    matchedConditions: [{
      matchingBy: {
        conditionIndex: 0,
        source: true,
        type: true,
        function: false
      }
    }]
  });

testSuite
  .describe('Validation of Rule1 - No Match - ET + ST - Wrong ES')
 	.post({}, function() {
    return {
      url: this.getData('locationRule1') + '/validate',
      body: {
        timestamp: new Date(),
        source: this.getData('eventSourceGID1') + 'a',
        type: this.getData('eventTypeType1'),
        properties: {
          test: 1
        }
      }
    };
  })
 	.expectStatusCode(422)
 	.expectJsonToBe({ message: 'The event was not matched by the rule.' });

testSuite
  .describe('Validation of Rule1 - No Match - ET + ST - Wrong ET')
 	.post({}, function() {
    return {
      url: this.getData('locationRule1') + '/validate',
      body: {
        timestamp: new Date(),
        source: this.getData('eventSourceGID1'),
        type: this.getData('eventTypeType1') + 'a',
        properties: {
          test: 1
        }
      }
    };
  })
 	.expectStatusCode(422)
 	.expectJsonToBe({ message: 'The event was not matched by the rule.' });

testSuite
  .describe('Validation of Rule2 - Match - ET')
 	.post({}, function() {
    return {
      url: this.getData('locationRule2') + '/validate',
      body: {
        timestamp: new Date(),
        source: this.getData('eventSourceGID1'),
        type: this.getData('eventTypeType1'),
        properties: {
          test: 1
        }
      }
    };
  })
 	.expectStatusCode(200)
 	.expectJsonToBeAtLeast({
    matchedConditions: [{
      matchingBy: {
        conditionIndex: 0,
        source: false,
        type: true,
        function: false
      }
    }]
  });

testSuite
  .describe('Validation of Rule1 - No Match - ET - Wront ET')
 	.post({}, function() {
    return {
      url: this.getData('locationRule2') + '/validate',
      body: {
        timestamp: new Date(),
        type: this.getData('eventTypeType1') + 'a',
        properties: {
          test: 1
        }
      }
    };
  })
 	.expectStatusCode(422)
 	.expectJsonToBe({ message: 'The event was not matched by the rule.' });

testSuite
  .describe('Validation of Rule3 - Match - ES')
 	.post({}, function() {
    return {
      url: this.getData('locationRule3') + '/validate',
      body: {
        timestamp: new Date(),
        source: this.getData('eventSourceGID1'),
        properties: {
          test: 1
        }
      }
    };
  })
 	.expectStatusCode(200)
 	.expectJsonToBeAtLeast({
    matchedConditions: [{
      matchingBy: {
        conditionIndex: 0,
        source: true,
        type: false,
        function: false
      }
    }]
  });

testSuite
  .describe('Validation of Rule1 - No Match - ES - Wrong ES')
 	.post({}, function() {
    return {
      url: this.getData('locationRule3') + '/validate',
      body: {
        timestamp: new Date(),
        source: this.getData('eventSourceGID1') + 'a',
        properties: {
          test: 1
        }
      }
    };
  })
 	.expectStatusCode(422)
 	.expectJsonToBe({ message: 'The event was not matched by the rule.' });

testSuite
  .describe('Validation of Rule4 - Match - FN')
 	.post({}, function() {
    return {
      url: this.getData('locationRule4') + '/validate',
      body: {
        timestamp: new Date(),
        properties: {
          test: 1
        }
      }
    };
  })
 	.expectStatusCode(200)
 	.expectJsonToBeAtLeast({
    matchedConditions: [{
      matchingBy: {
        conditionIndex: 0,
        source: false,
        type: false,
        function: true
      }
    }]
  });

testSuite
  .describe('Validation of Rule4 - No Match - FN - Wrong FN')
 	.post({}, function() {
    return {
      url: this.getData('locationRule4') + '/validate',
      body: {
        timestamp: new Date(),
        properties: {
          test: 2
        }
      }
    };
  })
 	.expectStatusCode(422)
 	.expectJsonToBe({ message: 'The event was not matched by the rule.' });

testSuite
  .describe('Validation of Rule5 - Match - ES + FN')
 	.post({}, function() {
    return {
      url: this.getData('locationRule5') + '/validate',
      body: {
        timestamp: new Date(),
        source: this.getData('eventSourceGID1'),
        properties: {
          test: 1
        }
      }
    };
  })
 	.expectStatusCode(200)
 	.expectJsonToBeAtLeast({
    matchedConditions: [{
      matchingBy: {
        conditionIndex: 0,
        source: true,
        type: false,
        function: true
      }
    }]
  });

testSuite
  .describe('Validation of Rule5 - No Match - ES + FN - Wrong ES')
 	.post({}, function() {
    return {
      url: this.getData('locationRule5') + '/validate',
      body: {
        timestamp: new Date(),
        source: this.getData('eventSourceGID1') + 'a',
        properties: {
          test: 1
        }
      }
    };
  })
 	.expectStatusCode(422)
 	.expectJsonToBe({ message: 'The event was not matched by the rule.' });

testSuite
  .describe('Validation of Rule5 - No Match - ES + FN - Wrong FN')
 	.post({}, function() {
    return {
      url: this.getData('locationRule5') + '/validate',
      body: {
        timestamp: new Date(),
        source: this.getData('eventSourceGID1'),
        properties: {
          test: 2
        }
      }
    };
  })
 	.expectStatusCode(422)
 	.expectJsonToBe({ message: 'The event was not matched by the rule.' });

testSuite
  .describe('Validation of Rule6 - Match - ET + FN')
 	.post({}, function() {
    return {
      url: this.getData('locationRule6') + '/validate',
      body: {
        timestamp: new Date(),
        type: this.getData('eventTypeType1'),
        properties: {
          test: 1
        }
      }
    };
  })
 	.expectStatusCode(200)
 	.expectJsonToBeAtLeast({
    matchedConditions: [{
      matchingBy: {
        conditionIndex: 0,
        source: false,
        type: true,
        function: true
      }
    }]
  });

testSuite
  .describe('Validation of Rule6 - No Match - ET + FN - Wrong ET')
 	.post({}, function() {
    return {
      url: this.getData('locationRule6') + '/validate',
      body: {
        timestamp: new Date(),
        type: this.getData('eventTypeType1') + 'a',
        properties: {
          test: 1
        }
      }
    };
  })
 	.expectStatusCode(422)
 	.expectJsonToBe({ message: 'The event was not matched by the rule.' });

testSuite
  .describe('Validation of Rule6 - No Match - ET + FN - Wrong FN')
 	.post({}, function() {
    return {
      url: this.getData('locationRule6') + '/validate',
      body: {
        timestamp: new Date(),
        type: this.getData('eventTypeType1'),
        properties: {
          test: 2
        }
      }
    };
  })
 	.expectStatusCode(422)
 	.expectJsonToBe({ message: 'The event was not matched by the rule.' });

testSuite
  .describe('Validation of Rule7 - Match - ES + ET + FN')
 	.post({}, function() {
    return {
      url: this.getData('locationRule7') + '/validate',
      body: {
        timestamp: new Date(),
        source: this.getData('eventSourceGID1'),
        type: this.getData('eventTypeType1'),
        properties: {
          test: 1
        }
      }
    };
  })
 	.expectStatusCode(200)
 	.expectJsonToBeAtLeast({
    matchedConditions: [{
      matchingBy: {
        conditionIndex: 0,
        source: true,
        type: true,
        function: true
      }
    }]
  });

testSuite
  .describe('Validation of Rule7 - No Match - ES + ET + FN - Wrong ES')
 	.post({}, function() {
    return {
      url: this.getData('locationRule7') + '/validate',
      body: {
        timestamp: new Date(),
        source: this.getData('eventSourceGID1') + 'a',
        type: this.getData('eventTypeType1'),
        properties: {
          test: 1
        }
      }
    };
  })
 	.expectStatusCode(422)
 	.expectJsonToBe({ message: 'The event was not matched by the rule.' });

testSuite
  .describe('Validation of Rule7 - No Match - ES + ET + FN - Wrong ET')
 	.post({}, function() {
    return {
      url: this.getData('locationRule7') + '/validate',
      body: {
        timestamp: new Date(),
        source: this.getData('eventSourceGID1'),
        type: this.getData('eventTypeType1') + 'a',
        properties: {
          test: 1
        }
      }
    };
  })
 	.expectStatusCode(422)
 	.expectJsonToBe({ message: 'The event was not matched by the rule.' });

testSuite
  .describe('Validation of Rule7 - No Match - ES + ET + FN - Wrong FN')
 	.post({}, function() {
    return {
      url: this.getData('locationRule7') + '/validate',
      body: {
        timestamp: new Date(),
        source: this.getData('eventSourceGID1'),
        type: this.getData('eventTypeType1'),
        properties: {
          test: 2
        }
      }
    };
  })
 	.expectStatusCode(422)
 	.expectJsonToBe({ message: 'The event was not matched by the rule.' });

testSuite
  .describe('Validation of Rule7 - No Match - ES + ET + FN - Wrong ES + ET')
 	.post({}, function() {
    return {
      url: this.getData('locationRule7') + '/validate',
      body: {
        timestamp: new Date(),
        source: this.getData('eventSourceGID1') + 'a',
        type: this.getData('eventTypeType1') + 'a',
        properties: {
          test: 1
        }
      }
    };
  })
 	.expectStatusCode(422)
 	.expectJsonToBe({ message: 'The event was not matched by the rule.' });

testSuite
  .describe('Validation of Rule7 - No Match - ES + ET + FN - Wrong ES + FN')
 	.post({}, function() {
    return {
      url: this.getData('locationRule7') + '/validate',
      body: {
        timestamp: new Date(),
        source: this.getData('eventSourceGID1') + 'a',
        type: this.getData('eventTypeType1'),
        properties: {
          test: 2
        }
      }
    };
  })
 	.expectStatusCode(422)
 	.expectJsonToBe({ message: 'The event was not matched by the rule.' });

testSuite
  .describe('Validation of Rule7 - No Match - ES + ET + FN - Wrong ET + FN')
 	.post({}, function() {
    return {
      url: this.getData('locationRule7') + '/validate',
      body: {
        timestamp: new Date(),
        source: this.getData('eventSourceGID1'),
        type: this.getData('eventTypeType1') + 'a',
        properties: {
          test: 2
        }
      }
    };
  })
 	.expectStatusCode(422)
 	.expectJsonToBe({ message: 'The event was not matched by the rule.' });

testSuite
  .describe('Validation of Rule7 - No Match - ES + ET + FN - Wrong ES + ET + FN')
 	.post({}, function() {
    return {
      url: this.getData('locationRule7') + '/validate',
      body: {
        timestamp: new Date(),
        source: this.getData('eventSourceGID1') + 'a',
        type: this.getData('eventTypeType1') + 'a',
        properties: {
          test: 2
        }
      }
    };
  })
 	.expectStatusCode(422)
 	.expectJsonToBe({ message: 'The event was not matched by the rule.' });

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// START - Actions Validations
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

testSuite
  .describe('Validation of Rule8 - Match - ES + ET - AT')
 	.post({}, function() {
    return {
      url: this.getData('locationRule8') + '/validate',
      body: {
        timestamp: new Date(),
        source: this.getData('eventSourceGID1'),
        type: this.getData('eventTypeType1'),
        properties: {
          test: 1
        }
      }
    };
  })
 	.expectStatusCode(200)
 	.expectJsonToBeAtLeast(function() {
    return {
      matchedActions: [{
        matchingBy: {
          transformationIndex: 0,
          targetAndType: true
        },
        actionBody: {
          timestamp: new Date(),
          source: this.getData('eventSourceGID1'),
          type: this.getData('eventTypeType1'),
          properties: {
            test: 1
          }
        }
      }]
    };
  });

testSuite
  .describe('Validation of Rule9 - Match - ES + ET - AT + ET')
 	.post({}, function() {
    return {
      url: this.getData('locationRule9') + '/validate',
      body: {
        timestamp: new Date(),
        source: this.getData('eventSourceGID1'),
        type: this.getData('eventTypeType1'),
        properties: {
          test: 1
        }
      }
    };
  })
 	.expectStatusCode(200)
 	.expectJsonToBeAtLeast(function() {
    return {
      matchedActions: [{
        matchingBy: {
          transformationIndex: 0,
          targetAndType: true
        },
        actionBody: {
          timestamp: new Date(),
          source: this.getData('eventSourceGID1'),
          type: this.getData('eventTypeType1'),
          properties: {
            test: 1
          }
        }
      }]
    };
  });

testSuite
  .describe('Validation of Rule10 - Match - ES + ET - AT + FN')
 	.post({}, function() {
    return {
      url: this.getData('locationRule10') + '/validate',
      body: {
        timestamp: new Date(),
        source: this.getData('eventSourceGID1'),
        type: this.getData('eventTypeType1'),
        properties: {
          test: 1
        }
      }
    };
  })
 	.expectStatusCode(200)
 	.expectJsonToBeAtLeast(function() {
    return {
      matchedActions: [{
        matchingBy: {
          transformationIndex: 0,
          targetAndType: true
        },
        actionBody: {
          result: 1
        }
      }]
    };
  });

testSuite
  .describe('Validation of Rule11 - Match - ES + ET - AT + FN + ET')
 	.post({}, function() {
    return {
      url: this.getData('locationRule11') + '/validate',
      body: {
        timestamp: new Date(),
        source: this.getData('eventSourceGID1'),
        type: this.getData('eventTypeType1'),
        properties: {
          test: 1
        }
      }
    };
  })
 	.expectStatusCode(200)
 	.expectJsonToBeAtLeast(function() {
    return {
      matchedActions: [{
        matchingBy: {
          transformationIndex: 0,
          targetAndType: true
        },
        actionBody: {
          result: 1
        }
      }]
    };
  });

module.exports = testSuite;