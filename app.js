//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require('lodash');

const mongoose = require('mongoose');
// const bcrypt = require('bcrypt');
// const saltRounds = 10;

const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
    secret: 'SecretACCE55', 
    // 一行用于加密的自定义字符；
    resave: false,
    saveUninitialized: false 
    // 是否将未初始化的对话强制保存？选择 false，因为遵守法律 + 减少存储占用
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});

const usersSchema = new mongoose.Schema({
    email: String,
    password: String
});

usersSchema.plugin(passportLocalMongoose);
// 使用 schema 名称

const User = new mongoose.model("User", usersSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
// 使用 Model 名称

app.get("/",function(req,res){
    res.render("home");
});

app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register",function(req,res){
    res.render("register");
});

// 使用 passport local mongoose 的唯一目的：
// 让处于登录 session 内的用户，如 前往 /secrets, 则无须重复登录，直接 direct 到 /secrets
// 使用 req.isAuthenticated() 来判断，如果通过验证则 render 到 secrets，
// 如果未通过则前往 login 页面登录。

// register 并 render 到 /secrets 之后，关闭页面，也可以再输入 /secrets 浏览！
    // 但如果关闭浏览器（清空了设置的缓存）或在 nodemon 中重启了 app.js，
    // 再前往 /secrets 就会被重新定向到 login！
app.get("/secrets",function(req,res){
    if (req.isAuthenticated()){
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
});

app.get("/logout",function(req,res){
    req.logout(function(err){
        if(err){
            console.log(err);
        }
    });
    res.redirect("/");
}); 

app.post("/register", function(req,res){
    // const typedInEmail = req.body.username;
    // const typedInPassword = req.body.password;

    // bcrypt.hash(typedInPassword, saltRounds, function(err, hash) {
    //     const newUser = new User({
    //         email: typedInEmail,
    //         password: hash
    //     });

    //     newUser.save(function(err){
    //         if(!err){
    //             console.log("Registration Successful!");
    //             res.render("secrets");
    //         } else {
    //             console.log(err);
    //         }
    //     });
    // });
    User.register({username: req.body.username}, req.body.password, function(err, user) {
        if (err) { 
            console.log(err);
            res.redirect("/register");
            // 当出 error 时，重新加载到 register page
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
                // 此时不能用 render 了，（虽然一定要用也可以，但无法实现 session 功能）
                // 因为之前一直使用 reg/log render 到 ejs page，但 ejs 无法用于 redirect！
                // 必须新建立一个 app.get secrets route，
                // 实现登录一次后便处于登录状态，session 内免登录，
                // session 时间内直接前往 /secrets 路径也可以直接浏览。
            });
        }
    });
    // 加入 User.register 后，重新运行网页并 Register，
    // DB 中多了一个 username field，not email field，
});

app.post("/login", function(req,res){
    // const logInEmail = req.body.username;
    // const logInPassword = req.body.password;

    // User.findOne({ email: logInEmail }, function(err, doc){
    //     if (doc) {
    //         const hash = doc.password;
    //         bcrypt.compare(logInPassword, hash, function(err, result) {
    //             if (result === true) {
    //                 res.render("secrets");
    //             } else {
    //                 res.send("Invalid Password. Please Try Again");
    //             }
    //         });
    //     } else {
    //         res.send("Invalid Email. Please Try Again.");
    //     }
    // });

    // 并非新建用户，只是建立一个对照 object！
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    // login 这个 user，并在已经 reg 的 objects 中查找，
    // 如果没有发现 这个 username 的 document，则返回一个 error。
                
    req.login(user, function(err){
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });
                
    // 缓存的生成与发送逻辑：
    // passport.authenticate （出现在 app.post: register 和 login 中）
        // 一旦成功 reg（或在 reg 过的项目中已经寻获，）
        // 就会在 这两个 POST Request 中的 passport.authenticate 指令下形成 cookie，
        // 并发送到 browser 端。
        // 这个 cookie 直到浏览器关闭前，都不会被删除。
        
        // 然后会将前端重定向到 GET Request /secrets，
        // 如果 req.isAuthenticated() 结果为 true,
        // 则 render 到 /secrets，如果不是，则 redirect 到 /login 重新输入。
    
});

app.listen(3000, function() {
    console.log("Server started on 3000");
});