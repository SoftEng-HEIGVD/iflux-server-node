var express = require('express');
var router = express.Router();

var RuleEngine = require('../services/ruleengine');
var ruleEngine = RuleEngine.ruleEngine;

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'iFLUX Server', ruleEngine: ruleEngine });
});

router.get('/rule-editor', function(req, res) {
  res.render('rule-editor', { title: 'iFLUX Rule Editor' });
});

module.exports = router;
