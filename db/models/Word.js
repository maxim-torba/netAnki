var mongoose = require('mongoose');

var Word = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    word: {
        type: String,
        required: true
    },
    transcription: {
        type: String
    },
    translate: {
        type: String
    },
    example: {
        type: String
    },
    sound_url : {
        type: String
    },
    pic_url: {
        type: String
    },
    nextDate: {
        type: Date
    },
    prevDate: {
        type: Date
    },
    interval: {
        type: Number
    },
    reps: {
        type: Number
    },
    EF: {
        type: Number
    }
});


var WordModel = mongoose.model('Word', Word);
module.exports = mongoose.model('Word', WordModel);
