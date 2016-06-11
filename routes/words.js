var express = require('express');
var api = require('../api.js');
var app = express();
var request = require('request');
var fs = require('fs');

app.get('/', function (req, res, next) {
    var userId = req.session.user;

    api.getWords(userId, function (err, words) {
        if (err) throw err;

        if (words.length) {
            return res.send(words);
        }
        else {
            res.statusCode = 404;
            return res.send({error: 'word can not find'});
        }
    });
});

app.get('/zerintrv', function (req, res) {
    var userId = req.session.user;

    api.getZeroIntervalWords(userId)
        .then(function (words) {
            if (words.length) {
                return res.send(words);
            }
            else {
                res.statusCode = 404;
                return res.send({error: 'word can not find'});
            }
        })
        .catch(function (err) {
            if (err) throw err;
        });
});

app.get('/getall', function (req, res) {
    api.getAllWords(req)
        .then(function (words) {
            if (words.length) {
                return res.send(words);
            }
            else {
                res.statusCode = 404;
                return res.send({error: 'words can not find'});
            }
        })
        .catch(function (err) {
            if (err) throw err;
        });
});

app.post('/', function (req, res) {
    api.setWord(req)
        .then(function (result) {
            console.log("word created");
            return res.send({status: 'OK', word: result});
        })
        .catch(function (err) {
            console.log(err);
            if (err.name == 'ValidationError') {
                res.statusCode = 400;
                res.send({error: 'Validation error'});
            } else {
                res.statusCode = 500;
                res.send({error: 'Server error'});
            }
        })
});

app.post('/edit', function (req, res) {
    api.editWord(req)
        .then(function () {
            res.end();
        })
        .catch(function (err) {
            console.log(err);
        });
});


app.post('/delete', function (req, res) {
    api.deleteWord(req)
        .then(function () {
            res.end();
        })
        .catch(function (err) {
            console.log(err);
        });
});

app.get('/deleteall', function (req, res) {
    api.deleteAllWords(req)
        .then(function () {
            res.end();
        })
        .catch(function (err) {
            console.log(err);
        });
});

app.post('/update', function (req, res) {
    api.updateWord(req)
        .then(function () {
            res.end();
        })
        .catch(function (err) {
            console.log(err);
        });
});

app.post('/getleowords', function (req, res) {
    api.getLeoWords(req, function (err, mes) {
        if (err) {
            console.log(err.message);
            res.status(403).send(err.message);
            return;
        }
        res.status(200).send(mes);
    });

});

/*app.get('/getimage', function (req, res) {

 res.writeHead(200, {'Access-Control-Allow-Origin': 'http://127.0.0.1'});

 request.get(req.query.url).pipe(res);

 /!*   fs.readFile('./public/img/1.png', function (err, info) {
 if (err){
 console.log(err);
 }
 res.end(info);
 });*!/

 });*/

module.exports = app;
