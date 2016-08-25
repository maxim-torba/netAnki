$(function () {
    var words = [], wordsCounter = 0;
    $('#btn-trainingMode').on('click', function () {
        $.ajax({
            url: "/words/trainingwords",
            method: "GET",
            success: function (data) {
                words = data;
                wordsCounter = 0;
                $('#wrapperOfModeTraining').find('img').fadeOut(200, function () {
                    $('.training-cards').fadeIn(200);
                });
                
                showWord();
            },
            error: function () {
                showMessage('can\'t get training words');
            }
        });
    });
    
    function showWord() {
        if (wordsCounter == words.length) {
            $('.training-cards').fadeOut(600);
        }
        
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
        var inputVal = $(this).val();
        
        if (word.slice(0, inputVal.length) == inputVal) {
            $(this).removeClass('wrong').addClass('correctly');
        } else {
            $(this).removeClass('correctly').addClass('wrong');
        }
        
        if (inputVal.length == 0)
            $(this).removeClass('correctly wrong');
        
        if (e.keyCode == 13) {
            if ($('#trainingSide2').css('display') == 'none') {
                showTranslate();
            } else {
                nextWord();
            }
        } else if (word.length == inputVal.length) {
            showTranslate();
            if (word == inputVal) {
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
                showMessage('changes were not saved due to problems with the Internet');
            }
        });
    }
    
    function nextWord() {
        ++wordsCounter;
        $('#inputValidation').val('').removeClass('correctly wrong');
        $('#trainingSide2').fadeOut();
        showWord();
    }
});