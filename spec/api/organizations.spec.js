var baseTest = require('../base');

module.exports = baseTest('Organization resource')
	.createUser('Register first user')
	.createUser('Register second user', { lastName: 'Dutoit', email: 'henri.dutoit@localhost.localdomain' })
	.signinUser('Signing first user')
	.signinUser('Signing first user', { email: 'henri.dutoit@localhost.localdomain' }, 'token2')

	.describe('Create new organization with first user')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.post({
		url: '/v1/organizations',
		body: {
			name: 'iFLUX'
		},
		_storeData: function() { this.setData('locationOrganization1', this.response.headers.location); }
	})
	.expectStatusCode(201)
	.expectLocationHeader('/v1/organizations/:id')

	.describe('Create new organization with second user')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.post({
		url: '/v1/organizations',
		body: {
			name: 'Another orga'
		},
		_storeData: function() { this.setData('locationOrganization2', this.response.headers.location); }
	})
	.expectStatusCode(201)
	.expectLocationHeader('/v1/organizations/:id')

	.describe('Retrieve unknown organization with first user')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.get({}, function() { return { url: this.getData('locationOrganization1') + '100' }; })
	.expectStatusCode(403)

	.describe('Retrieve the first organization with first user')
	.get({}, function() { return { url: this.getData('locationOrganization1') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ 'id', 'name' ])
	.expectJsonToBeAtLeast({
		name: 'iFLUX'
	})

	.describe('Retrieve the second organization with second user')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.get({}, function() { return { url: this.getData('locationOrganization2') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ 'id', 'name' ])
	.expectJsonToBeAtLeast({
		name: 'Another orga'
	})

	.describe('Retrieve all organizations with second user')
	.get({ url: '/v1/organizations' })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToHavePath([ '0.id', '0.name', '1.id', '1.name' ])
	.expectJsonToBeAtLeast([{
		name: 'iFlux'
	}, {
		name: 'Another orga'
	}])

	.describe('Update the first organization with first user')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.patch({
		body: {
			name: 'iFlux 2'
		}
	}, function() { return { url: this.getData('locationOrganization1') }; })
	.expectStatusCode(201)
	.expectLocationHeader('/v1/organizations/:id')

	.describe('Update the first organization with second user')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.patch({
		body: {
			name: 'iFlux 3'
		}
	}, function() { return { url: this.getData('locationOrganization1') }; })
	.expectStatusCode(403)

	.describe('Retrieve the list of users for organization where first user is a member')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.get({}, function() { return { url: this.getData('locationOrganization1') + '/users' }; })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToHavePath([ '0.id', '0.firstName', '0.lastName' ])
	.expectJsonToBeAtLeast([{
		firstName: 'Henri',
		lastName: 'Dupont'
	}])

	.describe('User cannot retrieve users for an organization where he is not a member')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.get({}, function() { return { url: this.getData('locationOrganization2') + '/users' }; })
	.expectStatusCode(403)
;