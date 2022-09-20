//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
var _ = require('lodash');

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});

const usersSchema = new mongoose.Schema({
    email: String,
    password: String
});
  
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
    const typedInEmail = req.body.username;
    const typedInPassword = req.body.password;

    bcrypt.hash(typedInPassword, saltRounds, function(err, hash) {
        const newUser = new User({
            email: typedInEmail,
            password: hash
        });

        newUser.save(function(err){
            if(!err){
                console.log("Registration Successful!");
                res.render("secrets");
            } else {
                console.log(err);
            }
        });
    });
});

app.post("/login", function(req,res){
    const logInEmail = req.body.username;
    const logInPassword = req.body.password;

    User.findOne({ email: logInEmail }, function(err, doc){
        if (doc) {
            const hash = doc.password;
            bcrypt.compare(logInPassword, hash, function(err, result) {
                if (result === true) {
                    res.render("secrets");
                } else {
                    res.send("Invalid Password. Please Try Again");
                }
            });
        } else {
            res.send("Invalid Email. Please Try Again.");
        }
    });
});

app.listen(3000, function() {
    console.log("Server started on 3000");
});