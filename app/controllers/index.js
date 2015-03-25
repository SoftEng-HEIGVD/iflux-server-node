var express = require('express'),
  router = express.Router(),
	ruleDao = require('../persistence/ruleDao');

module.exports = function (app) {
  app.use('/', router);
};

/* GET home page. */
router.get('/', function(req, res) {
	ruleDao
		.findAll()
		.then(function(rules) {
			res.render('index', { title: 'iFLUX Server', rules: rules });
		});
});

router.get('/rule-editor', function(req, res) {
  res.render('rule-editor', { title: 'iFLUX Rule Editor' });
});
