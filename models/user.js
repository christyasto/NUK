var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    username: {type: String, unique: true, required:true},
    password: String,
    firstname: String,
    lastname: String,
    email: {type: String, unique: true, required:true},
    resetPasswordToken : String,
    resetPasswordExpires : Date,
    avatar: String,
    favorites: [{
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event"
          },
          eventname: String,
          eventtime: Date,
          authorId: String,
          authorName: String
        }],
    isAdmin: {type: Boolean, default: false}
});



UserSchema.methods.favorite = function(id, eventDetails){

  var isInArray = this.favorites.some(function (event) {
      return event.equals(id);
  });

    if(!isInArray){
      var event = {
        _id : id,
        eventname : eventDetails.name,
        eventtime : eventDetails.date,
        authorName: eventDetails.author.username,
        authorId  : eventDetails.author.id.toString()
      };

        this.favorites.push(event);
    }
    //console.log("like");
    return this.save();
};
UserSchema.methods.unfavorite = function(id){
    this.favorites.remove(id);
    //console.log("unlike");
    return this.save();
};
UserSchema.methods.isFavorite = function(id){

    return this.favorites.some(function(favoriteId){
        return favoriteId.equals(id);
    });
};

UserSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model("User", UserSchema);
