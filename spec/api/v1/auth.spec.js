var
	baseTest = require('../base');

module.exports = baseTest('Authentication resource')
	.describe('Unknown user cannot signin')
	.post({
		url: '/v1/auth/signin',
		body: {
			email: 'henri.dupont@localhost.localdomain',
			password: 'password'
		}
	})
	.expectStatusCode(401)

	.describe('Register new user')
	.post	({
		url: '/v1/auth/register',
		body: {
			email: 'henri.dupont@localhost.localdomain',
			firstName: 'Henri',
			lastName: 'Dupont',
			password: 'password',
			passwordConfirmation: 'password'
		}
	})
	.expectStatusCode(201)
	.expectLocationHeader('/v1/me')

	.describe('Valid authentication')
	.post({
		url: '/v1/auth/signin',
		body: {
			email: 'henri.dupont@localhost.localdomain',
			password: 'password'
		}
	})
	.expectStatusCode(200)
	.expectJsonToHavePath('token')
;
