var mongoose = require('mongoose'); 
var Schema = mongoose.Schema; 
var passportLocalMongoose = require('passport-local-mongoose'); 

var User = new Schema({
    firstname: {
        type: String,
          default: ''
      },
      lastname: {
        type: String,
          default: ''
      },
      admin:   {
          type: Boolean,
          default: false
      }  
});

User.plugin(passportLocalMongoose); // Auto add username and hashed storage of the password, as well as additional methods to User schema

module.exports = mongoose.model('User', User);