$(function () {
    
    var words, wordsCounter = 0;
    var newWordsCounter = 0;
    var settingsReceived = false;
    var isZeroIntervWord = false;
    var isPlaySound = true;
    var btnEditAnother = $('#btn-editAnother');
    
    $('body').css('opacity', '1').on('click', function () {
        var tooltipped = $('.tooltipped');
        tooltipped.tooltip('remove');
        tooltipped.tooltip({delay: 350});
    });
    
    $(window).on('beforeunload', function () {
        $('body').css('opacity', '0');
    });
    
    function getWords() {
        $('#img').attr('src', "/img/preloader.gif");
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
    
    
    var wordsLeftEl = $('#wordsLeft').on('mouseover', function () {
        $(this).find('span').fadeIn(200)
    }).on('mouseleave', function () {
        $(this).find('span').fadeOut(100)
    });
    
    function setNumOfWord(numb) {
        wordsLeftEl.find('p').text(numb);
    }
    
    function getIsPlaySound() {
        var btnOnOff = $('#btn-onOff');
        if (localStorage.isPlaySound) {
            isPlaySound = (localStorage.isPlaySound === 'true');
            btnOnOff.data('value', String(isPlaySound));
            if (!isPlaySound) {
                btnOnOff.attr('data-tooltip', 'turn on sound').find('.material-icons').text('volume_off');
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
    
    
    btnEditAnother.leanModal({
        complete: function () {
            $('#editAnotherWords').find('ul').html('<p class="preloaderWrapper"><img src="img/preloader.gif"></p>');
            $('#previousWordsFoEdit, #nextWordsFoEdit').css('display', 'none');
        }
    });
    
    $('.modal-trigger').leanModal();
    
    $('#showTranslate').on('click mouseover', function () {
        $(this).animate({
            'opacity': 0,
            'width': '+=200'
        }, 400).css('cursor', 'default');
        
        hideImg(function () {
            $('#translate').text(words[wordsCounter].translate);
            $('#example').text(words[wordsCounter].example);
            $('#side2').fadeIn(100);
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
            if (words[wordsCounter].reps == 0) { //new word
                newWordsCounter++;
                sendNumShowedWords();
            }
        }
        
        wordsCounter++;
        if (wordsCounter != words.length) {
            side2.fadeOut(200, function () {
                showWord();
                setNumOfWord(words.length - wordsCounter);
            });
        } else {
            words.length = 0;
            wordsCounter = 0;
            side2.fadeOut(400);
            if (!isZeroIntervWord) {
                if (newWordsCounter > 0)
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
    
    function sendNumShowedWords() {
        $.ajax({
            url: "/users/numwords", //Post - set, Get - reset
            method: "POST",
            data: {"newWords": newWordsCounter},
            error: function () {
                showMessage('changes were not saved due to problems with the Internet');
            }
        })
    }
    
    function resetNumShowedWords() {
        newWordsCounter = 0;
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
        $('#wordsLeft').fadeIn(400);
        $('#wrapperOfBtnFoWords').fadeIn(400);
        $('.btn-refresh').fadeOut(300);
        
        $('#showTranslate').fadeIn(100).animate({
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
                imgElem.attr('src', img.src).fadeIn(300);
            });
        };
        
        img.onerror = function () {
            showMessage('can\'t download this picture');
        };
        
        img.src = words[wordsCounter].pic_url || "/img/noPicture.png";
    }
    
    function hideImg(callback) {
        $('#img').fadeOut(300, function () {
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
        edCurWord.find('input[name="eword"]').val(words[wordsCounter].word).attr('data-old', words[wordsCounter].word);
        edCurWord.find('input[name="etranscription"]').val(words[wordsCounter].transcription);
        edCurWord.find('input[name="etranslate"]').val(words[wordsCounter].translate);
        edCurWord.find('input[name="eexample"]').val(words[wordsCounter].example);
        edCurWord.find('input[name="epic_url"]').val(words[wordsCounter].pic_url);
        edCurWord.find('input[name="esound_url"]').val(words[wordsCounter].sound_url);
    }
    
    //TODO optional field for email with label (enter your email and will get message with your password and login )
    
    var intervalForScrolling;
    
    btnEditAnother.on('click', function () {
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
    
    function sendFoEdit() {
        var form = $(this);
        var oldWord = form.find('input[name="eword"]').attr('data-old');
        
        if (!oldWord)
            return false;
        
        if (!form.children("input[name='eword']").val()) {
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
                        updateWordLocally(form.serializeArray());
                        /*$('#side2').fadeOut(500, function () {
                         isPlaySound = false;
                         getWords();
                         });*/
                    }
                },
                error: function () {
                    showMessage('changes were not saved due to problems with the Internet');
                }
            });
        }
        return false;
    }
    
    function updateWordLocally(newWordData) {
        newWordData.forEach(function (obj) {
            words[wordsCounter][obj.name.substring(1)] = obj.value;
        });
        $('#side2').fadeOut(200);
        showWord();
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
        side1.fadeIn(300).find('#word').text('no words yet');
        side1.find('#transcription').text('');
        $('#side2').slideUp(400);
        $('#img').fadeIn(0);
        $('.imgWraper').fadeOut(0);
        $('#showTranslate').fadeOut(100);
        $('#wordsLeft').fadeOut(400);
        $('#wrapperOfBtnFoWords').fadeOut(400);
        $('.btn-refresh').css({'display': 'inline-block'}).fadeIn(300);
    }
    
    $('.btn-refresh').on('click mouseover', function () {
        $(this).fadeOut(300);
        $('#side1').fadeOut(400, function () {
            $('.imgWraper').fadeIn(300);
        });
        
        //$('#img').attr('src', "/img/preloader.gif");
        getWords();
    });
    
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
                    showMessage('was added ' + data + ' word(s) from linguaLeo');
                    // isPlaySound = false;
                    // getWords();
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
    
    $("#maxNewCards").on('change keypress', function () {
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
});