const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Group = require('../models/Group');

const {ensureAuthenticated} = require('../helpers/auth');



router.get('/', (req, res)=> {
    res.render('index/landing');
  });

router.get('/about', (req, res) => {
    res.render('index/about');
})

  router.get('/dashboard', ensureAuthenticated, (req, res) => {
    Group.find({})
        .then(groups => {
            res.render('index/dashboard', {groups: JSON.stringify(groups)});
        })
        .catch(err => console.log(err));
});

module.exports = router;
