var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var ChatStatusSchema = new Schema({
  user_id: String,
  location: {
    latitude: Number,
    longitude: Number
  },
  preference: String,
  status: String
});

module.exports = mongoose.model("ChatStatus", ChatStatusSchema);
