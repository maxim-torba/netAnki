var express = require('express');
var api = require('../api');
var app = express();

/* GET home page. */
app.get('/', function (req, res, next) {
  /*  var options = {
        root: './public'
    };*/
    if (req.session.user) {
        res.render('index');
        /*res.sendFile('index.html', options, function (err) {
            if (err) {
                console.log(err);
                res.status(err.status).end();
            }
        });*/

 /*       var data = {
            title: 'Express',
            user: req.session.user
        };
        res.send(200, data);*/
    } else {
        res.render('login');
       /* var data = {
            title: 'Express'
        };
        res.send(200, data);*/
    }
});

module.exports = app;