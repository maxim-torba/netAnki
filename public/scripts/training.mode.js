$(function () {
    var words = [], wordsCounter = 0;
    var translateBeforeAnsw = false;
    
    $('#btn-trainingMode').on('click', getTrainingWords);
    
    function getTrainingWords() {
        $.ajax({
            url: "/words/trainingwords",
            method: "GET",
            success: function (data) {
                words = data;
                wordsCounter = 0;
                $('#wrapperOfModeTraining').find('img').fadeOut(200, function () {
                    $('.training-cards').fadeIn(200, function () {
                        $('#inputValidation').focus();
                    });
                });
                
                showWord();
            },
            statusCode: {
                404: function () {
                    Materialize.toast('No training words yet', 4000);
                }
            }
        });
    }
    
    function showWord() {
        $('#trainingWord').fadeOut(300, function () {
            $(this).text(words[wordsCounter].translate).fadeIn(300);
        });
        
    }
    
    function showTranslate() {
        $('#trainingSide2').fadeIn();
        $('#trainingTranslate').text(words[wordsCounter].word);
        $('#trainingTranscription').text(words[wordsCounter].transcription);
        $('#trainingExample').text(words[wordsCounter].example);
        if (localStorage.isPlaySound === 'true') {
            playSound();
        }
    }
    
    function playSound() {
        $('#sound').attr('src', words[wordsCounter].sound_url)[0].play();
    }
    
    $('#inputValidation').on('keyup', function (e) {
        var word = words[wordsCounter].word.toLowerCase();
        var inputVal = $(this).val().toLowerCase();
        
        if (word.slice(0, inputVal.length) == inputVal) {
            $(this).removeClass('wrong').addClass('correctly');
        } else {
            $(this).removeClass('correctly').addClass('wrong');
        }
        
        if (inputVal.length == 0)
            $(this).removeClass('correctly wrong');
        
        if (e.keyCode == 13) {
            if ($('#trainingSide2').css('display') == 'none') {
                translateBeforeAnsw = true;
                showTranslate();
            } else {
                nextWord();
            }
        } else if (word.length == inputVal.length) {
            showTranslate();
            if (word == inputVal) {
                if (!translateBeforeAnsw)
                    setRepeatDate();
            }
        }
    });
    
    function setRepeatDate() {
        $.ajax({
            url: "/words/trainingwords",
            method: "POST",
            data: {'word': JSON.stringify(words[wordsCounter])},
            error: function () {
                Materialize.toast('changes were not saved due to problems with the Internet', 4000);
            }
        });
    }
    
    function nextWord() {
        $('#inputValidation').val('').removeClass('correctly wrong');
        $('#trainingSide2').fadeOut();
        
        translateBeforeAnsw = false;
        
        if (words.length != wordsCounter + 1) {
            ++wordsCounter;
            showWord();
        } else {
            $('.training-cards').fadeOut(400, function () {
                $('#wrapperOfModeTraining').find('img').fadeIn(300);
            });
            Materialize.toast('getting next bunch of words', 4000);
            getTrainingWords();
        }
    }
});
