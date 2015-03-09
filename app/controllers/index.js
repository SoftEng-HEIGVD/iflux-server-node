var express = require('express'),
  router = express.Router(),
	ruleEngine = require('../services/ruleengine').ruleEngine;

module.exports = function (app) {
  app.use('/', router);
};

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'iFLUX Server', ruleEngine: ruleEngine });
});

router.get('/rule-editor', function(req, res) {
  res.render('rule-editor', { title: 'iFLUX Rule Editor' });
});
