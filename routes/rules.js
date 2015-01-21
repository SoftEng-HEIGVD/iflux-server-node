var express = require('express');
var router = express.Router();
var RuleEngine = require('../services/ruleengine');

var ruleEngine = RuleEngine.ruleEngine;
var Rule = RuleEngine.Rule;
var Action = RuleEngine.Action;

/**
 * POST /rules is invoked by clients to create a new rule.
 * The body of the request is a single rule, defined by a source, an event type,
 * a target and a transformation schema (handlebars template). The target is the
 * root the API exposed by an iFLUX action target (e.g. http://gateway.org/api/).
 *
 * @see {@link http://www.iflux.io/api/reference/#rules|REST API Specification}
 */
router.post('/', function(req, res) {
  var ruleDefinition = req.body;  
  var ruleId = ruleEngine.addRule(new Rule(ruleDefinition));
  res.status(201).location("/rules/" + ruleId).send();
});

/**
 * GET /rules is invoked to get the list of all rules.
 *
 * @see {@link http://www.iflux.io/api/reference/#rules|REST API Specification}
 */
router.get('/', function(req, res) {
  res.status(200).send(ruleEngine.getRuleDefinitions());
});

/**
 * DELETE /rules/:id is invoked to delete one rule, identified by its unique id.
 *
 * @see {@link http://www.iflux.io/api/reference/#rules|REST API Specification}
 */
router.delete('/:id', function(req, res) {
  ruleEngine.deleteRule(req.params.id);
  res.status(204).send();
});
            
module.exports = router;
