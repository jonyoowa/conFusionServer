const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate = require('../authenticate');

const Dishes = require('../models/dishes');

const dishRouter = express.Router();

dishRouter.use(bodyParser.json());

dishRouter.route('/')
.get((req,res,next) => { // Render all dishes
    Dishes.find({})
    .populate('comments.author')
    .then((dishes) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(dishes);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => { // Only admin can post dishes
    Dishes.create(req.body)
    .then((dish) => {
        console.log('Dish Created ', dish);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(dish);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => { // Only admin
    res.statusCode = 403;
    res.end('PUT operation not supported on /dishes');
})
.delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => { // Only admin can delete dishes
    Dishes.remove({})
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));    
});

dishRouter.route('/:dishId')
.get((req,res,next) => {  // Render a dish
    Dishes.findById(req.params.dishId)
    .populate('comments.author')
    .then((dish) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(dish);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => { // Only for admin
    res.statusCode = 403;
    res.end('POST operation not supported on /dishes/'+ req.params.dishId);
})
.put(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => { // Only admin can modify dish
    Dishes.findByIdAndUpdate(req.params.dishId, {
        $set: req.body
    }, { new: true })
    .then((dish) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(dish);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => { // Only admin can delete dish
    Dishes.findByIdAndRemove(req.params.dishId)
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));
});

dishRouter.route('/:dishId/comments')
.get((req,res,next) => { // render dish's comments
    Dishes.findById(req.params.dishId)
    .populate('comments.author')
    .then((dish) => {
        if (dish != null) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(dish.comments);
        }
        else {
            err = new Error('Dish ' + req.params.dishId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(authenticate.verifyUser, (req, res, next) => { // Only user can post comments for dish
    Dishes.findById(req.params.dishId)
    .then((dish) => {
        if (dish != null) {
            req.body.author = req.user._id;
            dish.comments.push(req.body);
            dish.save()
            .then((dish) => {
                    Dishes.findById(dish._id)
                        .populate('comments.author')
                        .then((dish) => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(dish);        
                        })
            }, (err) => next(err));
        }
        else {
            err = new Error('Dish ' + req.params.dishId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(authenticate.verifyUser, (req, res, next) => { // Only admin
    res.statusCode = 403;
    res.end('PUT operation not supported on /dishes/'
        + req.params.dishId + '/comments');
})
.delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => { // Only admin can delete all comments
    Dishes.findById(req.params.dishId)
    .then((dish) => {
        if (dish != null) {
            for (var i = (dish.comments.length -1); i >= 0; i--) {
                dish.comments.id(dish.comments[i]._id).remove();
            }
            dish.save()
            .then((dish) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(dish);                
            }, (err) => next(err));
        }
        else {
            err = new Error('Dish ' + req.params.dishId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));    
});

dishRouter.route('/:dishId/comments/:commentId')
.get((req,res,next) => { // Get specified comment of a dish
    Dishes.findById(req.params.dishId)
    .populate('comments.author')
    .then((dish) => {
        if (dish != null && dish.comments.id(req.params.commentId) != null) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(dish.comments.id(req.params.commentId));
        }
        else if (dish == null) {
            err = new Error('Dish ' + req.params.dishId + ' not found');
            err.status = 404;
            return next(err);
        }
        else {
            err = new Error('Comment ' + req.params.commentId + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(authenticate.verifyUser, (req, res, next) => { // Only users can post comment for a dish
    res.statusCode = 403;
    res.end('POST operation not supported on /dishes/'+ req.params.dishId
        + '/comments/' + req.params.commentId);
})
.put(authenticate.verifyUser, (req, res, next) => { // Only comment author user can modify comment
    Dishes.findById(req.params.dishId)
    .then((dish) => {
        if (!dish.comments.id(req.params.commentId).author._id.equals(req.user._id)) { // Current user is not comment author
            err = new Error('You can only edit your own comments!');
            err.status = 403;
            return next(err);
        }
        if (dish != null && dish.comments.id(req.params.commentId) != null) { // Ensure that dish exists and comment exists
            if (req.body.rating) {
                dish.comments.id(req.params.commentId).rating = req.body.rating;
            }
            if (req.body.comment) {
                dish.comments.id(req.params.commentId).comment = req.body.comment;                
            }
            dish.save()
            .then((dish) => {
                Dishes.findById(dish._id)
                .populate('comments.author')
                .then((dish) => {
                    Dishes.findById(dish._id)
                    .populate('comment.autor')
                    .then((dish) => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(dish);
                    })
                })
            }, (err) => next(err));
        }
        else if (dish == null) { // Dish does not exist
            err = new Error('Dish ' + req.params.dishId + ' not found');
            err.status = 404;
            return next(err);
        }
        else { // Comment does not exist
            err = new Error('Comment ' + req.params.commentId + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.delete(authenticate.verifyUser, (req, res, next) => { // Only comment author user can delete comment
    Dishes.findById(req.params.dishId)
    .then((dish) => {
        if (!dish.comments.id(req.params.commentId).author._id.equals(req.user._id)) { // Current user is not comment author
            err = new Error('You can only delete your own comments!');
            err.status = 403;
            return next(err);
        }
        if (dish != null && dish.comments.id(req.params.commentId) != null) { // Ensure that dish exists and comment exists
            dish.comments.id(req.params.commentId).remove();
            dish.save()
            .then((dish) => {
                Dishes.findById(dish._id)
                .populate('comments.author')
                .then((dish) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(dish);                
                })
            }, (err) => next(err));
        }
        else if (dish == null) { // Dish does not exist
            err = new Error('Dish ' + req.params.dishId + ' not found');
            err.status = 404;
            return next(err);
        }
        else { // Comment does not exist
            err = new Error('Comment ' + req.params.commentId + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});

module.exports = dishRouter;