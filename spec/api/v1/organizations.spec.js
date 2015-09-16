var baseTest = require('../base');

var testSuite = baseTest('Organization resource')
	.createUser('Register first user')
	.createUser('Register second user', { lastName: 'Dutoit', email: 'henri.dutoit@localhost.localdomain' })
	.signinUser('Signing first user')
	.signinUser('Signing first user', { email: 'henri.dutoit@localhost.localdomain' }, 'token2');

testSuite
	.describe('Create new organization with first user')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.post({
		url: '/v1/organizations',
		body: {
			name: 'Orga1'
		}
	})
	.storeLocationAs('organization', 1)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/organizations/:id');

testSuite
	.describe('Create new organization with second user')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.post({
		url: '/v1/organizations',
		body: {
			name: 'Orga2'
		}
	})
	.storeLocationAs('organization', 2)
	.expectStatusCode(201)
	.expectLocationHeader('/v1/organizations/:id');

testSuite
	.describe('Retrieve unknown organization with first user')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.get({}, function() { return { url: this.getData('locationOrganization1') + '100' }; })
	.expectStatusCode(403);

testSuite
	.describe('Retrieve the first organization with first user')
	.get({}, function() { return { url: this.getData('locationOrganization1') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ 'id', 'name' ])
	.expectJsonToBeAtLeast({
		name: 'Orga1'
	});

testSuite
	.describe('Retrieve the second organization with second user')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.get({}, function() { return { url: this.getData('locationOrganization2') }; })
	.expectStatusCode(200)
	.expectJsonToHavePath([ 'id', 'name' ])
	.expectJsonToBeAtLeast({
		name: 'Orga2'
	});

testSuite
	.describe('Retrieve all organizations with second user')
	.get({ url: '/v1/organizations' })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToHavePath([ '0.id', '0.name', '1.id', '1.name' ])
	.expectJsonToBeAtLeast([{
		name: 'Orga1'
	}, {
		name: 'Orga2'
	}]);

testSuite
	.describe('Update the first organization with first user')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.patch({
		body: {
			name: 'Orga1 renamed'
		}
	}, function() { return { url: this.getData('locationOrganization1') }; })
	.expectStatusCode(201)
	.expectLocationHeader('/v1/organizations/:id');

testSuite
	.describe('Check the updated organization for the first user.')
	.get({}, function() { return { url: this.getData('locationOrganization1') }; })
	.expectStatusCode(200)
	.expectJsonToBe(function() {
		return {
			id: this.getData('organizationId1'),
			name: 'Orga1 renamed',
			deletable: false
		};
	});

testSuite
	.describe('Update the first organization with second user')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.patch({
		body: {
			name: 'Orga1 renamed again'
		}
	}, function() { return { url: this.getData('locationOrganization1') }; })
	.expectStatusCode(403);

testSuite
	.describe('First user tries to do an unknown action')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.post({}, function() {
		return {
			url: this.getData('locationOrganization1') + '/actions',
			body: {
				type: "unknown"
			}
		};
	})
	.expectStatusCode(422)
	.expectJsonToBe({ type: [ 'Unknown action type.' ] });

testSuite
	.describe('First user add the second user into the first organization')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.post({}, function() {
		return {
			url: this.getData('locationOrganization1') + '/actions',
			body: {
				type: "addUser",
				email: "henri.dutoit@localhost.localdomain"
			}
		};
	})
	.expectStatusCode(200);

testSuite
	.describe('Retrieve the list of users for organization where first user is a member')
	.get({
		_storeData: function() { this.setData('user2AddedId', this.response.body[1].id); }
	}, function() {
		return { url: this.getData('locationOrganization1') + '/users' };
	})
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToHavePath([ '0.id', '0.firstName', '0.lastName', '1.id', '1.firstName', '1.lastName' ])
	.expectJsonToBeAtLeast([{
		firstName: 'Henri',
		lastName: 'Dupont'
	}, {
		firstName: 'Henri',
		lastName: 'Dutoit'
	}]);

testSuite
	.describe('User cannot retrieve users for an organization where he is not a member')
	.get({}, function() { return { url: this.getData('locationOrganization2') + '/users' }; })
	.expectStatusCode(403);

testSuite
	.describe('First user remove the second user from the first organization')
	.post({}, function() {
		return {
			url: this.getData('locationOrganization1') + '/actions',
			body: {
				type: "removeUser",
				email: "henri.dutoit@localhost.localdomain"
			}
		};
	})
	.expectStatusCode(200);

testSuite
	.describe('Retrieve the list of users for organization where first user is a member')
	.get({}, function() { return { url: this.getData('locationOrganization1') + '/users' }; })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToHavePath([ '0.id', '0.firstName', '0.lastName' ])
	.expectJsonToBeAtLeast([{
		firstName: 'Henri',
		lastName: 'Dupont'
	}]);

testSuite
	.describe('Retrieve organizations filtered by name for first user')
	.get({ url: '/v1/organizations?name=%renamed' })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToHavePath([ '0.id', '0.name' ])
	.expectJsonToBeAtLeast([{
		name: 'Orga1 renamed'
	}]);

testSuite
	.describe('First user add again the second user into the first organization but this time with the userId')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.post({}, function() {
		return {
			url: this.getData('locationOrganization1') + '/actions',
			body: {
				type: "addUser",
				userId: this.getData('user2AddedId')
			}
		};
	})
	.expectStatusCode(200);

testSuite
	.describe('Retrieve the list of users for organization where first user is a member (userId used)')
	.get({}, function() { return { url: this.getData('locationOrganization1') + '/users' }; })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToHavePath([ '0.id', '0.firstName', '0.lastName', '1.id', '1.firstName', '1.lastName' ])
	.expectJsonToBeAtLeast([{
		firstName: 'Henri',
		lastName: 'Dupont'
	}, {
		firstName: 'Henri',
		lastName: 'Dutoit'
	}]);

testSuite
	.describe('First user remove again the second user from the first organization but this time with the userId')
	.post({}, function() {
		return {
			url: this.getData('locationOrganization1') + '/actions',
			body: {
				type: "removeUser",
				userId: this.getData('user2AddedId')
			}
		};
	})
	.expectStatusCode(200);

testSuite
	.describe('Retrieve the list of users for organization where first user is a member (userId used)')
	.get({}, function() { return { url: this.getData('locationOrganization1') + '/users' }; })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToHavePath([ '0.id', '0.firstName', '0.lastName' ])
	.expectJsonToBeAtLeast([{
		firstName: 'Henri',
		lastName: 'Dupont'
	}]);

testSuite
	.describe('First user remove his organization.')
	.delete({}, function() { return { url: this.getData('locationOrganization1') }; })
	.expectStatusCode(204);

testSuite
	.describe('First user tries to retrieve his deleted organization.')
	.get({}, function() { return { url: this.getData('locationOrganization1') }; })
	.expectStatusCode(403);

testSuite
	.describe('First user tries to delete an organization where he is not a member.')
	.get({}, function() { return { url: this.getData('locationOrganization2') }; })
	.expectStatusCode(403);

module.exports = testSuite;