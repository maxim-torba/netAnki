$(function () {
     alert('kjk');
    var words, wordsCounter = 0;
    var newWordsCounter = 0, oldWordsCounter = 0;
    var settingsReceived = false;
    var isZeroIntervWord = false;
    var isPlaySound = true;

    $('body').css('opacity', '1');
    $(window).on('beforeunload', function () {
        $('body').css('opacity', '0');
    });
//TODO no words yet, letft time:
 /*   $('#f0, #f1, #f2, #f3, #f4, #f5').on('mouseover', function () {
       $(this).animate({
           'opacity':'1'
       }, 10)
    })
        .on('mouseout', function () {
            $(this).animate({
                'opacity':'0.6'
            }, 10)
        });*/

    function getWords() {
        $.ajax({
            url: "/words",
            method: "GET",
            statusCode: {
                200: function (data) {
                    words = data;
                    showWord();
                    setNumOfWord(data.length);
                },
                404: function () {
                    getZeroIntervalWords();
                }
            }
        });
        getUserSettings(function (d) {
            if (d) {
                getLeoWords();
            }
        })
    }

    getWords();

    //TODO make something with next function
    function setNumOfWord(numb) {
        var wordsLeft = $('#wordsLeft');
        var span = wordsLeft.find('span');

        wordsLeft.fadeIn(400, spanOpacity);
        wordsLeft.on('mouseover', 1, spanOpacity);
        wordsLeft.on('mouseleave', 0, spanOpacity);

        wordsLeft.find('p').text(numb);

        function spanOpacity(e) {
            e = e || 0;
            span.css('opacity', e.data || 0);
        }
    }

//TODO after edit word should add in begin of db collection
    function getIsPlaySound() {
        if (localStorage.isPlaySound) {
            isPlaySound = (localStorage.isPlaySound === 'true');
            $('#btn-onOff').data('value', String(isPlaySound));
            if (!isPlaySound) {
                $('#btn-onOff').attr('data-tooltip', 'turn on sound').find('.material-icons').text('volume_off');
            }
        } else {
            setLocalSettings({isPlaySound: isPlaySound});
        }
    }

    getIsPlaySound();

    function setLocalSettings(props) {
        for (key in props) {
            localStorage[key] = props[key];
        }
    }

    //zero intervals words can't be new words or old words, they are ones with grade from 0 to 3
    function getZeroIntervalWords() {
        $.ajax({
            url: "/words/zerintrv",
            method: "GET",
            statusCode: {
                200: function (data) {
                    words = data;
                    setNumOfWord(data.length);
                    showMessage('no new words, but there is ' + data.length + ' words with grade less than 3');
                    wordsCounter = 0;
                    isZeroIntervWord = true;
                    showWord();
                },
                404: function () {
                    noWords();
                }
            }
        })
    }


    $('#btn-editAnother').leanModal({
        complete: function () {
            $('#editAnotherWords').find('ul').html('<p class="preloaderWrapper"><img src="img/preloader.gif"></p>');
            $('#previousWordsFoEdit, #nextWordsFoEdit').css('display', 'none');
        }
    });

    $('.modal-trigger').leanModal();

    $('#showTranslate').on('click mouseover',function () {
        $(this).animate({
            'opacity': 0,
            'width': '+=200'
        }, 400).css('cursor', 'default');

        hideImg(function () {
            $('#translate').text(words[wordsCounter].translate);
            $('#example').text(words[wordsCounter].example);
            $('#side2').fadeIn(400);
        });
    });

    $('#f0,#f1,#f2,#f3,#f4,#f5').click(function () {
        var val = $(this).attr('value');
        var side2 = $('#side2');

        $.ajax({
            url: "/words/update",
            method: "POST",
            data: {'word': JSON.stringify(words[wordsCounter]), 'val': val},
            error: function () {
                showMessage('changes were not saved due to problems with the Internet');
            }
        });

        if (!isZeroIntervWord) {
            countShowedWords(words[wordsCounter]);
        }
        wordsCounter++;
        if (wordsCounter != words.length) {

            side2.fadeOut(200, function () {
                showWord();

                setNumOfWord(words.length - wordsCounter);
            });
        } else {
            side2.fadeOut(200);
            wordsCounter = 0;
            if (!isZeroIntervWord) {
                setIntervalNewWords();
                resetNumShowedWords();
            }
            getZeroIntervalWords();
        }
    });

    function setIntervalNewWords() {
        $.ajax({
            url: "/users/interval",
            method: "POST",
            data: {'interval': new Date(new Date().getTime() + 3600 * 24 * 1000)},
            error: function () {
                showMessage('changes were not saved due to problems with the Internet');
            }
        })
    }

    function countShowedWords(word) {
        if (word.reps == 0) { //new word
            newWordsCounter++
        } else {
            oldWordsCounter++
        }
        sendNumShowedWords();
    }

    function sendNumShowedWords() {
        $.ajax({
            url: "/users/numwords", //Post - set, Get - reset
            method: "POST",
            data: {"oldWords": oldWordsCounter, "newWords": newWordsCounter},
            error: function () {
                showMessage('changes were not saved due to problems with the Internet');
            }
        })
    }

    function resetNumShowedWords() {
        oldWordsCounter = newWordsCounter = 0;
        $.ajax({
            url: "/users/numwords",
            method: "GET",
            error: function () {
                showMessage('changes were not saved due to problems with the Internet');
            }
        })
    }

    function showWord() {
        $('#side1').fadeIn(300);
        $('#word').text(words[wordsCounter].word);
        $('#transcription').text(words[wordsCounter].transcription);

        $('#showTranslate').animate({
            'opacity': 1,
            'width': '200'
        }, 800).css('cursor', 'pointer');

        if (isPlaySound)
            playSound();
        getIsPlaySound();
        showImg();
    }

    function showImg() {
        var imgElem = $('#img');
        imgElem.attr('src', "/img/preloader.gif");

        $('.imgWraper').slideDown(300, function () {
            imgElem.fadeIn(200);
        });

        var img = new Image();

        img.onload = function () {
            imgElem.fadeOut(200, function () {
                imgElem.attr('src', img.src).fadeIn(300/*, function () {
                 drawImg();
                 }*/);
            });
        };
        img.onerror = function () {
            showMessage('can\'t download this picture');
        };

        img.src = words[wordsCounter].pic_url || "/img/noPicture.png";
        // img.src = "http://localhost/words/getimage?url=" + words[wordsCounter].pic_url;

    }

    function hideImg(callback) {
        $('#img').fadeOut(400, function () {
            if (callback)
                callback();
        });
    }

    function playSound() {
        $('#sound').attr('src', words[wordsCounter].sound_url)[0].play();
    }

    $('#btn-replay').on('click', playSound);

    $('#btn-onOff').on('click', function () {
        isPlaySound = ($(this).data('value') === "false");
        var idTooltip = $(this).data('tooltipId');

        setLocalSettings({isPlaySound: isPlaySound});
        $(this).data('value', String(isPlaySound));
        if (isPlaySound) {
            $('#' + idTooltip).find('span').text('turn off sound');
            $(this).attr('data-tooltip', 'turn off sound').find('.material-icons').text('volume_up');
        } else {
            $('#' + idTooltip).find('span').text('turn on sound');
            $(this).attr('data-tooltip', 'turn on sound').find('.material-icons').text('volume_off');
        }
    });

    $('#btn-editCurrentWord').on('click', updateModalEditCurWord);

    function updateModalEditCurWord() {
        var edCurWord = $('#modalEditCurrentWord');
        edCurWord.find('input[name="eword"]').val(words[wordsCounter].word);
        edCurWord.find('input[name="etranscription"]').val(words[wordsCounter].transcription);
        edCurWord.find('input[name="etranslate"]').val(words[wordsCounter].translate);
        edCurWord.find('input[name="eexample"]').val(words[wordsCounter].example);
        edCurWord.find('input[name="epic"]').val(words[wordsCounter].pic_url);
        edCurWord.find('input[name="esong"]').val(words[wordsCounter].sound_url);
    }

    //TODO optional field for email with label (enter your email and will get message with your password and login )

    var intervalForScrolling;

    $('#btn-editAnother').on('click', function () {
        $.ajax({
            url: "/words/getall",
            method: "GET",
            success: function (data) {
                var ul = $('#editAnotherWords').find('ul');

                var form = $('form[name="editWord"]');
                var liItems = [data.length];
                var i = 0;

                function addList() {

                    var curI = 0;
                    for (i; i < data.length; i++) {

                        var header = document.createElement('div');
                        var body = document.createElement('div');
                        var li = document.createElement('li');
                        var img = document.createElement('img');
                        var span = document.createElement('span');
                        var a = document.createElement('a');

                        var formClone = form.clone();

                        var word = data[i].word;
                        var translate = data[i].translate || 'no translate';
                        var str = '';

                        $(img).addClass('circle').css('z-index', data.length - i);

                        if (!data[i].pic_url) {
                            str += ' - no image';
                            img.src = 'img/noPicture.png';
                        } else {
                            img.src = data[i].pic_url;
                        }

                        if (!data[i].sound_url) str += ' - no sound';
                        if (!data[i].example) str += ' - no example';
                        if (!data[i].transcription) str += ' - no transcription';

                        formClone.find('input[name="eword"]').val(word).attr('data-old', word);
                        formClone.find('input[name="etranscription"]').val(data[i].transcription);
                        formClone.find('input[name="etranslate"]').val(data[i].translate);
                        formClone.find('input[name="eexample"]').val(data[i].example);
                        formClone.find('input[name="epic"]').val(data[i].pic_url);
                        formClone.find('input[name="esong"]').val(data[i].sound_url);

                        formClone.submit(sendFoEdit);

                        $(span).html('<b>' + word + '</b>' + ' - ' + translate + '<em>' + str + '</em>');

                        $(a).addClass('').html('<i class="material-icons waves-effect waves-light delete">delete</i>')
                            .on('click', function (e) {
                                delWord(e);
                                $(this).closest('li').remove();
                            });

                        $(header).addClass('collapsible-header flow-text').append(img, span, a);

                        $(body).addClass('collapsible-body').append(formClone);

                        $(li).append(header, body).on('click', function () {
                            var modal = $('#editAnotherWords');
                            var distFromTopLi = $(this).offset().top;
                            var lengthOfScroll = modal.scrollTop();

                            modal.scroll().animate({
                                scrollTop: lengthOfScroll + distFromTopLi - modal.offset().top - 10  //10 - something like margin-top
                            }, 500);

                        });

                        curI++;

                        if (curI > 5) {//solution of animation freezes (hide load to my weak processor)
                            setTimeout(addList, 0);
                            break;
                        } else {
                            liItems[i] = li;
                        }

                        if (i == data.length - 1) {
                            ul.find('p').fadeOut(200, function () {
                                $('#totalNumb').find('span').text(data.length);
                                $(ul).append(liItems);
                                $('#previousWordsFoEdit, #nextWordsFoEdit')
                                    .css('display', 'block')
                                    .on('mousedown', function () {
                                        var thatId = this.id;
                                        var modal = $('#editAnotherWords');
                                        var scrollTO = 0;

                                        intervalForScrolling = setInterval(doScroll, 500);

                                        function doScroll() {
                                            if (thatId == 'previousWordsFoEdit')
                                                scrollTO = modal.scrollTop() - 400;

                                            if (thatId == 'nextWordsFoEdit')
                                                scrollTO = modal.scrollTop() + 400;

                                            modal.scroll().animate({
                                                scrollTop: scrollTO
                                            });
                                        }

                                        doScroll();
                                    })
                                    .on('mouseup', function () {
                                        clearInterval(intervalForScrolling);
                                    })
                                    .on('selectstart', function () {
                                        return false;
                                    })
                            });
                        }
                    }

                }

                addList();

            },
            error: function () {
                showMessage('no words yet');
            }
        });
    });

    /* $('#editAnotherWords').scroll(function () {
     console.log($(this).scrollTop());
     console.log($(this).find('#next'));
     $(this).find('#next').css('bottom', '-'+$(this).scrollTop());
     }); */

    $(document.forms['editWord']).submit(sendFoEdit);

    function sendFoEdit(e) {

        var form = $(this);
        var oldWord = form.find('input[name="eword"]').data('old') || words[wordsCounter].word;

        if (!$(this).children("input[name='eword']").val()) {
            showMessage('you should enter the word');
        }
        else {
            $.ajax({
                url: "/words/edit",
                method: "POST",
                data: form.serialize() + "&oldWord=" + oldWord,

                statusCode: {
                    200: function () {
                        showMessage('you edited next word: ' + oldWord);

                        $('#side2').fadeOut(500, function () {
                            isPlaySound = false;
                            getWords();
                        });
                    }
                },
                error: function () {
                    showMessage('changes were not saved due to problems with the Internet');
                }
            });
        }
        return false;
    }

    $('#btn-delWord').on('click', delWord);

    $('#confirmationFoDelAll').find('.agree').on('click', function () {
        $.ajax({
            url: "/words/deleteall",
            method: "GET",
            success: function () {
                showMessage('all words were removed');

                var edAnothEl = $('#editAnotherWords');
                edAnothEl.find('ul').text('');
                edAnothEl.find('#totalNumb span').text('0');

                noWords();
            },
            error: function () {
                showMessage('can not delete all words due to problems with the Internet');
            }
        });
    });


    function delWord(e) {
        var word = $(e.target).closest('li').find('input[name="eword"]').data('old') || words[wordsCounter].word;
        $.ajax({
            url: "/words/delete",
            method: "POST",
            data: {'word': word},
            success: function () {
                showMessage('word \'' + word + '\' was delete');

                var totalNumbEl = $('#totalNumb').find('span');
                var numWords = parseInt(totalNumbEl.text());
                totalNumbEl.text(numWords - 1);

                $('#side2').fadeOut(500, function () {
                    isPlaySound = false;
                    getWords();
                    setTimeout(updateModalEditCurWord, 1000);
                });
            },
            error: function () {
                showMessage('changes were not saved due to problems with the Internet');
            }
        });
    }

    function noWords() {
        var side1 = $('#side1');
        side1.fadeIn(200).find('#word').text('no words yet');
        side1.find('#transcription').text('');
        $('#side2').slideUp(400);
        $('.imgWraper').slideUp(400);

        $('#wrapperOfBtnFoWords').animate({
            'opacity': 0
        }, 400).css('cursor', 'default');
    }

    function showMessage(mes) {
        Materialize.toast(mes, 4000)
    }

    $(document.forms['setWords']).submit(function (e) {
        var form = $(this);

        if (!$(this).children("input[name='sword']").val()) {
            showMessage('type the word');
            e.preventDefault();
        }
        else {
            $.ajax({
                url: "/words",
                method: "POST",
                data: form.serialize(),

                statusCode: {
                    200: function (data) {
                        showMessage('you added next words: ' + data.word.word);
                        form[0].reset();
                        setTimeout(function () {
                            isPlaySound = false;
                            getWords();
                        }, 2000);
                    }
                },
                error: function () {
                    showMessage('changes were not saved due to problems with the Internet');
                }
            });
            return false;
        }
    });

    $(document.forms['leoAuth']).submit(function (e) {
        var form = $(this);

        if (!$(this).children("input[name='password']") || !$(this).children("input[name='email']").val()) {
            showMessage('enter your authorization data');
            e.preventDefault();
        }
        getLeoWords(form.serialize());
        return false;
    });

    function getLeoWords(data) {
        var formData = 0;
        if (data) {
            formData = data;
        }
        $.ajax({
            url: "/words/getleowords",
            method: "POST",
            data: formData,
            success: function (data) {
                if (+data > 0) {
                    showMessage('was added ' + data + ' words from linguaLeo');
                    isPlaySound = false;
                    getWords();
                }
            }
        });
    }

    function getUserSettings(fn) {
        if (!settingsReceived) {
            $.ajax({
                url: "/users/settings",
                method: "GET",
                success: function (data) {
                    settingsReceived = true;
                    $('#maxNewCards').val(data.maxNewCards);
                    $('#maxOldCards').val(data.maxOldCards);
                    $("#autoGetter").prop("checked", data.leoAutoGet);

                    if (fn) {
                        fn(data.leoAutoGet);
                    }
                },
                error: function () {
                    showMessage('changes were not saved due to problems with the Internet');
                }
            });
        }

    }

    $("#autoGetter").click(function () {
        $.ajax({
            url: "/users/settings",
            method: "POST",
            data: {'id': 'leoAutoGet', 'data': $(this).prop('checked')},
            success: function () {
                showMessage('settings have been saved')
            },
            error: function () {
                showMessage('the settings were not saved due to problems with the Internet');
            }
        })
    });

    $("#maxNewCards, #maxOldCards")/*.keypress(function (evt) {
        evt.preventDefault();
    })*/.on('change keypress', function () {
        var data = $(this).val() || +$(this).text();
        $.ajax({
            url: "/users/settings",
            method: "POST",
            data: {'id': $(this).attr('id'), 'data': data},
            success: function () {
                showMessage('settings have been saved')
            },
            error: function () {
                showMessage('the settings were not saved due to problems with the Internet');
            }
        });
    });

    $("#btn-logout").click(function () {
        $.ajax({
            url: "/users/logout",
            method: "POST",
            success: function () {
                location.reload()
            }
        })
    })
/*
    function runOnKeys(func) {
        var codes = [].slice.call(arguments, 1);

        var pressed = {};

        document.onkeydown = function (e) {

            pressed[e.keyCode] = true;

            for (var i = 0; i < codes.length; i++) {
                if (!pressed[codes[i]]) {
                    return;
                }
            }
            pressed = {};

            func();
        };

        document.onkeyup = function (e) {
            delete pressed[e.keyCode];
        };

    }

    runOnKeys(
        twist, 17/!*<--It's ctrl*!/,
        /!*"Q".charCodeAt(0),*!/
        "Y".charCodeAt(0)
    );

   function twist() {
       var degrees = 361;
       $('#word').css({'-webkit-transform' : 'rotate('+ degrees +'deg)',
           '-moz-transform' : 'rotate('+ degrees +'deg)',
           '-ms-transform' : 'rotate('+ degrees +'deg)',
           'transform' : 'rotate('+ degrees +'deg)'});
   }*/

});



