(function (window, document, undefined) {
    var audio = document.querySelector('audio');
    var isPlay = false;
    var playList = [];
    var current = 0;
    var time = 0;
    var p = null;


    audio.addEventListener('canplaythrough', function () {
        console.log('canplaythrough');
    },false);

    audio.addEventListener('progress', function () {
        var endBuf = audio.buffered.end(0);
        time = parseInt(((endBuf / audio.duration) * 100));console.log(audio.buffered, time)
        //if(p) {p.postMessage({cmd: 'progress', time: time});}
    },false);

    audio.addEventListener('ended', function () {
        console.log('ended');
        time = 0;
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
                        else {
                            port.postMessage({});
                        }
                    }
                    else {
                        audio.pause();
                    }
                    break;
                case 'getCurrentSongInfo':
                    if (playList.length) {
                        port.postMessage({cmd: 'setCurrentSongInfo', song: getCurrentSongInfo()});
                    }
                    else {
                        ajax(
                            'get',
                            'http://douban.fm/j/mine/playlist',
                            'type=n&h=&channel=0&from=mainsite&r=4941e23d79',
                            10000,
                            function (client) {
                                client = JSON.parse(client.responseText);
                                playList = client.song;console.log(playList)
                                audio.src = playList[0].url;
                                current = 0;
                                if (isPlay) {
                                    audio.play();
                                }
                                port.postMessage({cmd: 'setCurrentSongInfo', song: getCurrentSongInfo()});
                            }
                        );
                    }
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
        var song = playList[current];
        song.progress = time;
        return song;
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
})(this, this.document);

