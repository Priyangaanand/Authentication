require("dotenv").config();
const express = require("express");
const app = express();
const ejs= require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const session = require('express-session')
const passport = require("passport");
const passportLocalMongoose = require('passport-local-mongoose');
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
const userSchema = new mongoose.Schema({
    username:"String",
    password:"String"
});
userSchema.plugin(passportLocalMongoose);
const userCollect = mongoose.model("User",userSchema);
passport.use(userCollect.createStrategy());
passport.serializeUser(userCollect.serializeUser());
passport.deserializeUser(userCollect.deserializeUser());
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
        res.render("secrets");
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

app.post('/login', passport.authenticate('local', {successRedirect:'/secrets',failureRedirect: '/login' }));
app.listen(3000,function()
{
    console.log("Server is running on port 3000");
});