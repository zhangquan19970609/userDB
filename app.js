//jshint esversion:6

// require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
var _ = require('lodash');

const mongoose = require('mongoose');
// const encrypt = require('mongoose-encryption');
const md5 = require('md5');

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});

const usersSchema = new mongoose.Schema({
    email: String,
    password: String
});

// console.log(process.env.ROGUEKEY);
// usersSchema.plugin(encrypt, { 
//     secret: process.env.KEY, 
//     encryptedFields: ['password'] 
// });
  
const User = new mongoose.model("User", usersSchema);

app.get("/",function(req,res){
    res.render("home");
});

app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register",function(req,res){
    res.render("register");
});

app.post("/register", function(req,res){
    
    const newUser = new User({
        email: req.body.username,
        password: md5(req.body.password)
    });

    newUser.save(function(err){
        if(!err){
            console.log("Registration Successful!");
            res.render("secrets");
        } else {
            console.log(err);
        }
    });

    console.log("The Hashed password of this user is:");
    console.log(newUser.password);
});

app.post("/login", function(req,res){
    const typedEmail = req.body.username;
    const typedPassword = md5(req.body.password);

    User.findOne({ email: typedEmail }, function(err, doc){
        if (doc) {
            if (typedPassword === doc.password) {
                res.render("secrets");
            } else {
                res.send("Invalid Password. Please Try Again");
            }
        } else {
            res.send("Invalid Email. Please Try Again.");
        }
    });
});

app.listen(3000, function() {
    console.log("Server started on 3000");
});