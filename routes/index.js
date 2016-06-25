var express = require('express');
var api = require('../api');
var app = express();

/* GET home page. */
app.get('/', function (req, res, next) {

    if (req.session.user) {
        res.render('index');
    } else {
        res.render('login');
    }
});

module.exports = app;