'use strict';

exports.up = function(knex, Promise) {
	return Promise.resolve()
		.then(function() { return knex.schema.table('event_sources', function (table) { return table.boolean('public'); }); })
		.then(function() { return knex.raw('UPDATE event_sources SET public = true'); })
		.then(function() { return knex.raw('ALTER TABLE event_sources ALTER COLUMN public SET NOT NULL'); })

		.then(function() { return knex.schema.table('action_targets', function (table) { return table.boolean('public'); }); })
		.then(function() { return knex.raw('UPDATE action_targets SET public = true'); })
		.then(function() { return knex.raw('ALTER TABLE action_targets ALTER COLUMN public SET NOT NULL'); })
	;
};

exports.down = function(knex, Promise) {
	return Promise.resolve()
		.then(function() { return knex.schema.table('event_sources', function(table) { return table.dropColumn('public'); }); })
		.then(function() { return knex.schema.table('action_targets', function(table) { return table.dropColumn('public'); }); })
	;
};
