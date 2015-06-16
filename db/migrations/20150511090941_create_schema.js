'use strict';

exports.up = function(knex, Promise) {
	return knex.schema
		// Create the ORGANIZATION table
		.createTable('organizations', function(table) {
			table.increments('id').notNullable().primary();
			table.string('name').notNullable().unique();
			table.timestamps();
		})

		// Create the USER table
		.createTable('users', function(table) {
			table.increments('id').notNullable().primary();
			table.string('email').notNullable().unique();
			table.string('passwordHash').notNullable();
			table.string('firstName');
			table.string('lastName');
			table.timestamps();
		})

		// Create the ORGANIZATION/USER map table
		.createTable('organizations_users', function(table) {
			table.integer('organization_id').notNullable().references('organizations.id');
			table.integer('user_id').notNullable().references('users.id');
		})

		// Create the RULE table
		.createTable('rules', function(table) {
			table.increments('id').primary();
			table.string('name');
			table.string('description');
			table.boolean('active');
			table.json('conditions');
			table.json('transformations');
			table.integer('organization_id').notNullable().references('organizations.id');
			table.timestamps();
		})

		// Create the EVENT SOURCE TEMPLATE table
		.createTable('event_source_templates', function(table) {
			table.increments('id').notNullable().primary();
			table.string('name').notNullable();
			table.json('configurationSchema');
			table.string('configurationUrl');
			table.string('configurationToken');
			table.json('configurationUi');
			table.boolean('public').notNullable();
			table.integer('organization_id').notNullable().references('organizations.id');
			table.timestamps();

			table.unique([ 'organization_id', 'name' ]);
		})

		// Create the EVENT SOURCE INSTANCE table
		.createTable('event_source_instances', function(table) {
			table.increments('id').notNullable().primary();
			table.string('eventSourceInstanceId').notNullable();
			table.string('name').notNullable();
			table.json('configuration');
			table.integer('event_source_template_id').references('event_source_templates.id');
			table.integer('organization_id').notNullable().references('organizations.id');
			table.timestamps();

			table.unique([ 'event_source_template_id', 'name' ]);
		})

		// Create the EVENT TYPE table
		.createTable('event_types', function(table) {
			table.increments('id').notNullable().primary();
			table.string('eventTypeId').notNullable();
			table.string('type').notNullable();
			table.string('name').notNullable();
			table.string('description');
			table.json('eventTypeSchema').notNullable();
			table.integer('event_source_template_id').references('event_source_templates.id');
			table.timestamps();

			table.unique([ 'event_source_template_id', 'name' ]);
			table.unique([ 'eventTypeId' ]);
		})

		// Create the ACTION TARGET TEMPLATE table
		.createTable('action_target_templates', function(table) {
			table.increments('id').notNullable().primary();
			table.string('name').notNullable();
			table.json('configurationSchema');
			table.string('configurationUrl');
			table.string('configurationToken');
			table.json('configurationUi');
			table.string('targetUrl');
			table.string('targetToken');
			table.boolean('public').notNullable();
			table.integer('organization_id').notNullable().references('organizations.id');
			table.timestamps();

			table.unique([ 'organization_id', 'name' ]);
		})

		// Create the ACTION TARGET INSTANCE table
		.createTable('action_target_instances', function(table) {
			table.increments('id').notNullable().primary();
			table.string('actionTargetInstanceId').notNullable();
			table.string('name').notNullable();
			table.json('configuration');
			table.integer('action_target_template_id').references('action_target_templates.id');
			table.integer('organization_id').notNullable().references('organizations.id');
			table.timestamps();

			table.unique([ 'action_target_template_id', 'name' ]);
		})

		// Create the ACTION TYPE table
		.createTable('action_types', function(table) {
			table.increments('id').notNullable().primary();
			table.string('actionTypeId').notNullable();
			table.string('type').notNullable();
			table.string('name').notNullable();
			table.string('description');
			table.json('actionTypeSchema').notNullable();
			table.integer('action_target_template_id').references('action_target_templates.id');
			table.timestamps();

			table.unique([ 'action_target_template_id', 'name' ]);
		});
};

exports.down = function(knex, Promise) {
	return knex.schema
		.dropTable('action_types')
		.dropTable('action_target_instances')
		.dropTable('action_target_templates')
		.dropTable('event_types')
		.dropTable('event_source_instances')
		.dropTable('event_source_templates')
		.dropTable('rules')
		.dropTable('organizations_users')
		.dropTable('users')
		.dropTable('organizations')
	;
};
