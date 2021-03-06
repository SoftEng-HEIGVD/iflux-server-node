var  baseTest = require('../base');

var testSuite = baseTest('Me resource')
	.createUser('Register first user')
	.createUser('Register second user', { lastName: 'Dutoit', email: 'henri.dutoit@localhost.localdomain' })
	.signinUser('Signing first user')
	.signinUser('Signing first user', { email: 'henri.dutoit@localhost.localdomain' })
	.createOrganization('Create new organization for first user', { name: 'Orga 1' }, 1, 1)
	.createOrganization('Create second organization for first user', { name: 'Orga 2' }, 1, 2)
	.createOrganization('Create new organization for second user', { name: 'Orga 3' }, 2, 3);

testSuite
	.describe('Retrieve the organizations for first user')
	.jwtAuthentication(function() { return this.getData('token1'); })
	.get({ url: '/v1/me/organizations' })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(2)
	.expectJsonToHavePath([ '0.id', '0.name', '1.id', '1.name' ])
	.expectJsonToBeAtLeast([{
		name: 'Orga 1'
	}, {
		name: 'Orga 2'
	}]);

testSuite
  .describe('Retrieve the organizations for second user')
	.jwtAuthentication(function() { return this.getData('token2'); })
	.get({ url: '/v1/me/organizations' })
	.expectStatusCode(200)
	.expectJsonCollectionToHaveSize(1)
	.expectJsonToHavePath([ '0.id', '0.name' ])
	.expectJsonToBeAtLeast([{
		name: 'Orga 3'
	}]);

module.exports = testSuite;