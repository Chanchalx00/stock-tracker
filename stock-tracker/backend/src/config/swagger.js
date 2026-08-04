const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Stocklytics API',
      version: '1.0.0',
      description:
        'Real-time Indian stock tracker API — live NSE/BSE quotes, watchlist, portfolio P&L, price alerts, and market news.',
    },
    servers: [{ url: `http://localhost:${process.env.PORT || 5000}`, description: 'Local server' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  // glob patterns need forward slashes even on Windows — path.join()
  // would emit backslashes here, which the glob matcher can't parse.
  apis: [path.join(__dirname, '../routes/*.js').split(path.sep).join('/')],
};

module.exports = swaggerJsdoc(options);
