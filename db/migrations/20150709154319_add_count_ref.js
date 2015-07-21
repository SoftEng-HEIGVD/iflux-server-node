'use strict';

exports.up = function(knex, Promise) {
	return Promise.resolve()
		.then(function() { return knex.schema.table('action_types', function (table) { return table.integer('refCount'); }); })
		.then(function() { return knex.schema.table('action_target_templates', function (table) { return table.integer('refCount'); }); })
		.then(function() { return knex.schema.table('action_targets', function (table) { return table.integer('refCount'); }); })
		.then(function() { return knex.schema.table('event_types', function (table) { return table.integer('refCount'); }); })
		.then(function() { return knex.schema.table('event_source_templates', function (table) { return table.integer('refCount'); }); })
		.then(function() { return knex.schema.table('event_sources', function (table) { return table.integer('refCount'); }); })
	;
};

exports.down = function(knex, Promise) {
	return Promise.resolve()
		.then(function() { return knex.schema.table('action_types', function(table) { return table.dropColumn('refCount'); }); })
		.then(function() { return knex.schema.table('action_target_templates', function(table) { return table.dropColumn('refCount'); }); })
		.then(function() { return knex.schema.table('action_targets', function(table) { return table.dropColumn('refCount'); }); })
		.then(function() { return knex.schema.table('event_types', function(table) { return table.dropColumn('refCount'); }); })
		.then(function() { return knex.schema.table('event_source_templates', function(table) { return table.dropColumn('refCount'); }); })
		.then(function() { return knex.schema.table('event_sources', function(table) { return table.dropColumn('refCount'); }); })
	;
};
