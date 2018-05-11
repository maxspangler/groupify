const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Group = require('../models/Group');
var moment = require('moment');

const {ensureAuthenticated} = require('../helpers/auth');
const {arraysEqual} = require('../helpers/array');
const {calculateTotalGroupRevenue} = require('../helpers/calculateTotalRevenue');

router.get('/create', ensureAuthenticated, (req, res) => {
    res.render('groups/create');
});

router.get('/proposals', ensureAuthenticated, (req, res) => {
    Group.find({})
        .then(groups => {
            res.render('groups/proposals', {groups: groups});
        })
        .catch(err => console.log(err));
});


// Create a new group proposal 
router.post('/create/new', (req, res) => {
    let roomTypeArr = [];
    let roomNightsArr = [];
    let roomRatesArr = [];
    let errors = [];

    for (var key in req.body){
        // need to figure out a better way to validate the form
        console.log("Key: " + key + " Value: " + req.body[key]);

        // if(key.includes('roomTypeSelect') && req.body[key] === '') {
        //     errors.push({text: 'room type'})
        // }
        if(key.includes('purposedRate') && req.body[key] === '') {
            errors.push({text: 'Please completely fill out the proposal'})
        }
        // if(key.includes('roomsPerNight') && req.body[key] === '') {
        //     errors.push({text: 'per night'})
        // }
        
    }


    if(!req.body.groupName) errors.push({text: 'Please add a group name'});
    if(!req.body.groupDateFrom) errors.push({text: 'Please add an arrival date'});
    if(!req.body.groupDateTo) errors.push({text: 'Please add a departure date'});
//    if(!req.body.roomTypeSelect) errors.push({text: 'Please add a room type'});
//    if(!req.body.purposedRate) errors.push({text: 'Please add propose a rate'});
//    if(!req.body.roomsPerNight) errors.push({text: 'Please add rooms'});
    if(!req.body.sourceOfBusiness) errors.push({text: 'Please add a source of business'});
    if(!req.body.conferenceOption) errors.push({text: 'Please add a conference option'});


   if(errors.length > 0) {
       res.render('groups/create', {errors: errors})
   }
   else {
        Object.entries(req.body).forEach(
            ([key, value]) => {
                if(key.includes('roomTypeSelect')) {
                    roomTypeArr.push(value);
                }
                if(key.includes('purposedRate')) {
                    roomRatesArr.push(value);
                }
                if(key.includes('roomsPerNight')) {
                    roomNightsArr.push(value);
                }
            }
        );
        

        const newGroup = {
            name: req.body.groupName,
            dateFrom: req.body.groupDateFrom,
            dateTo: req.body.groupDateTo,
            roomType: roomTypeArr,
            purposedRate: roomRatesArr,
            roomsPerNight: roomNightsArr,
            sourceOfBusiness: req.body.sourceOfBusiness,
            conferenceRevenue: req.body.conferenceRevenue,
            conferenceSpace: req.body.conferenceOption,
            otherNotes: req.body.otherNotes
        }

        new Group(newGroup)
            .save()
            .then(group => {
                let totalGroupRevenue = calculateTotalGroupRevenue(roomRatesArr,roomNightsArr);
                const output = `
                <p>You have a new group proposal.</p>
                <h3>Proposal Quick View:</h3>
                <ul>
                    <li>Client: ${group.name}</li>
                    <li>Arrival Date: ${group.dateFrom}</li>
                    <li>Departure Date: ${group.dateTo}</li>
                    <table>
                        <tbody>
                            <tr>
                                <th>Room Type</th>
                                <th>Purposed Rates</th>
                                <th>Rooms per Night Requested</th>
                            </tr>
                            ${createTable()}
                        </tbody>
                    </table>
                    <li>Total Group Revenue: ${totalGroupRevenue}</li>
                    <li>Conference Space Requested: ${group.conferenceSpace}</li>
                    <li>Conference Space Revenue: ${group.conferenceRevenue}</li>
                    <li>Other notes: ${group.otherNotes}</li>

                </ul>
                <p>To review this proposal, please <a href="http://localhost:3000/groups/review/${group._id}">login.</a></p>
                `;
                
                function createTable() {
                    let len = roomNightsArr.length;
                    let table = '';
                    for(var i = 0; i < len; i++ ) {
                        table += `
                            <tr>
                                <td align="center">${roomTypeArr[i]}</td>
                                <td align="center">${roomRatesArr[i]}</td>
                                <td align="center">${roomNightsArr[i]}</td>
                            </tr>
                        `;
                    }
                    return table;
                }
                const sgMail = require('@sendgrid/mail');
                sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                const msg = {
                to: 'mspangler@litchfieldinn.com',
                from: 'proposals@salesapp.com',
                subject: 'New Proposal Submission',
                html: output,
                };
                sgMail.send(msg);

                req.flash('success_msg', 'A new group proposal has been created.');
                res.redirect('/groups/proposals')
            })
            .catch(err => console.log(err));
    }
});


