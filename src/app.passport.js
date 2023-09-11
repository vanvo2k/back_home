const express = require('express');
const router = express.Router();
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const {deprecatedAPI} = require('./actions/DeprecatedActions')

const appConfig = require('./app.config');
const oauth = require('./controllers/oauth');

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

/**
 * Facebook
 */
const facebookApp = appConfig.get('/auth/facebook');
passport.use(new FacebookStrategy(facebookApp,
    (accessToken, refreshToken, profile, done) => {
        done(null, profile);
    }
));

router.get('/auth/google', (req, res, next) => {
    let {af: affiliateCode} = req.query
    if (!affiliateCode) {
        passport.authenticate('google', { scope: ['openid', 'email', 'profile'] })(req, res, next)
    } else {
        passport.authenticate('google', {
            scope: ['openid', 'email', 'profile'],
            state: affiliateCode,
        })(req, res, next)
    }
})

router.get('/auth/google/callback',
    passport.authenticate('google', {
        failureRedirect: appConfig.get('/webClient')
    }),
    oauth.validateSocialUserV3('google'),
    oauth.loginSocialCallbackV3
);

//! Deprecated
router.post('/user/login/google',
    (_req, res) => deprecatedAPI(res),
    // oauth.validateSocialUserV2('google'),
    // oauth.googleCallback,
    // oauth.loginSocialCallbackV2
)

/**
 * Google
 */
const googleApp = appConfig.get('/auth/google');
passport.use(new GoogleStrategy(googleApp,
    function (token, tokenSecret, profile, done) {
        done(null, profile);
    }
));

router.get('/auth/facebook', passport.authenticate('facebook', {scope: ['email', 'public_profile']}));
router.get('/auth/facebook/callback',
    passport.authenticate('facebook'),
    oauth.validateSocialUser('facebook'),
    oauth.facebookCallback,
    oauth.loginSocialCallback
);

exports.router = router;
