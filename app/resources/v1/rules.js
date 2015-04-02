var
	_ = require('underscore'),
	express = require('express'),
  router = express.Router(),
  mongoose = require('mongoose'),
	Handlebars = require('handlebars'),
	Rule = mongoose.model('Rule'),
	ruleDao = require('../../persistence/ruleDao'),
	dao = require('../../persistence/dao');

module.exports = function (app) {
  app.use('/v1/rules', router);
};

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
							return {
								id: rule.id,
								reference: rule.reference,
								description: rule.description,
								enabled: rule.enabled,
								if: {
									eventSource: rule.condition.source,
									eventType: rule.condition.eventType,
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
			.then(function(ruleSaved) {
				return res.status(201).location('/v1/rules/' + ruleSaved.id).end();
			})
			.fail(function(err) {
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
	 * PATCH /rules is invoked by clients to update part of a rule.
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

				var updated = false;

				if (ruleDefinition.description !== undefined) {
					rule.description = ruleDefinition.description;
					updated = true;
				}

				if (ruleDefinition.enabled !== undefined) {
					rule.enabled = ruleDefinition.enabled;
					updated = true;
				}

				if (ruleDefinition.if !== undefined) {
					var ifPayload = ruleDefinition.if;

					if (ifPayload.eventSource !== undefined) {
						rule.condition.source = ifPayload.eventSource;
						updated = true;
					}

					if (ifPayload.eventType !== undefined) {
						rule.condition.eventType = ifPayload.eventType;
						updated = true;
					}

					if (ifPayload.eventProperties !== undefined) {
						rule.condition.properties = ifPayload.eventProperties;
						updated = true;
					}
				}

				if (ruleDefinition.then !== undefined) {
					var thenPayload = ruleDefinition.then;

					if (thenPayload.actionTarget !== undefined) {
						rule.action.target = thenPayload.actionTarget;
						updated = true;
					}

					if (thenPayload.actionSchema !== undefined) {
						rule.action.actionSchema = thenPayload.actionSchema;
						updated = true;
					}
				}

				var promise = null;

				if (updated) {
					promise = dao.save(rule);
				}

				return promise.then(function() {
					res.status(200).location('/v1/rules/' + rule.id).end();
				})
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