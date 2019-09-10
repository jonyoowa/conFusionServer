const express = require('express');
const bodyParser = require('body-parser');

var passport = require('passport'); // For authenticating requests 
const authenticate = require('../authenticate');
const cors = require('./cors');
const Favorites = require('../models/favorite');
const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => { // Ensure user is logged in 
    Favorite.findOne({user: req.user._id}) // Find the user id in the db that corresponds to the current user
    .populate('user') // Populate the user info 
    .populate('dishes') // Populate the dishes info
    .then((favorite) => { // Return the favorites to the user
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorite);
    })
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => { // Ensure user is logged in
    Favorite.findOne({user: req.user._id}) // Find the user id in the db that corresponds to the current user
    .then((favorite) => { 
        if (favorite) { // Favorite document already exists
            for (let i = 0; i < req.body.length; i++) { // Loop through all elements in body
                if (favorite.dishes.indexOf(req.body[i]._id === -1)) { // Make sure favorite isn't already in user's favorites
                    favorite.push(req.body._id); // Add favorite to user's favorites
                }
            }
            favorite.save() // Save the changes made to db
            .then((favorite) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
            }, (err) => next(err));
        } else { // Favorite document doesn't exist, create fav. doc.
            Favorites.create(req.user._id, req.user.dishes) // Create document with user and dishes
            .then((favorite) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
            }, (err) => next(err));
        }
    }, (err) => next(err))
    .catch((err) => next(err))
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => { 
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findByIdAndRemove(req.user._id) // Find and delete list of favorites of current user from db
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));
});

favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, (req, res, next) => { // Ensure user is logged in 
    Favorites.findOne({user: req.user._id}) // Find the user id in the db that corresponds to the current user
    .then((favorites) => {
        if (!favorites) { // Favorites document does not exist
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.json({"exists": false, "favorites": favorites});
        }
        else { // Favorites document exists
            if (favorites.dishes.indexOf(req.params.dishId) < 0) { // Specified dish is not in favorites
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.json({"exists": false, "favorites": favorites});
            }
            else { // Specified dish exists in favorites, return dish 
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.json({"exists": true, "favorites": favorites});
            }
        }

    }, (err) => next(err))
    .catch((err) => next(err))
})
.post(cors.corsWithOptions, authenticate.verifyUser,  (req, res, next) => {
    Favorites.findOne({ user: req.user._id }) // Find the user id in the db that corresponds to the current user
    .then((favorites) => {
        if (favorites) { // Favorites document exists
            if (favorites.dishes.indexOf(req.params.dishId) === -1) { // Dish does not exist in Favorites
                favorites.dishes.push(req.params.dishId); // Add dish
                favorites.save() // Save changes to db
                .then((resp) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(resp);
                }).catch(err => next(err));
            } else { // Dish already exists in Favorites
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorites);
            }
        } else { // Favorites document does not exist
            favorite = new Favorites({ user: req.user._id });
            favorite.dishes = [];
            favorite.dishes.push(req.params.dishId);
            favorite.save()
            .then((resp) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(resp);
            }).catch(err => next(err));
        }
    }).catch(err => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('GET operation not supported on /favorites' + req.params.dishId);
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({user: req.user._id }) // Find the user id in the db that corresponds to the current user
    .then((favorites) => {
        if (favorites) { // Favorites document exists
            var index = favorites.dishes.indexOf(req.params.dishId);
            if ( index >= 0) { // If index is in range (Dish is in Favorites)
                favorites.dishes.splice(index, 1); // Remove dish from favorites
            }
            favorites.save() // Save changes to db
            .then((favorite) => {
                Favorites.findById(favorite._id) // Get the user's favorite dishes
                .populate('user') // Populate the user info 
                .populate('dishes') // Populate the dishes info 
                .then((favorite) => {
                    console.log('Favorite Dish Deleted!', favorite);
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
                })
            }).catch(err => next(err));
        } else { // Favorites document does not exist, do nothing
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(favorites);
        }
    }).catch(err => next(err))
});

module.exports = favoriteRouter;