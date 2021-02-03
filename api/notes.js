const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const notes = db.get('notes');
const Joi = require('joi');
const schema = Joi.object().keys({
    title: Joi.string().max(100).trim().required(),
    note: Joi.string().trim().required()
})
router.get('/', (req, res) => {
    notes.find({ user_id: res.user._id }).then(notes => res.json(notes));
});
router.post('/', (req, res) => {
    const result = schema.validate(req.body);
    if(result.error === undefined) {
        const note = {
            ...req.body,
            user_id: res.user._id
        }
        notes.insert(note).then(note => res.json(note));
    } else {
        const error = new Error(result.error);
        res.status(422).json({error: error.message});
    };
});
router.delete('/', (req, res) => {
    const id = req.body.id;
    notes.findOne({ _id: id }).then(note => notes.remove({ _id: id }).then(noteRemoved => res.json(note)));
});
module.exports = router;