
    localStorage.channel || (localStorage.channel = '1');
    localStorage.notify || (localStorage.notify = '1');
    localStorage.lrc || (localStorage.lrc = '1');
    localStorage.pin || (localStorage.pin = '0');
    localStorage.volume || (localStorage.volume = '100');

    var audio = document.querySelector('audio');
    var isPlay = true;
    var isRepeat = false;
    var playList = [];
    var h = [];
    var current = 0;
    var time = 0;
    var canplaythrough = false;
    var p = null;
    var likedSongs = [];
    var albumSongs = [];

    if (localStorage.pin === '0') {
        chrome.browserAction.setPopup({popup: '../pages/popup.html'});
    }
    else {
        chrome.browserAction.onClicked.addListener(function(tab) {
            if (p) {
                chrome.windows.update(p.tab.windowId, {focused: true});
            }
            else {
                chrome.windows.create({
                    width: 300,
                    height: 320,
                    url: '../pages/popup.html',
                    type: 'popup'
                });
            }
        });
    }

    function parseLrc(lrc) {
        lrc = lrc.split('\n');
        var filter = /^((?:\[[\d.:]+?\])+?)([^\[\]]*)$/,
            nLrc = {};

        for (var i = 0, len = lrc.length, res, time ; i < len ; i += 1) {
            res = lrc[i].match(filter);
            if (res) {
                time = res[1].slice(1, -1).split('][');
                for (var j = 0, jLen = time.length, tmp ; j < jLen ; j += 1) {
                    tmp = time[j].split(':');
                    nLrc[Number(tmp[0])*60+Math.round(tmp[1])] = res[2];
                }
            }
        }
        return nLrc;
    }

    audio.addEventListener('loadstart', function () {
        canplaythrough = false;
        p && p.postMessage({cmd: 'canplaythrough', status: false});
        if (localStorage.lrc === '1' && !playList[current].lrc) {
            S.jsonp('http://openapi.baidu.com/public/2.0/mp3/info/suggestion?format=json&word='+encodeURIComponent(playList[current].title.replace(/\(.+\)$/, ''))+'&callback=', function (data) {
                data = data.song;
                if (!data) {return;}
                for (var i = 0, len = data.length ; i < len ; i += 1) {
                    if (playList[current].artist.indexOf(data[i].artistname) > -1) {
                        S.ajax('http://ting.baidu.com/data/music/songlink?type=aac&speed=&songIds=' + data[i].songid, function (client) {
                            var song = JSON.parse(client.responseText).data.songList[0];
                            if (song) {
                                S.ajax('http://ting.baidu.com'+song.lrcLink, function (client) {
                                    playList[current].lrc = parseLrc(client.responseText);
                                });
                            }
                        });
                        break;
                    }
                }
            });
        }
        if (localStorage.notify === '1') {
            if (!p) {
                var notification = webkitNotifications.createNotification(
                    '../assets/icon48.png',
                    playList[current].title,
                    playList[current].artist
                );

                notification.show();
                setTimeout(function () {
                    notification.cancel();
                }, 5000);
            }
            else if (p.tab && p.tab.id !== -1) {
                chrome.windows.get(p.tab.windowId, function (win) {
                    if (!win.focused) {
                        var notification = webkitNotifications.createNotification(
                            '../assets/icon48.png',
                            playList[current].title,
                            playList[current].artist
                        );

                        notification.show();
                        setTimeout(function () {
                            notification.cancel();
                        }, 5000);
                    }
                });
            }
        }
        chrome.browserAction.setTitle({title: playList[current].title+'-'+playList[current].artist});
        if (!playList[current + 1]) {fetchSongs('p');}
    },false);

    audio.addEventListener('canplaythrough', function () {
        canplaythrough = true;
        p && p.postMessage({cmd: 'canplaythrough', status: true});
    },false);

    audio.addEventListener('timeupdate', function () {
        var currentTime = Math.round(audio.currentTime), msg;
        if (currentTime !== time) {
            time = currentTime;
            if(p) {
                msg = {cmd: 'progress', time: time, length: Math.round(audio.duration)}
                if(playList[current].lrc && playList[current].lrc[currentTime]) {
                    msg.lrc = playList[current].lrc[currentTime];
                }
                p.postMessage(msg);
            }
        }
    },false);

    audio.addEventListener('ended', function () {
        if (!isRepeat) {
            h.push('|' + playList[current].sid + ':p');
            fetchSongs('e');
            if (playList[current + 1]) {
                current += 1;
                audio.src = playList[current].url;
            }
            else {
                fetchSongs('p', function () {
                    current += 1;
                    audio.src = playList[current].url;
                    if (isPlay) {audio.play();}
                    time = 0;
                    port.postMessage(getCurrentSongInfo());
                });
            }
        }
        time = 0;
        audio.play();
        if (p) {p.postMessage(getCurrentSongInfo());}
    }, false);

    chrome.extension.onConnect.addListener(function(port) {
        if (port.name === 'fm') {
            p = port;
            port.onMessage.addListener(function (msg, port) {
                switch (msg.cmd) {
                case 'skip':
                    audio.currentTime = audio.duration * msg.rate;
                    break;
                case 'switch':
                    isPlay = msg.isPlay;
                    if (msg.isPlay) {
                        chrome.browserAction.setIcon({path: '../assets/icon16_pause.png'});
                        if (playList.length) {
                            audio.play();
                        }
                    }
                    else {
                        chrome.browserAction.setIcon({path: '../assets/icon16_play.png'});
                        audio.pause();
                    }
                    break;
                case 'next':
                    h.push('|' + playList[current].sid + ':s');

                    if (playList[current + 1]) {
                        current += 1;
                        audio.src = playList[current].url;
                        if (isPlay) {audio.play();}
                        time = 0;
                        port.postMessage(getCurrentSongInfo());
                    }
                    else {
                        fetchSongs('s', function () {
                            current += 1;
                            audio.src = playList[current].url;
                            if (isPlay) {audio.play();}
                            time = 0;
                            port.postMessage(getCurrentSongInfo());
                        });
                    }
                    break;
                case 'prev':
                    if (current) {
                        current -= 1;
                        audio.src = playList[current].url;
                        if (isPlay) {audio.play();}
                        time = 0;
                    }
                    port.postMessage(getCurrentSongInfo());
                    break;
                case 'index':
                    current = msg.index;
                    audio.src = playList[current].url;
                    if (isPlay) {audio.play();}
                    time = 0;
                    port.postMessage(getCurrentSongInfo());
                    break;
                case 'volume':
                    audio.volume = msg.value / 100;
                    localStorage.volume = msg.value;
                    break;
                case 'repeat':
                    isRepeat = msg.status;
                    break;
                case 'love':
                    if (msg.status) {
                        h.push('|' + playList[current].sid + ':r');
                        fetchSongs('r');
                        playList[current].like = '1';
                    }
                    else {
                        h.push('|' + playList[current].sid + ':u');
                        fetchSongs('u');
                        playList[current].like = '0';
                    }
                    h.pop();
                    break;
                case 'trash':
                    var f = false;
                    h.push('|' + playList[current].sid + ':b');
                    fetchSongs('b', function () {
                        if (f) {
                            current += 1;
                            audio.src = playList[current].url;
                            audio.play();
                            time = 0;
                            port.postMessage(getCurrentSongInfo());
                        }
                    });
                    h.pop();
                    playList.splice(current, 1);

                    if (!playList[current]) {
                        current -= 1;
                        f = true;
                    }
                    audio.src = playList[current].url;
                    audio.play();
                    time = 0;
                    port.postMessage(getCurrentSongInfo());
                    break;
                case 'get':
                    if (playList.length) {
                        port.postMessage(getCurrentSongInfo());
                    }
                    else {
                        channelCheck(Number(localStorage.channel), function (status) {
                            if (status) {
                                fetchSongs('n', function () {
                                    audio.src = playList[0].url;
                                    if (isPlay) {
                                        audio.volume = Number(localStorage.volume) / 100;
                                        audio.play();
                                        chrome.browserAction.setIcon({path: '../assets/icon16_pause.png'});
                                    }
                                    port.postMessage(getCurrentSongInfo());
                                });
                            }
                            else {
                                port.postMessage({cmd: 'channel'});
                            }
                        });
                    }
                    break;
                case 'channel':
                    channelCheck(msg.channel.v, function (status) {
                        if (status) {
                            localStorage.channel = msg.channel.v;
                            port.postMessage({cmd: 'channel', channel: msg.channel});
                            playList = playList.slice(0, current+1);
                            fetchSongs('n', function () {
                                current += 1;
                                audio.src = playList[current].url;
                                if (isPlay) {audio.play();}
                                port.postMessage(getCurrentSongInfo());
                            });
                        }
                        else {
                            port.postMessage({cmd: 'channel'});
                        }
                    });
                    break;
                }
            });

            port.onDisconnect.addListener(function (port) {
                if (port.name === 'fm') {
                    p = null;
                }
            });
        }
    });

    chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
        if (request.cmd === 'albumfm') {
            albumSongs = [];
            for (var i = 0, len = request.album.songs.length, song ; i < len ; i += 1) {
                song = request.album.songs[i];
                song.albumtitle = request.album.title;
                song.picture = request.album.picture;
                song.artist = request.album.artist;
                song.url = 'http://otho.douban.com/view/song/small/p'+song.sid+'.mp3';
                song.album = request.album.url;
                albumSongs.push(song);
            }
            localStorage.albumfm = JSON.stringify(albumSongs);
            localStorage.channel = '-2';
            playList = playList.slice(0, current+1);
            if (playList.length) {current += 1;}
            if (p) {p.postMessage({cmd: 'channel', channel: {t: '专辑频道', v: -2, title: request.album.title}});}
            fetchSongs('n', function () {
                audio.src = playList[current].url;
                audio.play();
                isPlay = true;
                chrome.browserAction.setIcon({path: '../assets/icon16_pause.png'});
                if (p) {p.postMessage(getCurrentSongInfo());}
            });
        }
    });

    function getCurrentSongInfo() {
        var song = playList[current], info = {cmd: 'set'};
        info.title = song.title;
        info.artist = song.artist;
        info.album = song.album;
        info.albumtitle = song.albumtitle;
        info.picture = song.picture;
        info.like = song.like;
        info.time = time;
        info.length = Math.floor(audio.duration);
        info.isPlay = isPlay;
        info.isRepeat = isRepeat;
        info.volume = audio.volume;
        info.canplaythrough = canplaythrough;
        info.current = current;
        info.list = playList;
        return info;
    }

    function fetchSongs(type, fn) {
        if (type === 'e') {
            S.ajax('http://douban.fm/j/mine/playlist?type=e&sid='+playList[current].sid+'&channel=0&from=mainsite&r='+rand());
            return;
        }

        var channel = localStorage.channel;

        if (channel.indexOf('-') === 0) {
            if (['b', 'u', 'r'].indexOf(type) > -1) {
                S.ajax('http://douban.fm/j/mine/playlist?type='+type+'&sid='+playList[current].sid+'&channel=0&from=mainsite&r='+rand());
            }
            else {
                if (channel === '-2') {
                    albumFm(fn);
                }
                else if (channel === '-1') {
                    likedFm(fn);
                }
                if (p && !fn) {p.postMessage(getCurrentSongInfo());}
            }
        }
        else {
            h = h.slice(-20);
            S.ajax('http://douban.fm/j/mine/playlist', {
                data: type === 'n'
                        ? 'type=n&h=&channel='+channel+'&from=mainsite&r='+rand()
                        : 'type='+type+'&sid='+playList[current].sid+'&h='+ h.join('') +'&channel='+channel+'&from=mainsite&r='+rand(),
                load: function (client) {
                    client = JSON.parse(client.responseText);
                    for (var i = 0, len = client.song.length ; i < len ; i += 1) {
                        if (/^\d+$/.test(client.song[i].sid)) {
                            client.song[i].picture = client.song[i].picture.replace('mpic', 'lpic');
                            //client.song[i].url = 'http://otho.douban.com/view/song/small/p'+client.song[i].sid+'.mp3';
                            client.song[i].album = 'http://music.douban.com'+client.song[i].album;
                            playList.push(client.song[i]);
                        }
                    }
                    if (fn) {fn();}
                    else if (p) {p.postMessage(getCurrentSongInfo());}
                },
                error: function (client) {
                    if (p) {p.postMessage({cmd: 'error'})}
                }
            });
        }
    }

    function likedFm(fn) {
        if (likedSongs.length) {
            for (var i = 0, len = likedSongs.length < 5 ? likedSongs.length : 5, random ; i < len ; i += 1) {
                random = Math.floor(Math.random() * likedSongs.length);
                playList.push(likedSongs.splice(random, 1)[0]);
            }
            fn && fn();
        }
        else {
            fetchLikedSongs(function () {
                for (var i = 0, len = likedSongs.length < 5 ? likedSongs.length : 5, random ; i < len ; i += 1) {
                    random = Math.floor(Math.random() * likedSongs.length);
                    playList.push(likedSongs.splice(random, 1)[0]);
                }
                fn && fn();
            });
        }
    }

    function fetchLikedSongs(fn) {
        var index = 0;
        fetch(0)
        function fetch(index) {
            S.ajax('http://douban.fm/mine', {
                data: 'type=liked&start=' + index,
                load: function (client) {
                    likedSongsParser.innerHTML = client.responseText.match(/(<div id="record_viewer">[\s\S]+)<div class="paginator">/m)[1].replace(/onload="reset_icon_size\(this\);"/gm, '');
                    var songs = likedSongsParser.querySelectorAll('.info_wrapper');
                    for (var i = 0, len = songs.length, song ; i < len ; i += 1) {
                        song = songs[i];
                        var item = {};
                        item.album = song.querySelector('a').href;
                        item.picture = song.querySelector('img').src.replace('spic', 'lpic');
                        item.title = song.querySelector('.song_title').innerHTML;
                        item.artist = song.querySelector('.performer').innerHTML;
                        item.albumtitle = song.querySelector('.source a').innerHTML;
                        item.sid = song.querySelector('.action').getAttribute('sid');
                        item.url = 'http://otho.douban.com/view/song/small/p'+item.sid+'.mp3';
                        item.like = '1';
                        likedSongs.push(item);
                    }
                    likedSongsParser.innerHTML = '';
                    if (index === 0 && fn) {fn();}
                    if (len === 15) {
                        setTimeout(function () {
                            index += 15;
                            fetch(index);
                        }, 1000);
                    }
                },
                error: function (client) {
                    //fetch(index);
                }
            });
        }
    }

    function albumFm(fn) {
        if (albumSongs.length) {
            playList = playList.concat(albumSongs);
            fn && fn();
        }
        else if (localStorage.albumfm) {
            albumSongs = JSON.parse(localStorage.albumfm);
            playList = playList.concat(albumSongs);
            fn && fn();
        }
    }

    function channelCheck(channel, fn) {
        if (channel === -1 || channel === 0) {
            chrome.cookies.get({
                url: 'http://douban.fm',
                name: 'dbcl2'
            }, function (c) {
                fn(c);
            });


            chrome.cookies.getAll({
                url: 'http://douban.fm',
            }, function (c) {
                var process = 0;
                for (var i = 0, len = c.length, item ; i < len ; i += 1) {
                    item = c[i];console.log(i, item.name, item.value)
                    if ((item.name === 'fmNlogin' && item.value === '"y"') || item.name === 'dbcl2') {process += 1}
                }
                //fn(process === 2);
            });

            return;

            S.ajax('http://douban.fm/mine', {
                data: 'type=liked&start=0',
                load: function (client) {
                    fn(/<div class="info_wrapper">/m.test(client.responseText));
                },
                error: function (client) {console.log(client)
                    if (client.timeout) {fn(false, true)}
                    else fn(false);
                }
            });
        }
        else {
            fn(true);
        }
    }

    function rand() {
        var charset = '1234567890abcdef', str = '', i;
        for (i = 0 ; i < 10 ; i += 1) {
            str += charset.charAt(Math.floor(Math.random() * 16));
        }
        return str;
    }

    S.ajax('http://douban.fm/mine?type=liked&start=0', function(){});
