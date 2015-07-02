'use strict';

exports.up = function(knex, Promise) {
	return Promise.resolve()
		.then(function() { return knex.raw('ALTER TABLE rules ALTER COLUMN name SET NOT NULL'); })
		.then(function() { return knex.raw('ALTER TABLE action_targets DROP CONSTRAINT action_targets_action_target_template_id_name_unique')})
		.then(function() { return knex.raw('ALTER TABLE event_sources DROP CONSTRAINT event_sources_event_source_template_id_name_unique')})
		.then(function() { return knex.raw('ALTER TABLE action_targets ADD CONSTRAINT action_targets_action_target_template_id_organization_id_name_unique UNIQUE (name, action_target_template_id, organization_id)')})
		.then(function() { return knex.raw('ALTER TABLE event_sources ADD CONSTRAINT event_sources_event_source_template_id_organization_id_name_unique UNIQUE (name, event_source_template_id, organization_id)')})
	;
};

exports.down = function(knex, Promise) {
	return Promise.resolve()
		.then(function() { return knex.raw('ALTER TABLE rules ALTER COLUMN name SET NULL'); })
		.then(function() { return knex.raw('ALTER TABLE action_targets DROP CONSTRAINT action_targets_action_target_template_id_organization_id_name_unique')})
		.then(function() { return knex.raw('ALTER TABLE event_sources DROP CONSTRAINT event_sources_event_source_template_id_organization_id_name_unique')})
		.then(function() { return knex.raw('ALTER TABLE action_targets ADD CONSTRAINT action_targets_action_target_template_id_name_unique  UNIQUE (name, action_target_template_id)')})
		.then(function() { return knex.raw('ALTER TABLE event_sources ADD CONSTRAINT event_sources_event_source_template_id_name_unique UNIQUE (name, event_source_template_id)')})
	;
};
