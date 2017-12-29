var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var ChatStatusSchema = new Schema({
  user_id: String,
  location: {
    lat: String,
    long: String
  },
  preference: String,
  status: String
});

module.exports = mongoose.model("ChatStatus", ChatStatusSchema);
