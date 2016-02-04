var express    = require('express');
var auth0      = require('auth0-oauth2-express');
var Webtask    = require('webtask-tools');
var app        = express();
var api        = express.Router();
var jwtExpress = require('express-jwt');
var unless     = require('express-unless');
var jwt        = require('jsonwebtoken');
var bodyParser = require('body-parser');

app.use('/api', api);

app.use(auth0({
  scopes: 'read:connections',
}));

app.get('/', function (req, res) {
  var view = [
    '<html>',
    '  <head>',
    '    <title>Auth0 Extension</title>',
    '    <script type="text/javascript">',
    '       if (!sessionStorage.getItem("token")) {',
    '         window.location.href = "/login";',
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
    '  </body>',
    '</html>'
  ].join('\n');

  res.header("Content-Type", 'text/html');
  res.status(200).send(view);
});

////////////// API //////////////
if ((process.env.NODE_ENV || 'development') === 'development') {
  var token = require('crypto').randomBytes(32).toString('hex');

  api.use(function (req, res, next) {
    req.webtaskContext = {
      data: {
        TOKEN_SECRET: token // This will be automatically provisioned once the extensions is installed
      }
    };

    next();
  });
}

var jwtChecker = jwtExpress({
  secret: function(req, payload, done) {
    done(null, req.webtaskContext.data.TOKEN_SECRET);
  },
  algorithms: ['HS256']
});

jwtChecker.unless = unless;

api.use(bodyParser.json());
api.use(jwtChecker.unless({path: '/api/login' }));

api.post('/login', function (req, res) {
  var secret = req.webtaskContext.data.TOKEN_SECRET;
  var token  = jwt.sign(req.body, secret, {
    algorithm: 'HS256',
    issuer: 'http://localhost:3000',
    audience: 'http://localhost:3000/api'
  });

  res.status(200)
    .send({
      token: token
    });
});

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
