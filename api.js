var mongoose = require('mongoose');
var crypto = require('crypto');
var async = require('async');
var config = require('./libs/config');
var util = require('util');
var request = require('request');

var User = require('./db/models/User.js');
var Word = require('./db/models/Word.js');

mongoose.connect(config.get('mongoose:uri'));
/*process.env.OPENSHIFT_MONGODB_DB_URL*/

var today = new Date();
/*today.setHours(0, 0, 0, 0);*/


// User API

exports.getSettings = function (id) {
    return User.findById(id);
};

exports.setSettings = function (req) {
    var id = req.session.user;
    var key = req.body.id;
    var val = req.body.data;
    
    return User.findOneAndUpdate({_id: id}, {
            settings: {
                [key]: val
            }
        },
        {
            new: true
        });
};

exports.setNumOfWords = function (req) {
    var id = req.session.user;
    var newWords = req.body.newWords;
    
    return User.findOneAndUpdate({_id: id}, {
        numWords: {
            newWords: newWords
        }
    }, {
        new: true
    });
};

exports.resetNumShowedWords = function (req) {
    var id = req.session.user;
    return User.findOneAndUpdate({_id: id}, {
        numWords: {
            newWords: 0
        }
    }, {
        new: true
    });
};

exports.setDateNewWords = function (req) {
    var id = req.session.user;
    var date = req.body.interval;
    return User.findOneAndUpdate({_id: id}, {
        dateNewWords: date
    }, {
        new: true
    });
};

exports.authorize = function (username, password, callback) {
    
    async.waterfall([
        function (callback) {
            User.findOne({username: username}, callback);
        },
        function (user, callback) {
            if (user) {
                if (user.password == hash(password)) {
                    callback(null, user);
                } else {
                    callback(new Error("Invalid password"));
                }
            } else {
                var user = new User({username: username, password: hash(password)});
                user.save(function (err) {
                    if (err) return callback(err);
                    callback(null, user);
                });
            }
        }
    ], callback);
};


function hash(text) {
    return crypto.createHash('sha1')
        .update(text).digest('base64')
}


//Words API

exports.getWords = function (userId, callback) {
    async.waterfall([
            function (callback) {
                User.findById(userId, function (err, user) {
                    if (err) throw err;
                    callback(null, user);
                });
            },
            function (user, callback) {
                Word.find({'userId': userId}, function (err, words) {
                    if (err) throw err;
                    callback(null, user, words);
                });
            },
            function (user, words, callback) {
                
                function getDate() {
                    today = new Date();
                    //today.setHours(0, 0, 0, 0);
                }
                
                getDate();
                
                setInterval(getDate, 1000 * 3600 * 24);
                
                var newWordsInterval = new Date(user.dateNewWords);
                var cards = [];
                
                var newCardCounter = 0;
                
                var numNewWords = user.numWords.newWords;
                
                var maxNewCards = user.settings.maxNewCards - numNewWords;
                
                for (var i = 0; i < words.length; i++) {
                    var card = words[i];
                    //Set Defaults if new card
                    
                    if (!card.prevDate) {
                        card.prevDate = today;
                    }
                    if (!card.interval) {
                        card.interval = 0;
                    }
                    if (!card.reps) {
                        card.reps = 0;
                    }
                    if (!card.EF) {
                        card.EF = 2.5;
                    }
                    
                    if (!card.nextDate) { //then it new word
                        if (newWordsInterval <= today) {
                            if (newCardCounter < maxNewCards) {
                                card.nextDate = today;
                                cards.push(card);
                                newCardCounter++;
                            }
                        }
                    } else {
                        var nextDate = new Date(card.nextDate);
                        if (nextDate <= today) {
                            cards.push(card);
                        }
                    }
                }
                callback(null, cards);
            }
        ],
        callback
    );
};

exports.getAllWords = function (req) {
    return Word.find({'userId': req.session.user})
};

