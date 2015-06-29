'use strict';

exports.up = function(knex, Promise) {
	return Promise.resolve()
		.then(function() { return knex.schema.table('event_types', function (table) { return table.boolean('public'); }); })
		.then(function() { return knex.raw('UPDATE event_types SET public = true'); })
		.then(function() { return knex.raw('ALTER TABLE event_types ALTER COLUMN public SET NOT NULL'); })

		.then(function() { return knex.schema.table('action_types', function (table) { return table.boolean('public'); }); })
		.then(function() { return knex.raw('UPDATE action_types SET public = true'); })
		.then(function() { return knex.raw('ALTER TABLE action_types ALTER COLUMN public SET NOT NULL'); })
	;
};

exports.down = function(knex, Promise) {
	return Promise.resolve()
		.then(function() { return knex.schema.table('event_types', function(table) { return table.dropColumn('public'); }); })
		.then(function() { return knex.schema.table('action_types', function(table) { return table.dropColumn('public'); }); })
	;
};
