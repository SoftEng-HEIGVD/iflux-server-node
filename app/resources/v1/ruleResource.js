var
	_ = require('underscore'),
	express = require('express'),
  router = express.Router(),
	Handlebars = require('handlebars'),
	Rule = require('../../services/modelRegistry').rule,
	ruleDao = require('../../persistence/ruleDao');

module.exports = function (app) {
  app.use('/v1/rules', router);
};

function convertRule(rule) {
	return {
		id: rule.get('id'),
		reference: rule.get('reference'),
		description: rule.get('description'),
		enabled: rule.get('enabled'),
		if: {
			eventSource: rule.get('condition').source,
			eventType: rule.get('condition').eventType,
			eventProperties: rule.get('condition').properties
		},
		then: {
			actionTarget: rule.get('action').target,
			actionSchema: rule.get('action').actionSchema
		}
	};
}

router.route('/')
	/**
	 * GET /rules is invoked to get the list of all rules.
	 *
	 * @see {@link http://www.iflux.io/api/reference/#rules|REST API Specification}
	 */
	.get(function(req, res, next) {
		var promise = null;

		if (req.query.reference !== undefined) {
			promise = ruleDao.findByReference(req.query.reference);
		}
		else {
			promise = ruleDao.findAll();
		}

		promise
			.then(function(rules) {
				return res
					.status(200)
					.json(
						_.map(rules, function(rule) {
							return convertRule(rule);
						})
					)
					.end();
			})
			.then(null, function(err) {
				return next(err);
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
			.then(function(ruleSaved, err) {
				return res.status(201).location('/v1/rules/' + ruleSaved.id).end();
			})
			.error(function(err) {
				return next(err)
			});
	});

router.route('/actionSchema/validate')
	.post(function(req, res, next) {
		try {
			res.status(200).json(JSON.parse(Handlebars.compile(req.body.actionSchema)(req.body.sample))).end();
		}
		catch (err) {
			console.log(err);
			return res.status(422).json({
				error: err.toString()
			}).end();
		}
	});

router.route('/:id')
	/**
	 * GET /rules is invoked by clients to retrieve a rule.
	 *
	 * @see {@link http://www.iflux.io/api/reference/#rules|REST API Specification}
	 */
	.get(function(req, res, next) {
		return ruleDao
			.findById(req.params.id)
			.then(function(rule) {
				if (rule) {
					return res.status(200).json(convertRule(rule)).end();
				}
				else {
					return res.status(404).end();
				}
			});
	})

	/**
	 * PATCH /rules/:id is invoked by clients to update part of a rule.
	 * The body of the request is a partial single rule, defined by a source, an event type,
	 * a target and. The target is the root the API exposed by an iFLUX action
	 * target (e.g. http://gateway.org/api/).
	 *
	 * @see {@link http://www.iflux.io/api/reference/#rules|REST API Specification}
	 */
	.patch(function(req, res, next) {
		ruleDao
			.findById(req.params.id)
			.then(function(rule) {
				var ruleDefinition = req.body;

				if (ruleDefinition.description !== undefined) {
					rule.set('description', ruleDefinition.description);
				}

				if (ruleDefinition.enabled !== undefined) {
					rule.set('enabled', ruleDefinition.enabled);
				}

				if (ruleDefinition.if !== undefined) {
					rule.set('if',
						_.defaults({
							source: ruleDefinition.if.eventSource,
							eventType: ruleDefinition.if.eventType,
							properties: ruleDefinition.if.properties
						},
						rule.get('if')
					));
				}

				if (ruleDefinition.then !== undefined) {
					rule.set('then',
						_.defaults({
							target: ruleDefinition.then.actionTarget,
							actionSchema: ruleDefinition.actionSchema
						},
						rule.get('then')
					));
				}

				if (rule.hasChanged()) {
					return ruleDao
						.save(rule)
						.then(function() {
							res.status(200).location('/v1/rules/' + rule.id).end();
						});
				}
				else {
					return res.status(304).location('/v1/rules/' + rule.id).end();
				}
			})
			.then(null, function(err) {
				next(err);
			});
	})

	/**
	 * DELETE /rules/:id is invoked to delete one rule, identified by its unique id.
	 *
	 * @see {@link http://www.iflux.io/api/reference/#rules|REST API Specification}
	 */
	.delete(function(req, res, next) {
		ruleDao
			.deleteById(req.params.id)
			.then(function() {
				res.status(204).end();
			})
			.error(function(err) {
				next(err);
			});
	});
