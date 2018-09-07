var mongoose = require("mongoose");

//var user = require("../models/user");
var eventSchema = new mongoose.Schema({
   name: String,
   image: String,
   description: String,
   category: String,
   date: Date,
   tags: String,
   location: String,
   lat: Number,
   lng: Number,
   favoritesCount:{type:Number, default:0},
   createdAt: { type: Date, default: Date.now },
   author: {
      id: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User"
      },
      username: String
   },
   comments: [
      {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Comment"
      }
   ]
});

eventSchema.methods.updateFavoriteCount = function(){
    var event = this;
    var objectId = mongoose.Types.ObjectId(event._id);
    return User.count({favorites: {$in: [event._id]}}).then(function(count){
        event.favoritesCount = count;
        console.log(count);
        return event.save();
    });

};

module.exports = mongoose.model("Event", eventSchema);
