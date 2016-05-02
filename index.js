var express    = require('express');
var Webtask    = require('webtask-tools');
var app        = express();
var api        = express.Router();
var jwtExpress = require('express-jwt');
var auth0      = require('auth0-oauth2-express');
var metadata   = require('./webtask.json');

app.use(require('./middleware/develop.js'));

app.use('/api', api);

app.use(auth0({
  scopes: 'read:connections',
  apiToken: {
    payload: function (req, res, next) {
      // Add extra info to the API token
      req.userInfo.MoreInfo = "More Info";
      next();
    },
    secret: function (req) {
      return req.webtaskContext.data.EXTENSION_SECRET;
    }
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

// This endpoint would be called by webtask-gallery to dicover your metadata
app.get('/meta', function (req, res) {
  res.status(200).send(metadata);
});

////////////// API //////////////
api.use(jwtExpress({
  secret: function(req, payload, done) {
    done(null, req.webtaskContext.data.EXTENSION_SECRET);
  }
}));

api.get('/secured', function (req, res) {
  if (!req.user) {
    return res.sendStatus(401);
  }

  res.status(200).send({user: req.user});
});
////////////// API //////////////

module.exports = app;
