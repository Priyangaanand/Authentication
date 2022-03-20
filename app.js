require("dotenv").config();
const express = require("express");
const app = express();
const ejs= require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const md5 = require("md5");
app.use(express.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(express.static("public"));
mongoose.connect('mongodb://localhost:27017/SecertsDB');
const userSchema = new mongoose.Schema({
    email:"String",
    password:"String"
});
console.log(process.env.SECERT);
userSchema.plugin(encrypt, { secret:process.env.SECERT,encryptedFields:["password"]});
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
    const userData = new userCollect({
        email:req.body.username,
        password:md5(req.body.password)
    });
    userData.save(function(err)
    {
        if(!err)
        {
            res.render("secrets");
        }
        else
        {
            console.log(err);
        }
    })
});
app.post("/login",function(req,res)
{
    const username = req.body.username;
    const password = md5(req.body.password);
    userCollect.findOne({email:username},function(err,founder)
    {
        if(err)
        {
            console.log(err);
        }
        else
        {
            // if (founder)
            {
                if(founder.password==password)
                {
                     console.log(founder.password);
                     console.log(password);
                    res.render("secrets");
                }
            }
           
        }
    })

});
app.listen(3000,function()
{
    console.log("Server is running on port 3000");
});