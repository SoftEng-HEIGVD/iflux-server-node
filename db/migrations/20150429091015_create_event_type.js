'use strict';

exports.up = function(knex, Promise) {
	return knex.schema.createTable('event_types', function(table) {
		table.increments('id').notNullable().primary();
		table.string('name').notNullable();
		table.string('description');
		table.json('eventTypeSchema').notNullable();
		table.integer('event_source_template_id').references('event_source_templates.id');
		table.timestamps();

		table.unique([ 'event_source_template_id', 'name' ]);
	});

};

exports.down = function(knex, Promise) {
	return knex.schema
		.dropTable('event_types');
};
