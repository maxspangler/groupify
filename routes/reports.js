const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Group = require('../models/Group');
var moment = require('moment');

const {ensureAuthenticated} = require('../helpers/auth');
const {parseDate} = require('../helpers/parse');
const {sendEmail} = require('../helpers/emailHandler');

router.get('/', ensureAuthenticated, (req, res) => {
    res.render('reports/reports')
});

router.post('/', (req, res) => {
    if(req.body.payload.message == 'reportEmitted') { 
        let date = req.body.payload.date;
        date = parseDate(date);
        date.setDate(date.getDate()-7);
        
         let startOfReportDate = date;
         let endOfReportDate = new Date(+date);
         endOfReportDate.setDate(endOfReportDate.getDate()+7);
        
        Group.find({
            time: {
               $gt: startOfReportDate,
               $lt: endOfReportDate
            }
          })
          .then(groups => {   
            let groupLength = groups.length;
            res.json({length: groupLength, groups:groups});
          })
         }
        
});


router.post('/submit', (req, res) => {
    if(req.body.payload.message == 'reportEmitted') { 
        let date = req.body.payload.date;
        date = parseDate(date);
        date.setDate(date.getDate()-7);
        
         let startOfReportDate = date;
         let endOfReportDate = new Date(+date);
         endOfReportDate.setDate(endOfReportDate.getDate()+7);
        
        
        
        Group.find({
            time: {
               $gt: startOfReportDate,
               $lt: endOfReportDate
            }
          })
          .then(groups => {

            let namesArray = [];
            let arrivalDateArray = [];
            let departureDateArray = [];
            let clientStatusArray = [];
            let otherNotesArray = [];

            for(var i = 0; i < groups.length; i++) {
                namesArray.push(groups[i].name);
                arrivalDateArray.push(groups[i].dateFrom);
                departureDateArray.push(groups[i].dateTo);
                clientStatusArray.push(groups[i].clientStatus);
                otherNotesArray.push(groups[i].otherNotes)
            }
            
            function createTable() {
                let len = groups.length;
                let table = '';
                for(var i = 0; i < len; i++ ) {
                    table += `
                        <tr>
                            <td align="center">${namesArray[i]}</td>
                            <td align="center">${arrivalDateArray[i]}</td>
                            <td align="center">${departureDateArray[i]}</td>
                            <td align="center">${clientStatusArray[i]}</td>
                            <td align="center">${otherNotesArray[i]}</td>
                        </tr>
                        `;
                    }
                return table;
                } 

            let title = `<h4>Sales Report for the week of ${endOfReportDate}</h4>`
            let output = `
            <table class="table table-bordered table-striped">
                <thead>
                    <tr>
                        <th>Group Name</th>
                        <th>Arrival Date</th>
                        <th>Departure Date</th>
                        <th>Client Status</th>
                        <th>Other Notes</th>
                    </tr>
                </thead>
                <tbody>
                ${createTable()}
                </tbody>  
            <table>
            `;
            
            // the receiver field will eventually need to be some sort of property based variable
            sendEmail(
                'mspangler@litchfieldinn.com', 
                'reporting@groupify.app',
                'Weekly Sales Report',
                 title + output
                );
       
            res.json({msg: 'Report Submitted Successfully'});
          })
          .catch(err => console.log(err));
         }
        
});


module.exports = router;