exports.getTrainingWords = function (userId, callback) {
    async.waterfall([
            function (callback) {
                User.findById(userId, function (err, user) {
                    if (err) throw err;
                    callback(null, user);
                });
            },
            function (user, callback) {
                Word.find({'userId': userId}, function (err, words) {
                    if (err) throw err;
                    callback(null, user, words);
                });
            },
            function (user, words, callback) {
                var maxNewCards = user.settings.maxNewCards;
                if (words.length < maxNewCards) {
                    maxNewCards = words.length;
                }
                var trainingWords = [];
                var i = 0;
                
                while (trainingWords.length != maxNewCards) {
                    if (words[i].EF >= 2.5) {
                        if (words[i].translate)
                            if (!words[i].nextTrainingDate) {
                                trainingWords.push(words[i])
                            }
                            else if (new Date(words[i].nextTrainingDate) <= today) {
                                trainingWords.push(words[i])
                            }
                    }
                    if (i == words.length - 1) {
                        break;
                    }
                    i++;
                }
                callback(null, trainingWords);
            }
        ],
        callback
    )
};

exports.setRepeatDateTrainingWord = function (req) {
    var word = JSON.parse(req.body.word);
    var nextDate = new Date(today);
    nextDate.setDate(today.getDate() + 5); //+ five days
    
    return Word.update({_id: word._id}, {
        nextTrainingDate: nextDate
    })
};


exports.setWord = function (req) {
    var word = new Word({
        userId: req.session.user,
        word: req.body.sword,
        transcription: req.body.stranscription,
        translate: decodeURIComponent(req.body.stranslate),
        example: req.body.sexample,
        pic_url: req.body.spic,
        sound_url: req.body.ssong
    });
    return new Word(word).save()
};

exports.getZeroIntervalWords = function (userId) {
    return Word.find({'userId': userId, 'interval': 0})
};

exports.editWord = function (req) {
    var body = req.body;
    return Word.update({userId: req.session.user, word: body.oldWord}, {
        word: body.eword,
        translate: body.etranslate,
        transcription: body.etranscription,
        example: body.eexample,
        sound_url: body.esound_url,
        pic_url: body.epic_url
    }).then(function () {
        console.log('word edited: ' + body.oldWord);
    })
};

exports.deleteWord = function (req) {
    return Word.remove({userId: req.session.user, word: req.body.word})
        .then(function (data) {
            console.log(data.result);
            console.log('word delete: ' + req.body.word);
        })
};

exports.deleteAllWords = function (req) {
    var idUser = req.session.user;
    
    return User.find({_id: idUser})
        .then(function (data) {
            if (data[0].username == 'max') {
                return 'You can\'t delete all words in test account';
            }
            else {
                return Word.remove({userId: idUser})
                    .then(function () {
                        var zeroDate = new Date(0);
                        User.findOneAndUpdate({_id: idUser}, {
                            dateNewWords: zeroDate
                        }, {
                            new: true
                        })
                            .then(function (data) {
                                console.log(data);
                            })
                            .catch(function (err) {
                                console.log(err);
                            });
                        
                        return 'all words was removed';
                    });
            }
        })
};

exports.updateWord = function (req) {
    console.log(req.body);
    
    var card = calcIntervalEF(JSON.parse(req.body.word), req.body.val);
    
    return Word.update({_id: card._id}, {
        nextDate: card.nextDate,
        prevDate: card.prevDate,
        interval: card.interval,
        reps: card.reps,
        EF: card.EF
    }).then(function () {
        console.log('word updated: ' + card.word);
    })
    
};


