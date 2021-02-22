const express = require('express');
const passport = require('passport');

const createHandler = require('azure-function-express').createHandler;

const BearerStrategy = require("passport-azure-ad").BearerStrategy;

const options = {
    identityMetadata: `https://login.microsoftonline.com/${process.env["TENANT_INFO"]}/v2.0/.well-known/openid-configuration`,
    issuer: `https://login.microsoftonline.com/${process.env["TENANT_INFO"]}/v2.0`,
    clientID: process.env["CLIENT_ID"],
    audience: process.env["CLIENT_ID"], // audience is this application
    validateIssuer: true,
    passReqToCallback: false,
    loggingLevel: "info",
    scope: process.env["EXPECTED_SCOES"]
};

const bearerStrategy = new BearerStrategy(options, (token, done) => {
    // Send user info using the second argument
    done(null, {}, token);
});

const app = express();

app.use(require('morgan')('combined'));

app.use(require('body-parser').urlencoded({ 'extended': true }));

app.use(passport.initialize());

passport.use(bearerStrategy);

// Expose and protect API endpoint
app.get('/api', passport.authenticate('oauth-bearer', { session: false }),
    (req, res) => {
        console.log('Validated claims: ', req.authInfo);

        // Service relies on the name claim.  
        res.status(200).json({
            'name': req.authInfo['name'],
            'issued-by': req.authInfo['iss'],
            'issued-for': req.authInfo['aud'],
            'using-scope': req.authInfo['scp']
        });
    }
);

module.exports = createHandler(app);
