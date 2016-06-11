var express = require('express');
var api = require('../api.js');
var app = express();


app.post('/', function (req, res, next) {

    var username = req.body.username;
    var password = req.body.password;

    api.authorize(username, password, function (err, user) {
        if (err) {
            console.log(err.message);

            if (err.message == "Invalid password") {
                res.status(403).send(err.message);
                return;
            } else if (err.message == "User validation failed") {
                res.status(403).send("Name can't be empty");
                return;
            }
            else {
                next(err)
            }
        }
        req.session.user = user._id;
        res.send(username);
    });

});

app.get('/settings', function (req, res) {
    api.getSettings(req.session.user)
        .then(function (data) {
            res.send({
                'maxNewCards': data.settings.maxNewCards,
                'maxOldCards': data.settings.maxOldCards,
                'leoAutoGet': data.settings.leoAutoGet
            })
        })
        .catch(function (err) {
            console.log(err);
        })
});

app.post('/settings', function (req, res) {
    api.setSettings(req)
        .then(function (data) {
            console.log(data);
            res.end();
        })
        .catch(function (err) {
            console.log(err);
        })
});

app.get('/numwords', function (req, res) {
    api.resetNumShowedWords(req)
        .then(function (data) {
            console.log(data);
            res.end();
        })
        .catch(function (err) {
            console.log(err);
        })
});

app.post('/numwords', function (req, res) {
    api.setNumOfWords(req)
        .then(function (data) {
            console.log(data);
            res.end();
        })
        .catch(function (err) {
            console.log(err);
        })
});

app.post('/interval', function (req, res) {
    api.setDateNewWords(req)
        .then(function (data) {
            console.log(data);
            res.end();
        })
        .catch(function (err) {
            console.log(err);
        })
});

app.post('/logout', function (req, res, next) {
    if (req.session.user) {
        //delete req.session.user;
        req.session.destroy();
        res.redirect('/')
    }
});

module.exports = app;