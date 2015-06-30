'use strict';

exports.up = function(knex, Promise) {
	return Promise.resolve()
		.then(function() { return knex.schema.table('event_types', function (table) { return table.renameColumn('eventTypeId', 'generatedIdentifier'); }); })
		.then(function() { return knex.schema.table('action_types', function (table) { return table.renameColumn('actionTypeId', 'generatedIdentifier'); }); })
		.then(function() { return knex.schema.table('event_sources', function (table) { return table.renameColumn('eventSourceId', 'generatedIdentifier'); }); })
		.then(function() { return knex.schema.table('action_targets', function (table) { return table.renameColumn('actionTargetId', 'generatedIdentifier'); }); })
	;
};

exports.down = function(knex, Promise) {
	return Promise.resolve()
		.then(function() { return knex.schema.table('event_types', function (table) { return table.renameColumn('generatedIdentifier', 'eventTypeId'); }); })
		.then(function() { return knex.schema.table('action_types', function (table) { return table.renameColumn('generatedIdentifier', 'actionTypeId'); }); })
		.then(function() { return knex.schema.table('event_sources', function (table) { return table.renameColumn('generatedIdentifier', 'eventSourceId'); }); })
		.then(function() { return knex.schema.table('action_targets', function (table) { return table.renameColumn('generatedIdentifier', 'actionTargetId'); }); })
	;
};
