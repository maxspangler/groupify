const mongoose = require('mongoose');
let moment = require('moment');
const Schema = mongoose.Schema;


// Need to add the property (LFI, SSSBR, etc...field)
const groupSchema = new mongoose.Schema({
   name: {type: String, required: true},
   dateFrom: {type: String, required: true},
   dateTo: {type: String, required: true},
   roomType: [{type: String, required: true}],
   bestAvailableRate: [{type: String, required: true}],
   roomsPerNight: [{type: Number, required: true}],
   purposedRate: [{type: Number, required: true}],
   // connect these 3 below
   decisionDueDate: [{type: String}],
   cutOffDate: [{type: String}],
   attritionPercentage: [{type: Number}],
   discountPercentage: [{type: Number, required: true}],
   sourceOfBusiness: {type: String, required: true},
   conferenceSpace: {type: String, required: true},
   conferenceRevenue: {type: Number, default: 0},
   concessionField: {type: String},
   otherNotes: {type: String},
   clientStatus: {type: String, default: "Pending", required: true},
   managerStatus: {type: String, default: "Pending Review"},
   cancelationReason: {type: String},
   time : {type: Date, default: Date.now},
   marketType: {type: String, required: true},
   comments: [{
    commentBody: {
      type: String,
      required: true
    },
    commentDate: {
      type: Date,
      default: Date.now
    },
    commentUser: {
      type: Schema.Types.ObjectId,
      ref:'User'
    }
  }],
  user: {
    type: Schema.Types.ObjectId,
    ref:'User'
  }
});
const Group = mongoose.model("Group", groupSchema);

module.exports = Group;