// We will need to do the same validation on the form as we do on create
router.put('/edit/:id', (req, res) => {
    Group.findOne({_id: req.params.id})
        .then(group => {
          // Req.body comes in weird because of how I generate new fields on the edit form
          // The new arrays and looping is to catch the appropriate fields and put them in arrays
          // for the new group
          let roomTypeArray = [];
          let roomsPerNightArray = [];
          let purposedRateArray = [];
          for(var key in req.body) {
              if(key.includes('roomTypeSelect')) {
                  roomTypeArray.push(req.body[key])
              }
              else if(key.includes('roomsPerNight')) {
                    roomsPerNightArray.push(req.body[key])
              }
              else if(key.includes('purposedRate')) {
                    purposedRateArray.push(req.body[key])
              }
          }

            // a problem we have now is that, because of how it's currently designed,
            // we can't sort the arrays above because it changes the order
            // we depend on keeping the order of the arrays because it maintains the correct
            // correlation between room types, rates and rooms per night
            // we may want to create an array of objects, each obj containing the appropriate info
           
            // if any changes, highlight them?
           
            let oldGroup = {};
            oldGroup.name = group.name;
            oldGroup.dateFrom = group.dateFrom;
            oldGroup.dateTo = group.dateTo;
            oldGroup.roomType = group.roomType;
            oldGroup.roomsPerNight = group.roomsPerNight;
            oldGroup.purposedRate = group.purposedRate;
            oldGroup.sourceOfBusiness = group.sourceOfBusiness;
            oldGroup.conferenceSpace = group.conferenceSpace;
            oldGroup.conferenceRevenue = group.conferenceRevenue;
            oldGroup.otherNotes = group.otherNotes;
            
            // add updated data to group before re-save                       
            group.name = req.body.groupName;
            group.dateFrom = req.body.groupDateFrom;
            group.dateTo = req.body.groupDateTo;
            group.roomType = roomTypeArray;
            group.roomsPerNight = roomsPerNightArray;
            group.purposedRate = purposedRateArray;
            group.sourceOfBusiness = req.body.sourceOfBusiness;
            group.conferenceSpace = req.body.conferenceOption;
            group.conferenceRevenue = req.body.conferenceRevenue;
            group.otherNotes = req.body.otherNotes;

            // below we compare fields to figure out what changed

            // create style variables
            let groupNameStyleClass;
            let dateFromStyleClass;
            let dateToStyleClass;
            let roomTypeStyleClass;
            let roomsPerNightStyleClass;
            let purposedRateStyleClass;
            let totalGroupRevenueStyleClass;
            let conferenceSpaceStyleClass;
            let conferenceRevenueStyleClass;
            let otherNotesStyleClass;

            let oldGroupTotal = calculateTotalGroupRevenue(oldGroup.roomsPerNight, oldGroup.purposedRate);
            let newGroupTotal = calculateTotalGroupRevenue(group.roomsPerNight, group.purposedRate);

            // set style
            let highlightChange = 'style="color:red"';

            // check for changes
            if(oldGroup.name != group.name) groupNameStyleClass = highlightChange;
            if(oldGroup.dateFrom != group.dateFrom) dateFromStyleClass = highlightChange;
            if(oldGroup.dateTo != group.dateTo) dateToStyleClass = highlightChange;
            if(oldGroupTotal != newGroupTotal) totalGroupRevenueStyleClass = highlightChange;
            if(oldGroup.conferenceSpace != group.conferenceSpace) conferenceSpaceStyleClass = highlightChange;
            if(oldGroup.conferenceRevenue != group.conferenceRevenue) conferenceRevenueStyleClass = highlightChange;
            if(oldGroup.otherNotes != group.otherNotes) otherNotesStyleClass = highlightChange;

            

            // make copies of arrays so not to disturb original
            let oldRoomTypeArray = oldGroup.roomType.slice(0);
            let newRoomTypeArray = group.roomType.slice(0);
            oldRoomTypeArray.sort();
            newRoomTypeArray.sort();
            if(arraysEqual(oldRoomTypeArray, newRoomTypeArray)) {
                roomTypeStyleClass = '';
            }
            else {
                roomTypeStyleClass = highlightChange;
            }

            let oldRatesArray = oldGroup.purposedRate.slice(0);
            let newRatesArray = group.purposedRate.slice(0);
            oldRatesArray.sort();
            newRatesArray.sort();
            if(arraysEqual(oldRatesArray, newRatesArray)) {
                purposedRateStyleClass = '';
            }
            else {
                purposedRateStyleClass = highlightChange;
            }

            let oldRoomsPerNightArray = oldGroup.roomsPerNight.slice(0);
            let newRoomsPerNightArray = group.roomsPerNight.slice(0);
            oldRoomsPerNightArray.sort();
            newRoomsPerNightArray.sort();
            if(arraysEqual(oldRoomsPerNightArray, newRoomsPerNightArray)) {
                roomsPerNightStyleClass = '';
            }
            else {
                roomsPerNightStyleClass = highlightChange;
            }

       
            
            group.save()
                .then(group => {
                    
                    let output = `
                    <p>You have a revised proposal.</p>
                    <h3>Proposal Quick View:</h3>
                    <ul style="display:inline-block">
                        <li>Client: ${oldGroup.name}</li>
                        <li>Arrival Date: ${oldGroup.dateFrom}</li>
                        <li>Departure Date: ${oldGroup.dateTo}</li>
                        <li>Room Type: ${oldGroup.roomType}</li>
                        <li>Purposed Rate: $ ${oldGroup.purposedRate}</li>
                        <li>Rooms per Night Requested: ${oldGroup.roomsPerNight} </li>
                        <li>Total Group Revenue: ${oldGroupTotal}</li>
                        <li>Conference Space Requested: ${oldGroup.conferenceSpace}</li>
                        <li>Conference Space Revenue: ${oldGroup.conferenceRevenue}</li>
                        <li>Other notes: ${oldGroup.otherNotes}</li>
                    </ul>
                    <div style="display:inline-block"><img src="https://vignette.wikia.nocookie.net/cow-evolution/images/c/c5/Arrow-right.png/revision/latest?cb=20150606221716" hspace="20" height="50px" width="50px"></div>
                    <ul style="display:inline-block">
                        <li ${groupNameStyleClass}>Client: ${group.name}</li>
                        <li ${dateFromStyleClass}>Arrival Date: ${group.dateFrom}</li>
                        <li ${dateToStyleClass}>Departure Date: ${group.dateTo}</li>
                        <li ${roomTypeStyleClass}>Room Type: ${roomTypeArray}</li>
                        <li ${purposedRateStyleClass}>Purposed Rate: $ ${purposedRateArray}</li>
                        <li ${roomsPerNightStyleClass}>Rooms per Night Requested: ${roomsPerNightArray} </li>
                        <li ${totalGroupRevenueStyleClass}>Total Group Revenue: ${newGroupTotal}</li>
                        <li ${conferenceSpaceStyleClass}>Conference Space Requested: ${group.conferenceSpace}</li>
                        <li ${conferenceRevenueStyleClass}>Conference Space Revenue: ${group.conferenceRevenue}</li>
                        <li ${otherNotesStyleClass}>Other notes: ${group.otherNotes}</li>
                    </ul>
                    <p>To review this updated proposal, please <a href="http://localhost:3000/groups/review/${group._id}">login.</a></p>
                    `;

                   
                    const sgMail = require('@sendgrid/mail');
                    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                    const msg = {
                    to: 'mspangler@litchfieldinn.com',
                    from: 'proposals@salesapp.com',
                    subject: 'Proposal Revision',
                    html: output,
                    };
                    sgMail.send(msg);
                    req.flash('success_msg', 'Proposal updated.');
                    res.redirect('/groups/proposals');
                })
                .catch(err => console.log(err));
        })
});


// Add Comment Via Show Page
router.post('/comment/:id', (req, res) => {
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
            res.redirect(`/groups/${group.id}`);
          })
      });
  });



// Show Single Group
router.get('/:id', ensureAuthenticated, (req, res) => {
    Group.findOne({_id: req.params.id})
        .populate('user')
        .populate('comments.commentUser')
        .then(group => {
            let user = JSON.stringify(req.user);
            res.render('groups/show', {group: group, user: user});
        })
        .catch(err => console.log(err));
});

router.get('/edit/:id', ensureAuthenticated, (req, res) => {
    Group.findOne({_id: req.params.id})
        .then(group => {
            
            res.render('groups/edit', {group: group, msg: 'Fetching updates...'});
        })
        .catch(err => console.log(err));
});

router.put('/update/status', (req, res) => {
    Group.findOne({_id: req.body.payload.id})
        .then(group => {
            group.clientStatus = req.body.payload.status;
            if(group.clientStatus == 'Canceled')  {
                group.cancelationReason = req.body.payload.cancelationReason || '';
            }
            else {
                group.cancelationReason = '';
            }
            group.save()
                .then(group => {
                    res.json({message: 'Group status updated.'});
                })
                .catch(err => console.log(err));
        })
});

module.exports = router;
