var
	_ = require('underscore'),
	express = require('express'),
  router = express.Router(),
  mongoose = require('mongoose'),
	Rule = mongoose.model('Rule'),
	Action = mongoose.model('Action'),
	Condition = mongoose.model('Condition'),
	ruleEngine = require('../services/ruleengine').ruleEngine,
	ruleDao = require('../persistence/ruleDao');

module.exports = function (app) {
  app.use('/rules', router);
};

router.route('/')
	/**
	 * GET /rules is invoked to get the list of all rules.
	 *
	 * @see {@link http://www.iflux.io/api/reference/#rules|REST API Specification}
	 */
	.get(function(req, res, next) {
		Rule
			.find()
			.populate('condition action')
			.exec(function(err, rules) {
				if (err) return next(err);

				res
					.status(200)
					.json(
						_.map(rules, function(rule) {
							return {
								id: rule.id,
								description: rule.description,
								if: {
									eventSource: rule.condition.source,
									eventType: rule.condition.type,
									eventProperties: rule.condition.properties
								},
								then: {
									actionTarget: rule.action.target,
									actionSchema: rule.action.actionSchema
								}
							};
						})
					)
					.end();
			});
	})

	/**
	 * POST /rules is invoked by clients to create a new rule.
	 * The body of the request is a single rule, defined by a source, an event type,
	 * a target and a transformation schema (handlebars template). The target is the
	 * root the API exposed by an iFLUX action target (e.g. http://gateway.org/api/).
	 *
	 * @see {@link http://www.iflux.io/api/reference/#rules|REST API Specification}
	 */
	.post(function(req, res, next) {
		var ruleDefinition = req.body;

		ruleDao
			.createAndSave(ruleDefinition)
			.then(function(ruleSaved) {
				res.status(201).location('/rules/' + ruleSaved.id).end();
			})
			.fail(function(err) {
				return next(err)
			});
	});


router.route('/:id')
	/**
	 * DELETE /rules/:id is invoked to delete one rule, identified by its unique id.
	 *
	 * @see {@link http://www.iflux.io/api/reference/#rules|REST API Specification}
	 */
	.delete(function(req, res, next) {
		Rule.findById(req.params.id, function(err, rule) {
			if (err) return next(err);

			if (rule === null) {
				return res.status(404).end();
			}
			else {
				rule.remove(function(err) {
					if (err) return next(err);

					res.status(204).end();
				});
			}
		})
	});
