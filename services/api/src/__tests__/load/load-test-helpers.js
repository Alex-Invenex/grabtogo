const { faker } = require('@faker-js/faker')

function generateAuthToken(context, events, done) {
  // Generate a mock JWT token for testing
  context.vars.authToken = 'Bearer test-token-' + Math.random().toString(36).substr(2, 9)
  return done()
}

function generateRandomUser(context, events, done) {
  context.vars.email = faker.internet.email()
  context.vars.name = faker.person.fullName()
  context.vars.phone = faker.phone.number()
  return done()
}

function generateRandomProduct(context, events, done) {
  context.vars.productName = faker.commerce.productName()
  context.vars.productPrice = faker.commerce.price({ min: 100, max: 5000 })
  context.vars.productDescription = faker.commerce.productDescription()
  return done()
}

function generateRandomVendor(context, events, done) {
  context.vars.businessName = faker.company.name()
  context.vars.businessType = faker.helpers.arrayElement(['Restaurant', 'Electronics', 'Clothing', 'Books', 'Home & Garden'])
  context.vars.address = faker.location.streetAddress({ useFullAddress: true })
  return done()
}

function logResult(requestParams, response, context, ee, next) {
  if (response.statusCode >= 400) {
    console.error(`Error ${response.statusCode}: ${requestParams.url}`)
  }
  return next()
}

module.exports = {
  generateAuthToken,
  generateRandomUser,
  generateRandomProduct,
  generateRandomVendor,
  logResult
}