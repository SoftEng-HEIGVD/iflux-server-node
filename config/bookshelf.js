var config = require('./config');

var knex = require('knex')(config.knex);

module.exports = require('bookshelf')(knex);
