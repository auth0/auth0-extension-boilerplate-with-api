var express = require('express');
var auth0   = require('auth0-oauth2-express');
var Webtask = require('webtask-tools');
var app     = express();
var api     = express.Router();

app.use(auth0({
  scopes: 'read:connections',
}));

app.use('/api', api);

api.get('/secured', function (req, res) {
  if (!req.user) {
    return res.sendStatus(401);
  }

  res.status(200).send({message: 'Secured world'});
});

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

if ((process.env.NODE_ENV || 'development') === 'development') {
  app.listen(3000);
} else {
  module.exports = Webtask.fromExpress(app);
}
