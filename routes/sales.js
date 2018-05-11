const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Group = require('../models/Group');
var moment = require('moment');

// This relates to how we check the dates for the rev dashboard, specifically, comparing the week dates
moment.suppressDeprecationWarnings = true;

const {ensureAuthenticated} = require('../helpers/auth');

router.get('/dashboard', ensureAuthenticated, (req, res) => {
    Group.find({})
        .then(groups => {
            // Format group data we want to present
            let clientStatusArray = [];
            let managementStatusArray = [];
            let clientStatusCount = 0;
            let managementStatusCount = 0;
            for(let i = 0; i < groups.length; i++) {
                if(groups[i].clientStatus === 'Pending') {
                    clientStatusArray.push(groups[i]);
                    clientStatusCount++;
                }
                if(groups[i].managerStatus === 'Pending Review') {
                    managementStatusArray.push(groups[i]);
                    managementStatusCount++;
                }
            }
            res.render('sales/dashboard', 
                {
                    pendingClientGroups: JSON.stringify(clientStatusArray), 
                    pendingManagerGroups: JSON.stringify(managementStatusArray),
                    name: req.user.name,
                    clientStatusCount,
                    managementStatusCount
                })
        })
        .catch(err => console.log(err));
});







module.exports = router;
