const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Group = require('../models/Group');
var moment = require('moment');
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn

// This relates to how we check the dates for the rev dashboard, specifically, comparing the week dates
moment.suppressDeprecationWarnings = true;

const {ensureAuthenticated} = require('../helpers/auth');

router.get('/fork', ensureAuthenticated, (req, res) => {
    if(req.user.role === 'Sales Agent') {
        res.redirect('sales/dashboard')
    }
    else {
        res.redirect('revenue/dashboard');
    }   
});

router.get('/', (req, res) => {
    res.render('index/landing');
});

router.get('/about', (req, res) => {
    res.render('index/about');
});

router.get('/visualizer', ensureAuthenticated, (req, res) => {
    Group.find({})
        .then(groups => {
            res.render('index/visualizer', {groups: JSON.stringify(groups)});
        })
        .catch(err => console.log(err));
});

module.exports = router;
