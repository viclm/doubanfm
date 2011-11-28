
    var audio = document.querySelector('audio');
    var isPlay = false;
    var isRepeat = false;
    var playList = [];
    var h = [];
    var current = 0;
    var time = 0;
    var canplaythrough = false;
    var p = null;
	var likedSongs = [];

	localStorage.channel || (localStorage.channel = '1');
    localStorage.notify || (localStorage.notify = '1');


    audio.addEventListener('loadstart', function () {
        canplaythrough = false;
        p && p.postMessage({cmd: 'canplaythrough', status: false});
        if (localStorage.notify === '1') {
            var notification = webkitNotifications.createNotification(
                '../assets/icon48.png',
                '即将播放',
                playList[current].artist + ' ' + playList[current].title
            );

            notification.show();
            setTimeout(function () {
                notification.cancel();
            }, 5000);
        }
    },false);

    audio.addEventListener('canplaythrough', function () {
        canplaythrough = true;
        p && p.postMessage({cmd: 'canplaythrough', status: true});
        if (!playList[current + 1]) {
            fetchSongs();
        }
    },false);

    audio.addEventListener('timeupdate', function () {
        var currentTime = Math.floor(audio.currentTime);
        if (currentTime > time) {
            time = currentTime;
            if(p) {p.postMessage({cmd: 'progress', time: time, length: Math.floor(audio.duration)});}
        }
    },false);

    audio.addEventListener('ended', function () {
        if (!isRepeat) {
            if (localStorage.channel !== '-1') {h.push('|' + playList[current].sid + ':p');}
            current += 1;
            audio.src = playList[current].url;
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
                    if (localStorage.channel !== '-1') {h.push('|' + playList[current].sid + ':s');}

                    if (playList[current + 1]) {
                        current += 1;
                        audio.src = playList[current].url;
                        if (isPlay) {audio.play();}
                        time = 0;
                        port.postMessage(getCurrentSongInfo());
                    }
                    else {
                        fetchSongs(function () {
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
                    break;
                case 'repeat':
                    isRepeat = msg.status;
                    break;
                case 'love':
                    if (msg.status) {
                        h.push('|' + playList[current].sid + ':r');
                        playList[current].like = '1';
                    }
                    else {
                        h.push('|' + playList[current].sid + ':u');
                        playList[current].like = '0';
                    }
                    fetchSongs();
                    h.pop();
                    break;
                case 'trash':
                    h.push('|' + playList[current].sid + ':b');
                    fetchSongs();
                    h.pop();
                    playList.splice(current, 1);

                    if (playList[current]) {
                        audio.src = playList[current].url;
                        audio.play();
                        time = 0;
                        port.postMessage(getCurrentSongInfo());
                    }
                    else {
                        current -= 1;
                        fetchSongs(function () {
                            current += 1;
                            audio.src = playList[current].url;
                            audio.play();
                            time = 0;
                            port.postMessage(getCurrentSongInfo());
                        });
                    }
                    break;
                case 'get':
                    if (playList.length) {
                        port.postMessage(getCurrentSongInfo());
                    }
                    else {
                        channelCheck(Number(localStorage.channel), function (status, error) {
                            if (status) {
                                fetchSongs(function () {
                                    audio.src = playList[0].url;
                                    if (isPlay) {audio.play();}
                                    port.postMessage(getCurrentSongInfo());
                                });
                            }
                            else {
                                if (error) {port.postMessage({cmd: 'error'});}
                                else {port.postMessage({cmd: 'channel'});}
                            }
                        });
                    }
                    break;
                case 'channel':
                    channelCheck(msg.channel.v, function (status, error) {
                        if (status) {
                            localStorage.channel = msg.channel.v;
                            port.postMessage({cmd: 'channel', channel: msg.channel});
                            playList = playList.slice(0, current+1);
                            fetchSongs(function () {
                                current += 1;
                                audio.src = playList[current].url;
                                if (isPlay) {audio.play();}
                                port.postMessage(getCurrentSongInfo());
                            });
                        }
                        else {
                            if (error) {port.postMessage({cmd: 'error'});}
                            else {port.postMessage({cmd: 'channel'});}
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

    function fetchSongs(fn) {
        var channel = localStorage.channel;
        if (channel === '-1') {
            likedFm(fn);
            if (h.length) {
                h = h.slice(-20);
                var type = h[h.length-1].slice(-1);
                if (['b', 'u', 'r'].indexOf(type) > -1) {
                    ajax(
                        'get',
                        'http://douban.fm/j/mine/playlist',
                        'type='+type+'&sid='+ h[h.length - 1].slice(1, -2) +'&h='+ h.join('') +'&channel=0&from=mainsite&r='+rand(),
                        function () {},
                        function () {}
                    );
                }
            }
        }
        else {
            var r = rand();
            h = h.slice(-20);
            ajax(
                'get',
                'http://douban.fm/j/mine/playlist',
                h.length ? 'type='+h[h.length-1].slice(-1)+'&sid='+ h[h.length - 1].slice(1, -2) +'&h='+ h.join('') +'&channel='+channel+'&from=mainsite&r='+r : 'type=n&h=&channel='+channel+'&from=mainsite&r='+r,
                function (client) {
                    client = JSON.parse(client.responseText);
                    for (var i = 0, len = client.song.length ; i < len ; i += 1) {
                        if (/^\d+$/.test(client.song[i].sid)) {
                            client.song[i].picture = client.song[i].picture.replace('mpic', 'lpic');
                            client.song[i].url = 'http://otho.douban.com/view/song/small/p'+client.song[i].sid+'.mp3';
                            client.song[i].album = 'http://music.douban.com'+client.song[i].album;
                            playList.push(client.song[i]);
                        }
                    }
                    fn && fn();
                },
                function (client) {
                    if (p) {p.postMessage({cmd: 'error'})}
                }
            );
        }
    }

    function likedFm(fn) {
        if (likedSongs.length) {
            for (var i = 0, len = likedSongs.length < 5 ? likedSongs.length : 5, song ; i < len ; i += 1) {
                playList.push(likedSongs[Math.floor(Math.random() * likedSongs.length)]);
            }
            fn && fn();
        }
        else {
            fetchLikedSongs(function () {
                for (var i = 0, len = likedSongs.length < 5 ? likedSongs.length : 5, song ; i < len ; i += 1) {
                    playList.push(likedSongs[Math.floor(Math.random() * likedSongs.length)]);
                }
                fn && fn();
            });
        }
    }

    function fetchLikedSongs(fn) {
        var index = 0;
        fetch(0)
        function fetch(index) {
            ajax(
                'get',
                'http://douban.fm/mine',
                'type=liked&start=' + index,
                function (client) {
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
                function (client) {
                    if (p) {p.postMessage({cmd: 'error'})}
                }
            );
        }
    }

    function channelCheck(channel, fn) {
        if (channel === -1 || channel === 0) {
            ajax(
                'get',
                'http://douban.fm/mine',
                'type=liked&start=0',
                function (client) {
                    fn(/<div class="info_wrapper">/m.test(client.responseText));
                },
                function (client) {
                    fn(false, true);
                }
            );
        }
        else {
            fn(true);
        }
    }

    function ajax(method, url, data, success, error, timeout) {
        var client = new XMLHttpRequest(), isTimeout = false, isComplete = false;
        method = method.toLowerCase();
        if (method === 'get' && data) {
            url += '?' + data;
            data = null;
        }
        client.onload = function () {
            if (!isComplete) {
                if (!isTimeout && ((client.status >= 200 && client.status < 300) || client.status == 304)) {
                    success(client);
                }
                else {
                    error(client);
                }
                isComplete = true;
            }
        };
        client.onerror = function () {
            if (!isComplete) {
                error(client);
                isComplete = true;
            }
        };
        client.open(method, url, true);
        if (method === 'post') {client.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');}
        client.setRequestHeader('ajax', 'true');
        client.send(data);
        setTimeout(function () {
            isTimeout = true;
            if (!isComplete) {
                client.timeout = true;
                error(client);
                isComplete = true;
            }
        }, timeout || 5000);
    };

    function rand() {
        var charset = '1234567890abcdef', str = '', i;
        for (i = 0 ; i < 10 ; i += 1) {
            str += charset.charAt(Math.floor(Math.random() * 16));
        }
        return str;
    }