exports.getLeoWords = function (req, callback) {
    
    var userId = req.session.user;
    
    async.waterfall([
        function (callback) {
            var leoEmail, leoPassword;
            
            if (!req.body.email || !req.body.password) {
                
                User.findById(userId, function (err, user) {
                    if (err) throw err;
                    // console.log(user.linguaLeo)
                    leoEmail = user.linguaLeo.email;
                    leoPassword = user.linguaLeo.password;
                    if (leoEmail && leoPassword) {
                        callback(null, leoEmail, leoPassword);
                    } else {
                        callback(new Error('enter linguaLeo auth data for get words'))
                    }
                })
            }
            else {
                leoEmail = req.body.email;
                leoPassword = req.body.password;
                callback(null, leoEmail, leoPassword);
            }
        },
        //TODO try without password and email
        function (leoEmail, leoPassword, callback) { //log and get leo words
            
            var userAddress = 'http://api.lingualeo.com/api/login?email=' + leoEmail + '&password=' + leoPassword;
            
            var j = request.jar();
            request({url: userAddress, method: 'GET', jar: j, encoding: 'binary'},
                function (err, res) {
                    if (err) throw err;
                    
                    var cookie_string = j.getCookieString(userAddress);
                    
                    var leoId = JSON.parse(res.body).user.user_id;
                    
                    var wordsAddress = "http://api.lingualeo.com/user/" + leoId + "/words?sort=date";
                    var cookie = request.cookie(String(cookie_string));
                    j.setCookie(cookie, wordsAddress);
                    
                    request({url: wordsAddress, jar: j, method: 'GET'},
                        function (err, res) {
                            if (err) throw err;
                            
                            //console.log(JSON.parse(res.body))
                            User.findOneAndUpdate({_id: userId}, {
                                    linguaLeo: {
                                        email: leoEmail,
                                        password: leoPassword
                                    }
                                },
                                {new: true})
                                .then(function (data) {
                                    console.log(data);
                                })
                                .catch(function (err) {
                                    console.log(err)
                                });
                            
                            callback(null, JSON.parse(res.body).words);
                        }
                    );
                });
        },
        function (words, callback) { //save words in db
            var dateLastWord = 0;
            var wordsCouner = 0;
            User.findById(userId)
                .then(function (user) {
                    if (user.linguaLeo.dateLastWord)
                        dateLastWord = user.linguaLeo.dateLastWord;
                    
                    for (var i = 0; i < words.length; i++) {
                        if (!req.body.email) { // if call from button - words will add not given dateLastWord
                            if (dateLastWord) {
                                if (words[i].created_at <= dateLastWord) {
                                    continue;
                                }
                            }
                        }
                        wordsCouner++;
                        var examples = '';
                        if (words[i].contexts) {
                            examples = words[i].contexts.join('\\n');
                        }
                        var word = new Word({
                            userId: userId,
                            word: words[i].word_value,
                            translate: words[i].translate_value,
                            transcription: words[i].transcription,
                            example: examples,
                            sound_url: words[i].sound_url,
                            pic_url: words[i].pic_url
                        });
                        new Word(word).save()
                            .then(function (data) {
                            
                            })
                            .catch(function (err) {
                                if (err) throw err;
                            });
                    }
                    User.findOneAndUpdate({_id: userId}, {
                            linguaLeo: {
                                dateLastWord: words[0].created_at
                            }
                        },
                        {new: true})
                        .then(function (data) {
                            console.log(data);
                        })
                        .catch(function (err) {
                            console.log(err)
                        });
                    
                    callback(null, String(wordsCouner));
                })
                .catch(function (err) {
                    if (err) throw err;
                })
        }
    ], callback);
};


function calcIntervalEF(card, grade) {
    
    var oldEF = card.EF,
        newEF = 0,
        nextDate = new Date(today);
    
    if (grade < 3) {
        card.reps = 0;
        card.interval = 0;
    } else {
        
        newEF = oldEF + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
        if (newEF < 1.3) { // 1.3 is the minimum EF
            card.EF = 1.3;
        } else {
            card.EF = newEF;
        }
        
        card.reps = card.reps + 1;
        
        switch (card.reps) {
            case 1:
                card.interval = 1;
                break;
            case 2:
                card.interval = 6;
                break;
            default:
                card.interval = Math.ceil((card.reps - 1) * card.EF);
                break;
        }
    }
    
    if (grade === 3) {
        card.interval = 0;
    }
    
    nextDate.setDate(today.getDate() + card.interval);
    card.nextDate = nextDate;
    return card;
}