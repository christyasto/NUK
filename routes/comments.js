const express = require("express");
const router  = express.Router({mergeParams: true});
const Event = require("../models/event");
const Comment = require("../models/comment");
const middleware = require("../middleware");
const { isLoggedIn, checkUserComment, isAdmin } = middleware;

//Comments New
router.get("/new", isLoggedIn, function(req, res){
    // find event by id
    console.log(req.params.id);
    Event.findById(req.params.id, function(err, event){
        if(err){
            console.log(err);
        } else {
             res.render("comments/new", {event: event});
        }
    })
});

//Comments Create
router.post("/", isLoggedIn, function(req, res){
   //lookup event using ID
   Event.findById(req.params.id, function(err, event){
       if(err){
           console.log(err);
           res.redirect("/events");
       } else {
        Comment.create(req.body.comment, function(err, comment){
           if(err){
               console.log(err);
           } else {
               //add username and id to comment
               comment.author.id = req.user._id;
               comment.author.username = req.user.username;
               //save comment
               comment.save();
               event.comments.push(comment);
               event.save();
               //console.log(comment);
               req.flash('success', 'Created a comment!');
               res.redirect('/events/' + event._id);
           }
        });
       }
   });
});

router.get("/:commentId/edit", isLoggedIn, checkUserComment, function(req, res){
  res.render("comments/edit", {event_id: req.params.id, comment: req.comment});
});

router.put("/:commentId", isAdmin, function(req, res){
   Comment.findByIdAndUpdate(req.params.commentId, req.body.comment, function(err, comment){
       if(err){
          console.log(err);
           res.render("edit");
       } else {
           res.redirect("/events/" + req.params.id);
       }
   });
});

router.delete("/:commentId", isLoggedIn, checkUserComment, function(req, res){
  // find event, remove comment from comments array, delete comment in db
  Event.findByIdAndUpdate(req.params.id, {
    $pull: {
      comments: req.comment.id
    }
  }, function(err) {
    if(err){
        console.log(err)
        req.flash('error', err.message);
        res.redirect('/');
    } else {
        req.comment.remove(function(err) {
          if(err) {
            req.flash('error', err.message);
            return res.redirect('/');
          }
          req.flash('error', 'Comment deleted!');
          res.redirect("/events/" + req.params.id);
        });
    }
  });
});

module.exports = router;
