'use strict';

exports.up = function(knex, Promise) {
	return Promise.resolve()
		.then(function() { return knex.raw('ALTER TABLE action_types ALTER COLUMN "actionTypeSchema" DROP NOT NULL'); })
    .then(function() { return knex.raw('ALTER TABLE event_types ALTER COLUMN "eventTypeSchema" DROP NOT NULL'); })
	;
};

exports.down = function(knex, Promise) {
	return Promise.resolve()
    .then(function() { return knex.raw('ALTER TABLE event_types ALTER COLUMN "eventTypeSchema" SET NOT NULL'); })
      .then(function() { return knex.raw('ALTER TABLE action_types ALTER COLUMN "actionTypeSchema" SET NOT NULL'); })
	;
};
