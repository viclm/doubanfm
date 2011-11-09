
    var audio = document.querySelector('audio');
    var helper = document.querySelector('#helper');
    var isPlay = false;
    var isRepeat = false;
    var playList = [];
    var h = [];
    var current = 0;
    var time = 0;
    var canplaythrough = false;
    var p = null;

    oauth(function () {});

	localStorage.channel || (localStorage.channel = '0');


    //helper.addEventListener('canplaythrough', function () {canplaythrough = true;console.log('helper canplaythrough')}, false);

    audio.addEventListener('loadstart', function () {
        canplaythrough = false;
        p && p.postMessage({cmd: 'canplaythrough', status: false});
    },false);

    audio.addEventListener('canplaythrough', function () {
        canplaythrough = true;
        p && p.postMessage({cmd: 'canplaythrough', status: true});
        //bufferNext();
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
            h.push('|' + playList[current].sid + ':p');
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
                        if (playList.length) {
                            audio.play();
                        }
                    }
                    else {
                        audio.pause();
                    }
                    break;
                case 'next':
                    h.push('|' + playList[current].sid + ':s');

                    if (playList[current + 1]) {
                        current += 1;
                        audio.src = playList[current].url;
                        audio.play();
                        time = 0;
                        port.postMessage(getCurrentSongInfo());
                    }
                    else {
                        fetchSongs(function () {
                            current += 1;
                            audio.src = playList[current].url;
                            audio.play();
                            time = 0;
                            port.postMessage(getCurrentSongInfo());
                        });
                    }
                    break;
                case 'prev':
                    if (current) {
                        current -= 1;
                        audio.src = playList[current].url;
                        audio.play();
                        time = 0;
                    }
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
                    fetchSongs(function (){});
                    h.pop();
                    playList.splice(current, 1);

                    //current += 1;
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
                        fetchSongs(function () {
                            audio.src = playList[0].url;
                            if (isPlay) {audio.play();}
                            port.postMessage(getCurrentSongInfo());
                        });
                    }
                    break;
                case 'channel':
                    audio.pause();
                    playList = playList.slice(0, current+1);
                    fetchSongs(function () {
                        current += 1;
                        audio.src = playList[current].url;
                        if (isPlay) {audio.play();}
                        port.postMessage(getCurrentSongInfo());
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
        info.albumtitle = song.albumtitle;
        info.picture = song.picture;
        info.like = song.like;
        info.time = time;
        info.length = Math.floor(audio.duration);
        info.isPlay = isPlay;
        info.isRepeat = isRepeat;
        info.volume = audio.volume;
        info.canplaythrough = canplaythrough;
        return info;
    }

    function fetchSongs(fn) {
        h = h.slice(-20);
        var r = rand();
        var channel = localStorage.channel;
        ajax(
            'get',
            'http://douban.fm/j/mine/playlist',
            h.length ? 'type=s&sid='+ h[h.length - 1].slice(1, -2) +'&h='+ h.join('') +'&channel='+channel+'&from=mainsite&r='+r : 'type=n&h=&channel='+channel+'&from=mainsite&r='+r,
            10000,
            function (client) {
                client = JSON.parse(client.responseText);
                for (var i = 0, len = client.song.length ; i < len ; i += 1) {
                    if (/^\d+$/.test(client.song[i].sid)) {
                        client.song[i].picture = client.song[i].picture.replace('mpic', 'lpic');
						client.song[i].url = 'http://otho.douban.com/view/song/small/p'+client.song[i].sid+'.mp3';
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

    function buffer() {
        canplaythrough = false;
        var i = current;
        setTimeout(function () {console.log(helper.readyState)
            if (i === current && helper.readyState === 0) {
                console.log('helper skip', playList);
                playList.splice(i+1, 1);
                bufferNext();
            }
        }, 10000);
    }

    function bufferNext() {
        if (playList[current+1]) {
            buffer();
            helper.src = playList[current + 1].url;
        }
        else {
            fetchSongs(function () {
                buffer();
                helper.src = playList[1].url;
            });
        }
    }

    function ajax(method, url, data, timeout, success, error) {
        var client = new XMLHttpRequest(), data, isTimeout = false, self = this;
        method = method.toLowerCase();
        if (typeof data === 'object') {
            data = stringify(data);
        }
        if (method === 'get' && data) {
            url += '?' + data;
            data = null;
        }
        client.onload = function () {
            if (!isTimeout && ((client.status >= 200 && client.status < 300) || client.status == 304)) {
                success(client);
            }
            else {
                error(client);
            }
        };
        client.open(method, url, true);
        method === 'post' && client.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        client.setRequestHeader('ajax', 'true');
        client.send(data);
        setTimeout(function () {isTimeout = true;}, timeout);
    };

    function rand() {
        var charset = '1234567890abcdef', str = '', i;
        for (i = 0 ; i < 10 ; i += 1) {
            str += charset.charAt(Math.floor(Math.random() * 16));
        }
        return str;
    }
