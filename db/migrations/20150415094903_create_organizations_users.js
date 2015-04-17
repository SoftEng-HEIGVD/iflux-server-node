'use strict';

exports.up = function(knex, Promise) {
	return knex.schema.createTable('organizations', function(table) {
		table.increments('id').primary();
		table.string('name').unique();
		table.timestamps();
	}).createTable('users', function(table) {
		table.increments('id').primary();
		table.string('email').unique();
		table.string('passwordHash');
		table.string('firstName');
		table.string('lastName');
		table.timestamps();
	}).createTable('organizations_users', function(table) {
		table.integer('organization_id').references('organizations.id');
		table.integer('user_id').references('users.id');
	});

};

exports.down = function(knex, Promise) {
	return knex.schema
		.dropTable('organizations_users')
		.dropTable('users')
		.dropTable('organizations');
};
