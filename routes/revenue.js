const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Group = require('../models/Group');
var moment = require('moment');
// This is the package that allows us to use the breadcrumbs feature; 
// When the user hits a certain route; we save that url in the session, when they authenticate later,
// we redirect them to that page
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn

// This relates to how we check the dates for the rev dashboard, specifically, comparing the week dates
moment.suppressDeprecationWarnings = true;

const {ensureAuthenticated} = require('../helpers/auth');
const {calculateTotalGroupRevenue} = require('../helpers/calculateTotalRevenue');
const {sendEmail} = require('../helpers/emailHandler');


router.get('/dashboard', ensureAuthenticated, (req, res) => {
    Group.find({})
        .then(groups => {
            // count pending proposals and send to dashboard; move this to a func later
            let pendingCount = 0;
            for(let i = 0; i < groups.length; i++) {
                if((groups[i].managerStatus === 'Pending Review') && (groups[i].clientStatus === 'Pending')) {
                    pendingCount++;
                }
            }
            // Figure out how many submitted today, week, month
            let proposalsToday      = [],
                proposalsThisWeek   = [],
                proposalsThisMonth  = [];
          
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
// add a warning or email when decision due date approaches
router.get('/review/:id', ensureLoggedIn('/users/login'), (req, res) => {
    Group.findOne({_id: req.params.id})
        .populate('user')
        .populate('comments.commentUser')
        .then(group => {
            let rateArray = Array.from(group.purposedRate);
            let roomsArray = Array.from(group.roomsPerNight);
            let totalRevenue = calculateTotalGroupRevenue(rateArray,roomsArray);
            let arrivalDayOfWeek = moment(group.dateFrom).format('dddd');
            let arrivalDayOfWeekNumber = moment(group.dateFrom).date();
            let arrivalMonth = moment(group.dateFrom).format('MMMM');
            let arrivalYear = moment(group.dateFrom).year();
            let arrivalDate = moment(group.dateFrom).format('MM/DD/YY');
            let departureDate = moment(group.dateTo).format('MM/DD/YY');
            let departureDayOfWeek = moment(group.dateTo).format('dddd');
            let departureDayOfWeekNumber = moment(group.dateTo).date();
            let departureMonth = moment(group.dateTo).format('MMMM');
            let departureYear = moment(group.dateTo).year();
            let submissionTime = moment(group.time).format('MM/DD/YY');
            let repeatGuestFlag = false;
            let cutOffDateFormatted;
            let decisionDueDateFormatted;
            let decisionAlert = false;

            if(group.sourceOfBusiness == 'Repeat Guest') {
                repeatGuestFlag = true;
            }
            else {
                repeatGuestFlag = false;
            }
            // calculate the difference between today and the decision date
            // send alert if we're within a window
            if(group.decisionDueDate.length > 0) {
                decisionDueDateFormatted = moment(group.decisionDueDate[0]).format('MM/DD/YY');
                let start = moment().format('MM/DD/YY')
                let end = moment(group.decisionDueDate[0])
                var diffTime = Math.floor(moment.duration(end.diff(start)).asDays());
                if(diffTime <= 5) decisionAlert = true;

            } 
            else {
                decisionDueDateFormatted = 'None selected.'
            }

            if(group.cutOffDate.length > 0) {
                cutOffDateFormatted = moment(group.cutOffDate[0]).format('MM/DD/YY')
            }
            else {
                cutOffDateFormatted = 'None selected.'
            }


            res.render('revenue/review', 
            {
                group,
                totalRevenue,
                arrivalDate,
                arrivalDayOfWeek,
                arrivalDayOfWeekNumber,
                arrivalMonth,
                arrivalYear,
                departureDayOfWeek,
                departureDayOfWeekNumber,
                departureDate,
                departureMonth,
                departureYear,
                submissionTime,
                repeatGuestFlag,
                cutOffDateFormatted,
                decisionDueDateFormatted,
                decisionAlert
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
                    // Send email to Sales Agent, indicating status (Approve, Deny)
                    let output = 
                    `
                    <p>Your Revenue Manager has updated the status for a proposal.</p>
                    <p>${group.name} has been updated to a status of ${group.managerStatus}</p>
                    `;
                    sendEmail(
                        'smikesic@litchfieldinn.com', 
                        'revenue@groupify.app',
                        'Proposal Update',
                         output
                        );
                    res.json({msg: group.managerStatus});
                })
                .catch(err => console.log(err));
        })
});

// Add Comment Via Review Page
router.post('/review/comment/:id', ensureLoggedIn('/users/login'), (req, res) => {
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
                let output = 
                `
                <p>Your Sales Agent has posted a comment on ${group.name} </p>
                <p>Comment: ${req.body.commentBody}</p>
                <p>To review this updated proposal, please <a href="https://groupify.app/revenue/review/${group._id}">login.</a></p>
                `;
                sendEmail(
                    'rroyer@charlestownehotels.com', 
                    'sales@groupify.app',
                    'New Comment',
                     output
                    );
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

