(function (window, document, undefined) {
    var audio = document.querySelector('audio');
    var helper = document.querySelector('#helper');
    var isPlay = false;
    var playList = [];
    var h = [];
    var current = 0;
    var time = 0;
    var p = null;


    helper.addEventListener('canplaythrough', function () {}, false);

    audio.addEventListener('canplaythrough', function () {
        console.log('canplaythrough', playList);
        if (current === playList.length - 1) {
            h = h.slice(-20);
            ajax(
                'get',
                'http://douban.fm/j/mine/playlist',
                'type=s&sid='+ h[h.length - 1].slice(1, -2) +'&h='+ h.join('') +'&channel=0&from=mainsite&r='+rand(),
                10000,
                function (client) {
                    client = JSON.parse(client.responseText);
                    playList = playList.slice(-1);
                    for (var i = 0, len = client.song.length ; i < len ; i += 1) {
                        if (/^\d+$/.test(client.song[i].sid)) {
                            client.song[i].picture = client.song[i].picture.replace('mpic', 'lpic');
                            playList.push(client.song[i]);
                        }
                    }
                    current = 0;
                    helper.src = playList[1].url;
                }
            );
        }
        else {
            helper.src = playList[current + 1].url;
        }
    },false);

    /*audio.addEventListener('progress', function () {
        var endBuf = audio.buffered.end(0);
        //time = audio.currentTime;
        //if(p) {p.postMessage({cmd: 'progress', time: time});}
    },false);*/

	audio.addEventListener('timeupdate', function () {
        var currentTime = Math.floor(audio.currentTime);
		if (currentTime > time) {
			time = currentTime;
			if(p) {p.postMessage({cmd: 'progress', time: time, length: Math.floor(audio.duration)});}
		}
    },false);

    audio.addEventListener('ended', function () {
        console.log('ended', playList);
        if (h.length && h[h.length - 1].indexOf(playList[current].sid) > -1) {h.pop();}
        h.push('|' + playList[current].sid + ':p');
        time = 0;
        current += 1;
        audio.src = playList[current].url;
        audio.play();
        if (p) {p.postMessage({cmd: 'setCurrentSongInfo', song: getCurrentSongInfo()});}
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
				case 'next':
                    if (h.length && h[h.length - 1].indexOf(playList[current].sid) > -1) {h.pop();}
                    h.push('|' + playList[current].sid + ':s');
                    current += 1;
                    audio.src = playList[current].url;
                    audio.play();
                    time = 0;
                    p.postMessage({cmd: 'setCurrentSongInfo', song: getCurrentSongInfo()});
					break;
				case 'prev':
					break;
                case 'getCurrentSongInfo':
                    if (playList.length) {
                        port.postMessage({cmd: 'setCurrentSongInfo', song: getCurrentSongInfo()});
                    }
                    else {
                        ajax(
                            'get',
                            'http://douban.fm/j/mine/playlist',
                            'type=n&h=&channel=0&from=mainsite&r='+rand(),
                            10000,
                            function (client) {
                                client = JSON.parse(client.responseText);
                                playList = [];
                                for (var i = 0, len = client.song.length ; i < len ; i += 1) {
                                    if (/^\d+$/.test(client.song[i].sid)) {
                                        client.song[i].picture = client.song[i].picture.replace('mpic', 'lpic');
                                        playList.push(client.song[i]);
                                    }
                                }
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
        song.length = Math.floor(audio.duration);
		song.isPlay = isPlay;
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

    function rand() {
        var charset = '1234567890abcdef', str = '';
        for (var i = 0 ; i < 10 ; i += 1) {
            str += charset.charAt(Math.floor(Math.random() * 16));
        }
        return str;
    }
})(this, this.document);

