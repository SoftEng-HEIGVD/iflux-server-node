var
	_ = require('underscore'),
	knexLogger = require('knex-logger'),
	securityService = require('../../app/services/securityService'),
	stringService = require('../../app/services/stringService');


'use strict';


exports.seed = function(knex, Promise) {
	knexLogger(knex);

	function timestamped(record) {
		return _.extend(record, {
			created_at: knex.raw("date('now')"),
			updated_at: knex.raw("date('now')")
		});
	}

	function start() {
		return Promise.resolve();
	}

	function del(table) {
		return function() {
			return knex(table).del();
		}
	}

	function ins(table, data) {
		return function() {
			return knex(table).insert(data);
		}
	}

	var organization = timestamped({
		id: 1,
		name: 'iFLUX'
	});

	var user = timestamped({
		id: 1,
		email: 'henri.dupont@localhost.localdomain',
		firstName: 'Henri',
		lastName: 'Dupont',
		passwordHash: securityService.hashPassword('password')
	});


	var eventSourceTemplate1 = timestamped({
		id: 1,
	  name: "iFlux thermometer",
	  public: true,
	  organization_id: organization.id,
	  configurationSchema: {
      $schema: "http://json-schema.org/draft-04/schema#",
      type: "object",
      properties: {
        sensorId: {
          type: "string"
        }
      }
    },
    "configurationUrl": "http://some.cool.weather.service/configuration",
    "configurationToken": "<JSON Web Token>"
	});

	var eventSourceTemplate2 = timestamped({
		id: 2,
	  name: "iFlux light sensor",
	  public: true,
	  organization_id: organization.id,
	  configurationSchema: {
      $schema: "http://json-schema.org/draft-04/schema#",
      type: "object",
      properties: {
        sensorId: {
          type: "string"
        }
      }
    },
    "configurationUrl": "http://some.cool.weather.service/configuration",
    "configurationToken": "<JSON Web Token>"
	});

	var eventType1 = timestamped({
		id: 1,
		eventTypeId: stringService.generateId(),
		event_source_template_id: eventSourceTemplate1.id,
		type: 'http://iflux.io/schemas/eventTypes/1',
	  name: "ifluxTemperatureSensor/increase",
	  description: "Temperature increase",
	  eventTypeSchema: {
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
	});

	var eventType2 = timestamped({
		id: 2,
		eventTypeId: stringService.generateId(),
		event_source_template_id: eventSourceTemplate1.id,
		type: 'http://iflux.io/schemas/eventTypes/2',
	  name: "ifluxTemperatureSensor/decrease",
	  description: "Temperature decrease",
	  eventTypeSchema: {
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
	});

	var eventType3 = timestamped({
		id: 3,
		eventTypeId: stringService.generateId(),
		event_source_template_id: eventSourceTemplate2.id,
		type: 'http://iflux.io/schemas/eventTypes/3',
	  name: "Light level",
	  description: "Measure the light level in a room",
	  eventTypeSchema: {
	    $schema: "http://json-schema.org/draft-04/schema#",
	    type: "object",
	    properties: {
	      sensorId: {
	        type: "string"
	      },
		    level: {
			    type: "integer"
		    }
	    }
	  }
	});

	var eventSource1 = timestamped({
		id: 1,
		event_source_template_id: eventSourceTemplate1.id,
		eventSourceId: stringService.generateId(),
	  name: "Thermometer 1",
	  organization_id: organization.id,
		configuration: {
			sensorId: "A"
		}
	});

	var eventSource2 = timestamped({
		id: 2,
		event_source_template_id: eventSourceTemplate1.id,
		eventSourceId: stringService.generateId(),
	  name: "Thermometer 2",
	  organization_id: organization.id,
		configuration: {
			sensorId: "B"
		}
	});

	var eventSource3 = timestamped({
		id: 3,
		event_source_template_id: eventSourceTemplate1.id,
		eventSourceId: stringService.generateId(),
	  name: "Thermometer 3",
	  organization_id: organization.id,
		configuration: {
			sensorId: "C"
		}
	});

	var eventSource4 = timestamped({
		id: 4,
		event_source_template_id: eventSourceTemplate2.id,
		eventSourceId: stringService.generateId(),
	  name: "Room 1",
	  organization_id: organization.id,
		configuration: {
			sensorId: "B23"
		}
	});

	var eventSource5 = timestamped({
		id: 5,
		event_source_template_id: eventSourceTemplate2.id,
		eventSourceId: stringService.generateId(),
	  name: "Room 2",
	  organization_id: organization.id,
		configuration: {
			sensorId: "C23"
		}
	});

	var actionTargetTemplate1 = timestamped({
		id: 1,
	  name: "iFlux radiator",
	  public: true,
	  organization_id: organization.id,
	  configurationSchema: {
      $schema: "http://json-schema.org/draft-04/schema#",
      type: "object",
      properties: {
        radiatorId: {
          type: "string"
        }
      }
    },
    configurationUrl: "http://some.cool.weather.service/configuration",
		configurationToken: "<JSON Web Token>",
		targetUrl: "http://some.cool.radior.service/actions",
		targetToken: "<JSON Web Token>"
	});

	var actionTargetTemplate2 = timestamped({
		id: 2,
	  name: "iFlux blind",
	  public: true,
	  organization_id: organization.id,
	  configurationSchema: {
      $schema: "http://json-schema.org/draft-04/schema#",
      type: "object",
      properties: {
        blindId: {
          type: "string"
        }
      }
    },
    configurationUrl: "http://some.cool.weather.service/configuration",
		configurationToken: "<JSON Web Token>",
		targetUrl: "http://some.cool.radior.service/actions",
		targetToken: "<JSON Web Token>"
	});

	var actionType1 = timestamped({
		id: 1,
		actionTypeId: stringService.generateId(),
		action_target_template_id: actionTargetTemplate1.id,
	  name: "Radiator increase",
	  description: "Raise the temperature of a radiator",
	  actionTypeSchema: {
	    $schema: "http://json-schema.org/draft-04/schema#",
	    type: "object",
	    properties: {
	      level: {
			    type: "integer"
		    }
	    }
	  }
	});

	var actionType2 = timestamped({
		id: 2,
		actionTypeId: stringService.generateId(),
		action_target_template_id: actionTargetTemplate1.id,
	  name: "Radiator decrease",
	  description: "Decrease the temperature of a radiator",
		actionTypeSchema: {
	    $schema: "http://json-schema.org/draft-04/schema#",
	    type: "object",
	    properties: {
	      level: {
			    type: "integer"
		    }
	    }
	  }
	});

	var actionType3 = timestamped({
		id: 3,
		actionTypeId: stringService.generateId(),
		action_target_template_id: actionTargetTemplate2.id,
	  name: "Blind action",
	  description: "Control the blinds",
		actionTypeSchema: {
	    $schema: "http://json-schema.org/draft-04/schema#",
	    type: "object",
	    properties: {
	      operation: {
			    type: "string"
		    }
	    }
	  }
	});

	var actionTarget1 = timestamped({
		id: 1,
		action_target_template_id: eventSourceTemplate1.id,
		actionTargetId: stringService.generateId(),
	  name: "Radiator 1",
	  organization_id: organization.id,
		configuration: {
			radiatorId: "123"
		}
	});

	var actionTarget2 = timestamped({
		id: 2,
		action_target_template_id: eventSourceTemplate1.id,
		actionTargetId: stringService.generateId(),
	  name: "Radiator 2",
	  organization_id: organization.id,
		configuration: {
			radiatorId: "456"
		}
	});

	var actionTarget3 = timestamped({
		id: 3,
		action_target_template_id: eventSourceTemplate1.id,
		actionTargetId: stringService.generateId(),
	  name: "Radiator 3",
	  organization_id: organization.id,
		configuration: {
			radiatorId: "789"
		}
	});

	var actionTarget4 = timestamped({
		id: 4,
		action_target_template_id: eventSourceTemplate2.id,
		actionTargetId: stringService.generateId(),
	  name: "Blind 1",
	  organization_id: organization.id,
		configuration: {
			blindId: "123123"
		}
	});

	var actionTarget5 = timestamped({
		id: 5,
		action_target_template_id: eventSourceTemplate2.id,
		actionTargetId: stringService.generateId(),
	  name: "Blind 2",
	  organization_id: organization.id,
		configuration: {
			blindId: "456456"
		}
	});

	var actionTarget6 = timestamped({
		id: 6,
		action_target_template_id: eventSourceTemplate2.id,
		actionTargetId: stringService.generateId(),
	  name: "Blind 3",
	  organization_id: organization.id,
		configuration: {
			blindId: "789789"
		}
	});

	var rule1 = timestamped({
		name: "Increase of the temperature",
		active: true,
		organization_id: organization.id,
		conditions: JSON.stringify([{
			description: "Match if the temperature has increased on the first thermometer.",
			eventSourceKey: eventSource1.eventSourceId,
			eventSourceId: eventSource1.id,
			eventTypeKey: eventType1.eventTypeId,
			eventTypeId: eventType1.id,
			fn: "return event.properties.temperature.old < event.properties.temperature.new;",
			sampleEvent: {
				temperature: {
					old: 14,
					new: 13
				}
			}
		}]),
		transformations: JSON.stringify([{
			description: "Prepare an action to reduce the radiator temperature.",
			actionTargetKey: actionTarget1.actionTargetId,
			actionTargetId: actionTarget1.id,
			eventTypeKey: eventType1.eventTypeId,
			eventTypeId: eventType1.id,
			actionTypeKey: actionType2.actionTypeId,
			actionTypeId: actionType2.id,
			fn: "return { reduce: event.properties.temperature.new - event.properties.temperature.old };",
			sampleEvent: {
				temperature: {
					old: 14,
					new: 13
				}
			},
			eventSourceTemplateId: eventSource1.eventSourceId
		}])
	});

	return start()
		// Deletes ALL existing entries
		.then(del('rules'))
		.then(del('action_targets'))
		.then(del('action_types'))
		.then(del('action_target_templates'))
		.then(del('event_sources'))
		.then(del('event_types'))
		.then(del('event_source_templates'))
		.then(del('organizations_users'))
		.then(del('users'))
		.then(del('organizations'))

		// Add new organization
		.then(ins('organizations', organization))

		// Add new user
		.then(ins('users', user))

		// Link the organization with the user
		.then(ins('organizations_users', {
			organization_id: organization.id,
			user_id: user.id
		}))

		// Add event source templates
		.then(ins('event_source_templates', eventSourceTemplate1))
		.then(ins('event_source_templates', eventSourceTemplate2))

		// Add event types
		.then(ins('event_types', eventType1))
		.then(ins('event_types', eventType2))
		.then(ins('event_types', eventType3))

		// Add event sources
		.then(ins('event_sources', eventSource1))
		.then(ins('event_sources', eventSource2))
		.then(ins('event_sources', eventSource3))
		.then(ins('event_sources', eventSource4))
		.then(ins('event_sources', eventSource5))

		// Add action target templates
		.then(ins('action_target_templates', actionTargetTemplate1))
		.then(ins('action_target_templates', actionTargetTemplate2))

		// Add action types
		.then(ins('action_types', actionType1))
		.then(ins('action_types', actionType2))
		.then(ins('action_types', actionType3))

		// Add action targets
		.then(ins('action_targets', actionTarget1))
		.then(ins('action_targets', actionTarget2))
		.then(ins('action_targets', actionTarget3))
		.then(ins('action_targets', actionTarget4))
		.then(ins('action_targets', actionTarget5))
		.then(ins('action_targets', actionTarget6))

		// Add rules
		.then(ins('rules', rule1))
	;
};