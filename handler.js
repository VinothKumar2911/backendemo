const serverless = require('serverless-http');
<<<<<<< HEAD
const app = require('./app');
=======
const app = require('./src/app');
>>>>>>> 103c9bbb15e3a1583e23ffa425468851d424cd3a

module.exports.handler = serverless(app);
