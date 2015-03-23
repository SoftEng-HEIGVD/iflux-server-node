var
	_ = require('underscore'),
	mongoose = require('mongoose'),
	config = require('../config/config'),
	Schema = mongoose.Schema;

mongoose.connect(config.db);
var conn = mongoose.connection;

conn.on('error', function () {
  throw new Error('unable to connect to database at ' + config.db);
});

var oldActionSchema = new Schema({
	target: String,
	actionSchema: String
}, { collection: 'actions' });

mongoose.model('OldAction', oldActionSchema);
var OldAction = mongoose.model('OldAction');

var oldConditionSchema = new Schema({
	source: String,
	type: String,
	properties: Schema.Types.Mixed
}, { collection: 'conditions' });

mongoose.model('OldCondition', oldConditionSchema);
var OldCondition = mongoose.model('OldCondition');

var oldRuleSchema = new Schema({
	description: String,
	reference: String,
	enabled: Boolean,
	condition: { type: Schema.Types.ObjectId, ref: 'OldCondition' },
	action: { type: Schema.Types.ObjectId, ref: 'OldAction' }
}, { collection: 'rules' });

mongoose.model('OldRule', oldRuleSchema);
var OldRule = mongoose.model('OldRule');

var ruleSchema = new Schema({
  description: String,
	reference: String,
	enabled: Boolean,
	condition: {
		source: String,
		eventType: String,
		properties: Schema.Types.Mixed
	},
	action: {
		target: String,
		actionSchema: String
	}
}, { collection: 'rules' });

mongoose.model('Rule', ruleSchema);
var Rule = mongoose.model('Rule');

module.exports = {
	requiresDowntime: false, // true or false
	up: function(callback) {
		OldRule
			.find()
			.populate('action condition')
			.exec(function(err, rules) {
				var newRules = [];

				_.each(rules, function(oldRule) {
					var newRule = new Rule(_.pick(oldRule, '_id', 'description', 'reference', 'enabled', '__v'));

					newRule.action = _.pick(oldRule.action, 'target', 'actionSchema');
					newRule.condition = {
						source: oldRule.condition.source,
						eventType: oldRule.condition.type, // Name changed
						properties: oldRule.condition.properties
					};

					newRules.push(newRule);
				});

				Rule
					.remove({})
					.exec(function(err) {
						Rule
							.create(newRules, function(err) {
								conn.db.dropCollection('actions', function(err, result) {
									conn.db.dropCollection('conditions', function(err, result) {
										console.log("All rules migrated");
										callback();
									});
								});
							});
					});
			});
	},

	down: function(callback) {
		// your reverse migration goes here
		callback();
	},

	test: function(callback) {
		// your test goes here
		callback();
	}
};