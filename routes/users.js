var express = require('express');
const bodyParser = require('body-parser'); // For parsing incoming request bodies from middleware, before handlers
var User = require('../models/user');
var passport = require('passport'); // For authenticating requests 
var authenticate = require('../authenticate'); 

var router = express.Router();
router.use(bodyParser.json());

router.get('/', authenticate.verifyUser, authenticate.verifyAdmin, function(req, res, next) { // Only registered admin can view all users' details
  User.find({}, (err, users) => { // Find all users
    if (err) { res.send(err) }
    res.render('listUsers', { title: 'All users', allUsers: users }); // Render user details from template '../views/listUsers.jade'
  })
});

router.post('/signup', (req, res, next) => { // Allow user to signup for website
  User.register(new User({username: req.body.username}), // Create a new user with req.body.username as username
    req.body.password, (err, user) => { 
    if(err) { 
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.json({err: err}); // New json object with err as the err property, sent back
    }
    else {
      if (req.body.firstname) {
        user.firstname = req.body.firstname;
      }
      if (req.body.firstname) {
        user.lastname = req.body.lastname;
      }
      user.save((err, user) => {
        if (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.json({err: err});
          return ;
        }
        passport.authenticate('local')(req, res, () => { // Ensure registration was successful 
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json({success: true, status: 'Registration Successful!'});
        });
      });
    }
  });
});

router.post('/login', passport.authenticate('local'), (req, res) => { // If authentication call is successful, then check req and res
  var token = authenticate.getToken({_id: req.user._id}); // Create token with the user id  
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.json({success: true, token: token, status: 'You are successfully logged in!'}); // Also send back token when user is successfully authenticated
});

router.get('/logout', (req, res) => { // Allow user to logout 
  if (req.session) { // Session must exist (Must be logged in)
    req.session.destroy(); // Destroy session on the server side
    res.clearCookie('session-id'); // Remove cookie
    res.redirect('/'); // Redirect back to home page
  }
  else {
    var err = new Error('You are not logged in!');
    err.status = 403;
    next(err); // Generate error to error handler
  }
});

module.exports = router;
