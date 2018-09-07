var express = require("express");
var router  = express.Router();
var Event = require("../models/event");
var Comment = require("../models/comment");
var User = require("../models/user");
var middleware = require("../middleware");
var geocoder = require('geocoder');
var { isLoggedIn, checkUserEvent, checkUserComment, isAdmin, isSafe } = middleware; // destructuring assignment
//multer settings
var multer = require('multer');
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images');
  },
  filename: function(req, file, callback) {
    callback(null,  Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

// Define escapeRegex function for search feature
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

//INDEX - show all events
router.get("/", function(req, res){
  if(req.query.search && req.xhr) {
      const regex = new RegExp(escapeRegex(req.query.search), 'gi');
      // Get all events from DB
      Event.find({name: regex}, function(err, allEvents){
         if(err){
            console.log(err);
         } else {
            res.status(200).json(allEvents);
         }
      });
  } else {
      // Get all events from DB
      Event.find({}, function(err, allEvents){
         if(err){
             console.log(err);
         } else {
            if(req.xhr) {
              res.json(allEvents);
            } else {

              res.render("events/index",{events: allEvents, page: 'events'});
            }
         }
      });
  }
});

//CREATE - add new events to DB
router.post("/", isLoggedIn, upload.single('image'), function(req, res){
  // get data from form and add to events array
  //var name = req.body.name;

  /*var desc = req.body.description;
  var category = req.body.category;
  var tags = req.body.tags;
  var date = new Date(req.body.date);*/

  //var cost = req.body.cost;
  geocoder.geocode(req.body.event.location, function (err, data) {
    if (err || data.status === 'ZERO_RESULTS') {
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    var image = req.file.filename;

    var author = {
        id: req.user._id,
        username: req.user.username
    }
    req.body.event.image = image;
    req.body.event.author = author;
    req.body.event.date = new Date(req.body.event.date);
    var lat = 1.3413132;
    var lng = 103.9637565;
    var location = req.body.event.location;
    if(data.results.length>0){
        lat = data.results[0].geometry.location.lat;
        lng = data.results[0].geometry.location.lng;
        location = data.results[0].formatted_address;
      }
    //var newEvent = {name: name, image: image, description: desc, category: category, tags: tags, date: date, author:author, location: location, lat: lat, lng: lng};
    // Create a new event and save to DB
    //Event.create(newEvent, function(err, newlyCreated){
    Event.create(req.body.event, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to events page
            console.log(newlyCreated);
            res.redirect("/events");
        }
    });
  });
});

//NEW - show form to create new event
router.get("/new", isLoggedIn, function(req, res){
   res.render("events/new");
});

// SHOW - shows more info about one event
router.get("/:id", isLoggedIn, function(req, res){
    //find the event with provided ID
    Event.findById(req.params.id).populate("comments").exec(function(err, foundEvent){
        if(err || !foundEvent){
            console.log(err);
            req.flash('error', 'Sorry, that event does not exist!');
            return res.redirect('/events');
        }
        User.findById(req.user.id).exec(function(err, user){
          if(err || !foundEvent){
              console.log(err);
              req.flash('error', 'Sorry, that event does not exist!');
              return res.redirect('/events');
          }
          else{

            foundEvent.isFavorite = user.isFavorite(req.params.id)?'Unlike':'Like';
            //render show template with that event
            res.render("events/show", {event: foundEvent});
          }

        });

    });
});

// EDIT - shows edit form for a event
router.get("/:id/edit", isLoggedIn, checkUserEvent, function(req, res){
  //render edit template with that event
  res.render("events/edit", {event: req.event});
});

// PUT - updates event in the database
router.put("/:id", upload.single('image'), function(req, res){



  Event.findById(req.params.id, function(err, event){
      if(err){
          req.flash("error", err.message);
          res.redirect("back");
      } else {

          if(req.file){
            // deleting old file
            var fs = require('fs');
            var path = "./public/images/" +event.image;
            fs.unlink(path, function(error) {
                if (error) {
                    throw error;
                }
                event.image = req.file.filename;
                console.log('Deleted file!!');
            });

          }

          geocoder.geocode(req.body.location, function (err, data) {
            if (err || data.status === 'ZERO_RESULTS') {
              req.flash('error', 'Invalid address');
              return res.redirect('back');
            }
            event.lat = 1.3413132;
            event.lng = 103.9637565;
            event.location = req.body.location;
            if(data.results.length>0){
                event.lat = data.results[0].geometry.location.lat;
                event.lng = data.results[0].geometry.location.lng;
                event.location = data.results[0].formatted_address;
              }
          event.name = req.body.name;
          event.description = req.body.description;
          event.date = new Date(req.body.date);
          event.category = req.body.category;
          event.tags = req.body.tags;
          event.save();
          req.flash("success","Successfully Updated!");
          res.redirect("/events/" + event._id);

        });
      }


  });
});


// DELETE - removes event and its comments from the database
router.delete("/:id", isLoggedIn, checkUserEvent, function(req, res) {
    Comment.remove({
      _id: {
        $in: req.event.comments
      }
    }, function(err) {
      if(err) {
          req.flash('error', err.message);
          res.redirect('/');
      } else {
        // deleting file from server
        if(req.event.image){

          var fs = require('fs');
          var path = "./public/images/" +req.event.image;
          fs.unlink(path, function(error) {
              if (error) {
                  throw error;
              }
              console.log('Deleted file!!');
          });

        }
          req.event.remove(function(err) {
            if(err) {
                req.flash('error', err.message);
                return res.redirect('/');
            }
            req.flash('error', 'Event deleted!');
            res.redirect('/events');
          });
      }
    })
});

// Like event route
router.post('/:id/favorite', isLoggedIn, function(req,res){

   User.findById(req.user._id, function(err,user){
     if(err){
       req.flash("error", err.message);
       res.redirect("back");
     }
     else{

          Event.findById(req.params.id, function(err, event){
              if(err){
                  req.flash("error", err.message);
                  res.redirect("back");
              } else {

                if(user.isFavorite(event._id)){
                      user.unfavorite(event._id);
                      event.favoritesCount = event.favoritesCount<1? 0:event.favoritesCount-1;
                    }
                  else{
                     user.favorite(event._id, event);
                     event.favoritesCount = event.favoritesCount+1;
                  }
                  event.save();
                  res.redirect("/events/" + event._id);
              }
            });
        }

    });
});


module.exports = router;
