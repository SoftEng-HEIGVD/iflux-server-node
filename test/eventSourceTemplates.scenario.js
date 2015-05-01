var
	_ = require('underscore'),
	copilot = require('api-copilot'),
	utils = require('./utils');

var scenario = new copilot.Scenario({
  name: 'Organization resource',
	defaultRequestOptions: {
		json: true
	}
});

var
	tokenUser1 = null,
	tokenUser2 = null,
	organizationId1 = null,
	organizationId2 = null,
	organizationId3 = null,
	location = null;

scenario
	.step('configure base URL', function() {
		return this.configure({
			baseUrl: 'http://localhost:' + require('../config/config').port
		});
	})

	.step('register user 1', function() {
		return this.post({
			url: '/v1/auth/register',
			body: {
				firstName: 'Henri',
				lastName: 'Dupont',
				email: 'henri.dupont@localhost.localdomain',
				password: 'password',
				passwordConfirmation: 'password'
			}
		});
	})

	.step('register user 2', function() {
		return this.post({
			url: '/v1/auth/register',
			body: {
				firstName: 'Henri',
				lastName: 'Dutoit',
				email: 'henri.dutoit@localhost.localdomain',
				password: 'password',
				passwordConfirmation: 'password'
			}
		});
	})

	.step('signin user 1', function() {
		return this.post({
			url: '/v1/auth/signin',
			body: {
				email: 'henri.dupont@localhost.localdomain',
				password: 'password'
			}
		});
	})

	.step('retrieve token user 1', function(response) {
		tokenUser1 = response.body.token;
	})

	.step('signin user 2', function() {
		return this.post({
			url: '/v1/auth/signin',
			body: {
				email: 'henri.dutoit@localhost.localdomain',
				password: 'password'
			}
		});
	})

	.step('retrieve token user 2', function(response) {
		tokenUser2 = response.body.token;
	})

	.step('create a new organization with user 1', function() {
		return this.post({
			url: '/v1/organizations',
			headers: {
				authorization: 'Bearer ' + tokenUser1
			},
			body: {
				name: 'iFLUX'
			}
		});
	})

	.step('check: create a new organization with user 1', function(response) {
		utils.statusCode(response, 201);

		// TODO: Find a better way to check location header
		//utils.headers(response, {
		//	location: '/v1/me/organizations/1'
		//});

		organizationId1 = utils.extractLocationId(response);
	})

	.step('create another organization with user 1', function() {
		return this.post({
			url: '/v1/organizations',
			headers: {
				authorization: 'Bearer ' + tokenUser1
			},
			body: {
				name: 'Another orga for user 1'
			}
		});
	})

	.step('check: create another organization with user 1', function(response) {
		utils.statusCode(response, 201);

		// TODO: Find a better way to check location header
		//utils.headers(response, {
		//	location: '/v1/me/organizations/1'
		//});

		organizationId3 = utils.extractLocationId(response);
	})

	.step('create a new organization with user 2', function() {
		return this.post({
			url: '/v1/organizations',
			headers: {
				authorization: 'Bearer ' + tokenUser2
			},
			body: {
				name: 'Another orga'
			}
		});
	})

	.step('check: create a new organization with user 2', function(response) {
		utils.statusCode(response, 201);

		// TODO: Find a better way to check location header
		//utils.headers(response, {
		//	location: '/v1/me/organizations/1'
		//});

		organizationId2 = utils.extractLocationId(response);
	})

	.step('create new event source template in wrong organization', function() {
		return this.post({
			url: '/v1/eventSourceTemplates',
			headers: {
				authorization: 'Bearer ' + tokenUser1
			},
			body: {
		    name: "iFlux thermometer",
		    public: true,
		    organizationId: organizationId2
			}
		});
	})

	.step('check: create new event source template in wrong organization', function(response) {
		utils.statusCode(response, 422);
		utils.checkError(response, 'organizationId', 'No organization found.');
	})

	.step('create new event source template (public) for user 1', function() {
		return this.post({
			url: '/v1/eventSourceTemplates',
			headers: {
				authorization: 'Bearer ' + tokenUser1
			},
			body: {
		    name: "iFlux thermometer",
		    public: true,
		    organizationId: organizationId1
			}
		});
	})

	.step('check: create new event source template (public) for user 1', function(response) {
		utils.statusCode(response, 201);
		utils.checkLocation(response, '/v1/eventSourceTemplates/:id')
	})

	.step('create new event source template (private) for user 1', function() {
		return this.post({
			url: '/v1/eventSourceTemplates',
			headers: {
				authorization: 'Bearer ' + tokenUser1
			},
			body: {
		    name: "iFlux thermometer private",
		    public: false,
		    organizationId: organizationId1
			}
		});
	})

	.step('check: create new event source template (private) for user 1', function(response) {
		utils.statusCode(response, 201);
		utils.checkLocation(response, '/v1/eventSourceTemplates/:id')
	})


	.step('create another event source template (public) for user 1', function() {
		return this.post({
			url: '/v1/eventSourceTemplates',
			headers: {
				authorization: 'Bearer ' + tokenUser1
			},
			body: {
		    name: "iFlux thermometer private for another organization",
		    public: false,
		    organizationId: organizationId3
			}
		});
	})

	.step('check: create another event source template (public) for user 1', function(response) {
		utils.statusCode(response, 201);
		utils.checkLocation(response, '/v1/eventSourceTemplates/:id')
	})

	.step('get all the event source templates for user 1', function() {
		return this.get({
			url: '/v1/eventSourceTemplates?allOrganizations',
			headers: {
				authorization: 'Bearer ' + tokenUser1
			}
		});
	})

	.step('check: get all event source templates for user 1', function(response) {
		utils.statusCode(response, 200);
		utils.size(response, 3);
	})

	.step('get all the event source templates for user 1 for organization 1', function() {
		return this.get({
			url: '/v1/eventSourceTemplates?organizationId=' + organizationId1,
			headers: {
				authorization: 'Bearer ' + tokenUser1
			}
		});
	})

	.step('check: get all event source templates for user 1 organization 1', function(response) {
		utils.statusCode(response, 200);
		utils.size(response, 2);
	})

	.step('get all the event source templates for user 1 for organization 3', function() {
		return this.get({
			url: '/v1/eventSourceTemplates?organizationId=' + organizationId3,
			headers: {
				authorization: 'Bearer ' + tokenUser1
			}
		});
	})

	.step('check: get all event source templates for user 1 organization 3', function(response) {
		utils.statusCode(response, 200);
		utils.size(response, 1);
	})

	.step('get all the event source templates (only public) for user 2', function() {
		return this.get({
			url: '/v1/eventSourceTemplates',
			headers: {
				authorization: 'Bearer ' + tokenUser2
			}
		});
	})

	.step('check: get all event source templates (only public) for user 2', function(response) {
		utils.statusCode(response, 200);
		utils.size(response, 1);
	})

	//.step('get a wrong organization with user 1', function() {
	//	return this.get({
	//		url: location + 1,
	//		headers: {
	//			authorization: 'Bearer ' + tokenUser1
	//		}
	//	});
	//})
	//
	//.step('check: get a wrong organization with user 1', function(response) {
	//	utils.statusCode(response, 404);
	//})
	//
	//.step('get the organization with user 1', function() {
	//	return this.get({
	//		url: location,
	//		headers: {
	//			authorization: 'Bearer ' + tokenUser1
	//		}
	//	});
	//})
	//
	//.step('check: get the organization with user 1', function(response) {
	//	utils.statusCode(response, 200);
	//})
	//
	//.step('get the organization with user 2', function() {
	//	return this.get({
	//		url: location,
	//		headers: {
	//			authorization: 'Bearer ' + tokenUser2
	//		}
	//	});
	//})
	//
	//.step('check: get the organization with user 2', function(response) {
	//	utils.statusCode(response, 200);
	//})
	//
	//.step('get the organizations with user 2', function() {
	//	return this.get({
	//		url: '/v1/organizations',
	//		headers: {
	//			authorization: 'Bearer ' + tokenUser2
	//		}
	//	});
	//})
	//
	//.step('check: get the organizations with user 2', function(response) {
	//	utils.statusCode(response, 200);
	//	utils.size(response, 2);
	//})
	//
	//.step('patch the organization with user 1', function() {
	//	return this.patch({
	//		url: location,
	//		headers: {
	//			authorization: 'Bearer ' + tokenUser1
	//		},
	//		body: {
	//			name: 'iFLUX 2'
	//		}
	//	})
	//})
	//
	//.step('check: patch the organization with user 1', function(response) {
	//	utils.statusCode(response, 201);
	//})
	//
	//.step('patch the organization with user 2', function() {
	//	return this.patch({
	//		url: location,
	//		headers: {
	//			authorization: 'Bearer ' + tokenUser2
	//		},
	//		body: {
	//			name: 'iFLUX 3'
	//		}
	//	})
	//})
	//
	//.step('check: patch the organization with user 2', function(response) {
	//	utils.statusCode(response, 404);
	//})

	.step('check errors', function() {
		if (utils.errors.length > 0) {
			_.each(utils.errors, function(error) {
				console.log(error.message);
				console.log(error.response.headers);
				console.log(error.response.body);
			});

			return this.fail('tests failed!');
		}
	});

module.exports = scenario;