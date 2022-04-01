require("dotenv").config();
const express = require("express");
const app = express();
const ejs= require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const session = require('express-session')
const passport = require("passport");
const passportLocalMongoose = require('passport-local-mongoose');
const findOrCreate = require("mongoose-find-or-create");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
app.use(express.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(express.static("public"));
app.use(session({
    secret: 'our little secert',
    resave: false,
    saveUninitialized: true
  }))
app.use(passport.initialize());
app.use(passport.session());
mongoose.connect('mongodb://localhost:27017/SecertsDB');
const SecretSchema = new mongoose.Schema({
    secret_User:[{type:String}]
});
const SecretCollect = new mongoose.model("secret",SecretSchema);
const userSchema = new mongoose.Schema({
    email:String,
    password:String,
    googleId:String,
    secretofUser:[SecretSchema]
    
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const userCollect = mongoose.model("User",userSchema);
passport.use(userCollect.createStrategy());
passport.serializeUser(function(user, done) {
    done(null, user.id); 
});
passport.deserializeUser(function(id, done) {
    userCollect.findById(id, function(err, user) {
        done(err, user);
    });
});
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    userCollect.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err,user);
    });
  }
));

app.get("/auth/google",
  passport.authenticate("google", { scope: ['profile'] }));

app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });
  passport.use(new FacebookStrategy({
    clientID: process.env.APP_ID,
    clientSecret: process.env.APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
   userCollect.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
app.get("/auth/facebook",
  passport.authenticate('facebook'));

app.get("/auth/facebook/secrets",
  passport.authenticate("facebook", { failureRedirect: "/login"}),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });
app.get("/",function(req,res)
{
 res.render("home");

});
app.get("/login",function(req,res)
{
res.render("login");
});
app.get("/register",function(req,res)
{
res.render("register");
});
app.get("/secrets",function(req,res)
{
    if(req.isAuthenticated())
    {
      userCollect.find({secretofUser:{ $ne: null }},function(err,docs)
      {
        if(err)
        {
          console.log(err)
        }
        else
        {
          if(docs)
          {
            console.log(docs);
            console.log(docs);
            res.render("secrets",{userSecrets:docs});
          }
        }
      });
        
    }
    else
    {
        res.redirect("/login")
    }
});
app.get("/submit",function(req,res)
{
  if(req.isAuthenticated())
    {
        res.render("submit");
    }
    else
    {
        res.redirect("/login")
    }
});
app.get("/logout",function(req,res)
{
    req.logout();
    res.redirect("/");
});
app.post("/submit",function(req,res)
{
    const Id = req.user.id;
    const submittedSecrets = req.body.secret
    const userItem = new SecretCollect
    ({
        secret_User:submittedSecrets
    });
    userItem.save();
    userCollect.findOne({_id:Id},function(err,founduser)
    {
      if(err)
      {
        console.log(err)
      }
      else
      {
        if(founduser)
        {
          founduser.secretofUser.push(userItem);
          founduser.save(function()
          {
            res.redirect("/secrets")
          })
        }
      }
    });
});
app.post("/register",function(req,res)
{
    userCollect.register({username: req.body.username},req.body.password,function(err,user)
    {
        if(err)
        {
            console.log(err)
            res.redirect("/register");
        }
        else
        {
            passport.authenticate("local")(req,res,function()
            {
                res.redirect("/secrets");
            });
            
        }
        
    });
});

app.post("/login", passport.authenticate("local", {successRedirect:'/secrets',failureRedirect: '/login' }));
app.listen(3000,function()
{
    console.log("Server is running on port 3000");
});