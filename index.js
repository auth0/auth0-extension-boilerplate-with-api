var express    = require('express');
var Webtask    = require('webtask-tools');
var app        = express();
var api        = express.Router();
var jwtExpress = require('express-jwt');
var auth0      = require('auth0-oauth2-express');

app.use('/api', api);

////////////// DEVELOPMENT //////////////
if ((process.env.NODE_ENV || 'development') === 'development') {
  var token = require('crypto').randomBytes(32).toString('hex');

  app.use(function (req, res, next) {
    req.webtaskContext = {
      data: {
        TOKEN_SECRET: token // This will be automatically provisioned once the extensions is installed
      }
    };

    next();
  });

  api.use(function (req, res, next) {
    req.webtaskContext = {
      data: {
        TOKEN_SECRET: token // This will be automatically provisioned once the extensions is installed
      }
    };

    next();
  });
}
////////////// DEVELOPMENT //////////////

app.use(auth0({
  scopes: 'read:connections',
  apiTokenPayload: function (req, res, next) {
    // Add extra info to the API token
    req.userInfo.MoreInfo = "More Info";
    next();
  }
}));

app.get('/', function (req, res) {
  var view = [
    '<html>',
    '  <head>',
    '    <title>Auth0 Extension</title>',
    '    <script type="text/javascript">',
    '       if (!sessionStorage.getItem("token")) {',
    '         window.location.href = "'+res.locals.baseUrl+'/login";',
    '       }',
    '    </script>',
    '  </head>',
    '  <body>',
    '    <p><strong>Token</strong></p>',
    '    <textarea rows="10" cols="100" id="token"></textarea>',
    '    <script type="text/javascript">',
    '       var token = sessionStorage.getItem("token");',
    '       if (token) {',
    '         document.getElementById("token").innerText = token;',
    '       }',
    '    </script>',
    '    <p><strong>API Token</strong></p>',
    '    <textarea rows="10" cols="100" id="apiToken"></textarea>',
    '    <script type="text/javascript">',
    '       var apiToken = sessionStorage.getItem("apiToken");',
    '       if (apiToken) {',
    '         document.getElementById("apiToken").innerText = apiToken;',
    '       }',
    '    </script>',
    '  </body>',
    '</html>'
  ].join('\n');

  res.header("Content-Type", 'text/html');
  res.status(200).send(view);
});

////////////// API //////////////
api.use(jwtExpress({
  secret: function(req, payload, done) {
    done(null, req.webtaskContext.data.TOKEN_SECRET);
  }
}));

api.get('/secured', function (req, res) {
  if (!req.user) {
    return res.sendStatus(401);
  }

  res.status(200).send({user: req.user});
});
////////////// API //////////////

if ((process.env.NODE_ENV || 'development') === 'development') {
  app.listen(3000);
} else {
  module.exports = Webtask.fromExpress(app);
}
