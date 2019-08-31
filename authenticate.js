var passport = require('passport'); //
var LocalStrategy = require('passport-local').Strategy; // Plugin that simplifies username and password login
var User = require('./models/user'); // Get user from User schema 
var JwtStrategy = require('passport-jwt').Strategy;  // Passport strategy for authenticating JSON Web Tokens
var ExtractJwt = require('passport-jwt').ExtractJwt; //
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens

var config = require('./config.js'); 

exports.local = passport.use(new LocalStrategy(User.authenticate())); // Add User.authenticate() method to the User schema and model
passport.serializeUser(User.serializeUser()); // Save user id in the session, determines which data of User object should be stored in session
passport.deserializeUser(User.deserializeUser()); // Find the corresponding User id and make a request to db to find full profile of user (attached to handler at req.user)

exports.getToken = function(user) { // Provide JSON object and returns a JSON Web Token 
    return jwt.sign(user, config.secretKey,
        {expiresIn: 3600}); // JSON web token will be valid for 1 hour 
};

var opts = {}; 
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken(); // Include in authentication as bearer token 
opts.secretOrKey = config.secretKey;

exports.jwtPassport = passport.use(new JwtStrategy(opts, 
    (jwt_payload, done) => {
        console.log("JWT payload: ", jwt_payload);
        User.findOne({_id: jwt_payload._id}, (err, user) => { // Search for user with id of '_id'
            if (err) { // Error 
                return done(err, false);
            }
            else if (user) { // User exists
                return done(null, user); 
            }
            else { // Users does not exist
                return done(null, false);
            }
        });
    }));

exports.verifyUser = passport.authenticate('jwt', {session: false}); // Use token and verify user's authenticity 

exports.verifyAdmin = ((req, res, next) => { // Check if current user is an administrator
    if (!req.user.admin) { // User is not admin
        err = new Error('You are not authorized to perform this operation!');
        err.status = 403;
        return next(err);    
    }

    next(); // User is admin, proceed to next
});
