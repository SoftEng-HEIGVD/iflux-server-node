'use strict';

exports.up = function(knex, Promise) {
	return Promise.resolve()
		.then(function() { return knex.schema.table('event_types', function (table) { return table.integer('organization_id').references('organizations.id'); }); })
		.then(function() { return knex.raw('UPDATE event_types AS et SET organization_id = est.organization_id FROM event_source_templates AS est WHERE et.event_source_template_id = est.id'); })
		.then(function() { return knex.raw('ALTER TABLE event_types ALTER COLUMN organization_id SET NOT NULL'); })

		.then(function() { return knex.schema.table('action_types', function (table) { return table.integer('organization_id').references('organizations.id'); }); })
		.then(function() { return knex.raw('UPDATE action_types AS at SET organization_id = att.organization_id FROM action_target_templates AS att WHERE at.action_target_template_id = att.id'); })
		.then(function() { return knex.raw('ALTER TABLE action_types ALTER COLUMN organization_id SET NOT NULL'); })

		.then(function() { return knex.schema.table('event_types', function(table) { return table.dropColumn('event_source_template_id'); }); })
		.then(function() { return knex.schema.table('action_types', function(table) { return table.dropColumn('action_target_template_id'); }); })
	;
};

exports.down = function(knex, Promise) {
	// Cannot be undone
	return Promise;
};
