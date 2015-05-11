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


	var eventSourceTemplate = timestamped({
		id: 1,
	  name: "iFlux thermometer",
	  public: true,
	  organization_id: organization.id,
	  configurationSchema: {
      $schema: "http://json-schema.org/draft-04/schema#",
      type: "object",
      properties: {
        captorId: {
          type: "string"
        }
      }
    },
    "configurationUrl": "http://some.cool.weather.service/configuration",
    "configurationToken": "<JSON Web Token>"
	});

	var eventType = timestamped({
		id: 1,
		eventTypeId: stringService.generateId(),
		event_source_template_id: eventSourceTemplate.id,
	  name: "ifluxTemperatureCaptor/increase",
	  description: "Temperature increase",
	  eventTypeSchema: {
	    $schema: "http://json-schema.org/draft-04/schema#",
	    type: "object",
	    properties: {
	      captorId: {
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

	return start()
		// Deletes ALL existing entries
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

		// Add an event source template
		.then(ins('event_source_templates', eventSourceTemplate))

		// Add an event type associated
		.then(ins('event_types', eventType));
};