const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Need to think about this a bit more; do we lump all proposals into groups?
const propertySchema = new mongoose.Schema({
   name: {type: String, required: true},
   revenueManager: {type: Schema.Types.ObjectId, ref:'User'},
   groups: [{type: Schema.Types.ObjectId, ref:'Group'}]
});
const Property = mongoose.model("Property", groupSchema);

module.exports = Property;