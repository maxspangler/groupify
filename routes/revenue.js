const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Group = require('../models/Group');
var moment = require('moment');

// This relates to how we check the dates for the rev dashboard, specifically, comparing the week dates
moment.suppressDeprecationWarnings = true;

const {ensureAuthenticated} = require('../helpers/auth');
const {calculateTotalGroupRevenue} = require('../helpers/calculateTotalRevenue');

router.get('/dashboard', ensureAuthenticated, (req, res) => {
    Group.find({})
        .then(groups => {
            // count pending proposals and send to dashboard; move this to a func later
            let pendingCount = 0;
            for(let i = 0; i < groups.length; i++) {
                if(groups[i].managerStatus === 'Pending Review') {
                    pendingCount++;
                }
            }
            // Figure out how many submitted today, week, month
            let proposalsToday      = [],
                proposalsThisWeek   = [],
                proposalsThisMonth  = [],
                confirmedToday      = [],
                confirmedThisWeek   = [],
                confirmedThisMonth  = [],
                deniedToday         = [],
                deniedThisWeek      = [],
                deniedThisMonth     = [];
          
            let today = moment().format('D MMM, YYYY');
            let prevWeekStart = moment().subtract(7,'d').format('D MMM, YYYY');
            let thisMonth = moment().month();

            for(let i = 0; i < groups.length; i++) {
                let submissionDate = moment(groups[i].time).format('D MMM, YYYY');
                if(today === submissionDate) {
                    proposalsToday.push(groups[i]);
                }
                if((moment(submissionDate).isSameOrBefore(today)) && (moment(submissionDate).isSameOrAfter(prevWeekStart))) {
                    proposalsThisWeek.push(groups[i]);
                }
                if(thisMonth === moment(groups[i].time).month()) {
                    proposalsThisMonth.push(groups[i]);
                }
            }

    
            res.render('revenue/dashboard', {
                name: req.user.name, 
                groups: JSON.stringify(groups), 
                pendingCount: pendingCount,
                proposalsToday: JSON.stringify(proposalsToday),
                proposalsThisWeek: JSON.stringify(proposalsThisWeek),
                proposalsThisMonth: JSON.stringify(proposalsThisMonth),
                proposalsTodayLength: proposalsToday.length,
                proposalsWeekLength: proposalsThisWeek.length,
                proposalsMonthLength: proposalsThisMonth.length
            });
        })
        .catch(err => console.log(err));
    
});

router.get('/review/:id', ensureAuthenticated, (req, res) => {
    Group.findOne({_id: req.params.id})
        .populate('user')
        .populate('comments.commentUser')
        .then(group => {
            let rateArray = Array.from(group.purposedRate);
            let roomsArray = Array.from(group.roomsPerNight);
            let totalRevenue = calculateTotalGroupRevenue(rateArray,roomsArray);

            res.render('revenue/review', 
            {
                group: group,
                totalRevenue
            });
        })
        .catch(err => console.log(err));
});

router.put('/review/update', (req, res) => {
    Group.findOne({_id: req.body.data.id})
        .then(group => {
            group.managerStatus = req.body.data.status;
            group.save()
                .then(group => {
                    res.json({msg: group.managerStatus});
                })
                .catch(err => console.log(err));
        })
});

// Add Comment Via Review Page
router.post('/review/comment/:id', (req, res) => {
    Group.findOne({
        _id: req.params.id
    })
        .then(group => {
        const newComment = {
            commentBody: req.body.commentBody,
            commentUser: req.user.id
        }
        // Add to comments array
        group.comments.unshift(newComment);
    
        group.save()
            .then(group => {
            res.redirect(`/revenue/review/${group.id}`);
            })
        });
    });

    router.get('/proposals', ensureAuthenticated, (req, res) => {
        Group.find({})
            .then(groups => {
                // filter outstanding proposals
                let filteredGroups = [];
                for(let i = 0; i < groups.length; i++) {
                    if(groups[i].managerStatus === 'Pending Review' && (groups[i].clientStatus === 'Pending')) {
                        filteredGroups.push(groups[i]);
                    }
                }
                res.render('revenue/proposals', {groups: filteredGroups});
            })
            .catch(err => console.log(err));
        
    });

module.exports = router;
