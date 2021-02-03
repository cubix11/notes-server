if(process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
};
const express = require('express');
const router = new express.Router();
const Joi = require('joi');
const db = require('../db/connection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const users = db.get('users');
const notes = db.get('notes');
users.createIndex('username', { unique: true });
const jwtExpirationTime = process.env.JSONWEBTOKEN_EXPIRATION_TIME;
const schemaSignup = Joi.object().keys({
    username: Joi.string().trim().regex(/(^[a-zA-Z0-9_]*$)/).min(2).max(30).required(),
    password: Joi.string().trim().regex(/(^[a-zA-Z0-9!@#$%^&*()_+]*$)/).min(8).required()
});
const schemaLogin = Joi.object().keys({
    username: Joi.string().trim().regex(/(^[a-zA-Z0-9_]*$)/).min(2).max(30).required(),
    password: Joi.string().trim().regex(/(^[a-zA-Z0-9!@#$%^&*()_+]*$)/).min(8).required()
});
function createTokenSendResponse(user, res, next) {
    const payload = {
        _id: user._id,
        username: user.username
    };
    jwt.sign(payload, process.env.SECRET_TOKEN, {
        expiresIn: jwtExpirationTime
    }, (err, token) => {
        if(err) {
            res.status(500);
            const err = new Error('Something went wrong');
            res.json({error: err.message});
        } else {
            res.json({token});
        };
    });
};
router.post('/signup', (req, res, next) => {
    const result = schemaSignup.validate(req.body);
    if(result.error == undefined) {
        users.findOne({
            username: req.body.username
        }).then(user => {
            if(user) {
                const error = new Error('Duplicate username');
                res.status(409).json({error: error.message});
            } else {
                bcrypt.hash(req.body.password, 12).then(hashedPassword => {
                    const newUser = {
                        username: req.body.username,
                        password: hashedPassword
                    };
                    users.insert(newUser).then(insertedUser => {
                        delete insertedUser.password;
                        createTokenSendResponse(insertedUser, res, next);
                    });
                });
            };
        });
    } else {
        res.status(422);
        res.json(result.error.details[0].message);
    }
});

router.post('/login', (req, res, next) => {
    const result = schemaLogin.validate(req.body);
    if(result.error === undefined) {
        users.findOne({
            username: req.body.username
        }).then(user => {
            if(user) {
                bcrypt.compare(req.body.password, user.password).then(response => {
                    if(response) {
                        createTokenSendResponse(user, res, next);
                    } else {
                        res.status(403);
                        const error = new Error('Permission denied');
                        res.json({error: error.message});
                    };
                });
            } else {
                res.status(404);
                const error = new Error('Not found');
                res.json({error: error.message});
            };
        });
    } else {
        res.status(422);
        const error = new Error('Unable to login.');
        res.json({error: error.message});
    };
});
router.delete('/deleteAccount', (req, res) => {
    if(res.user) {
        const id = res.user._id;
        users.remove({_id: id}).then(() => {
            notes.remove({user_id: id}).then(() => res.json({message: 'Deleted User'}))
        });
    } else {
        res.status(401).json({error: 'Unauthorized'});
    };
});
module.exports = router;