require("dotenv").config();
const express = require("express");
const app = express();
const ejs= require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const bcrypt = require("bcrypt");
const saltRounds=10;
app.use(express.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(express.static("public"));
mongoose.connect('mongodb://localhost:27017/SecertsDB');
const userSchema = new mongoose.Schema({
    email:"String",
    password:"String"
});
const userCollect = mongoose.model("user",userSchema);
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
app.post("/register",function(req,res)
{
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        const userData = new userCollect({
            email:req.body.username,
            password:hash
        });
        userData.save(function(err)
        {
            if(!err)
            {
                res.render("secrets");
                console.log(hash);
            }
            else
            {
                console.log(err);
            }
        })
    });
    
});
app.post("/login",function(req,res)
{
    const username = req.body.username;
    const password = req.body.password;
    userCollect.findOne({email:username},function(err,founder)
    {
        if(err)
        {
            console.log(err);
        }
        else
        {
            if (founder)
            {
                bcrypt.compare(password, founder.password, function(err, result) {
                    if(result == true)
                    {
                        res.render("secrets");
                        console.log(password);
                       
                    }
                });
            }
           
        }
    })

});
app.listen(3000,function()
{
    console.log("Server is running on port 3000");
});