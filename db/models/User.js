var mongoose = require('mongoose');
var flat = require('flat');

var User = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    settings: {
        maxNewCards: {
            type: Number,
            default: 10
        },
        leoAutoGet: {
            type: Boolean,
            default: false
        }
    },
    numWords: {
        newWords: {
            type: Number,
            default: 0
        }
    },
    dateNewWords: {
        type: Date,
        default: 0
    },
    linguaLeo: {
        email: {
            type: String
        },
        password: {
            type: String
        },
        dateLastWord: {
            type: Number
        }
    }
});
User.pre('findOneAndUpdate', function () {
    this._update = flat(this._update);
});

var UserModel = mongoose.model('User', User);
module.exports = mongoose.model('User', UserModel);