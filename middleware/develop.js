var express    = require('express');
var dev        = express.Router();

if ((process.env.NODE_ENV || 'development') === 'development') {
  var token = require('crypto').randomBytes(32).toString('hex');

  dev.use(function (req, res, next) {
    req.webtaskContext = {
      data: {
        EXTENSION_SECRET: token // This will be automatically provisioned once the extensions is installed
      }
    };

    next();
  });

  dev.use('/api', function (req, res, next) {
    req.webtaskContext = {
      data: {
        EXTENSION_SECRET: token // This will be automatically provisioned once the extensions is installed
      }
    };

    next();
  });
}

module.exports = dev;
