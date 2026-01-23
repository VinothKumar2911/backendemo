// require('dotenv').config();
// const app = require('./src/app');

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });


const serverless = require('serverless-http');
const app = require('./src/app');
module.exports.handler = serverless(app);
