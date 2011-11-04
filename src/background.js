(function (window, document, undefined) {
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


    helper.addEventListener('canplaythrough', function () {canplaythrough = true;}, false);

    audio.addEventListener('canplaythrough', function () {console.log('canplaythrough')
		p && p.postMessage({cmd: 'canplaythrough', status: true});
		bufferNext();
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
			if (h.length && h[h.length - 1].indexOf(playList[current].sid) > -1) {h.pop();}
			h.push('|' + playList[current].sid + ':p');
			current += 1;
			audio.src = playList[current].url;
		}
        time = 0;
        audio.play();
		if (p) {p.postMessage({cmd: 'set', song: getCurrentSongInfo()});}
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
					if (playList[current]) {
						if (h.length && h[h.length - 1].indexOf(playList[current].sid) > -1) {h.pop();}
						h.push('|' + playList[current].sid + ':s');
					
						current += 1;
						if (playList[current]) {
							audio.src = playList[current].url;
							audio.play();
							time = 0;
							port.postMessage({cmd: 'set', song: getCurrentSongInfo()});
						}
						else {
							fetchSongs(function () {
								audio.src = playList[current].url;
								audio.play();
								time = 0;
								port.postMessage({cmd: 'set', song: getCurrentSongInfo()});
							});
						}
					}
					break;
				case 'prev':
					if (current) {
						current -= 1;
						audio.src = playList[current].url;
						audio.play();
						time = 0;
					}
					port.postMessage({cmd: 'set', song: getCurrentSongInfo()});
					break;
				case 'volume':
					audio.volume = msg.value / 100;
				case 'repeat':
					isRepeat = msg.status;
					break;
				case 'love':
					if (status) {
						h.push('|' + playList[current].sid + ':r');
					}
					else {
						h.pop();
					}
					break;
				case 'trash':
					if (playList[current]) {
						if (h.length && h[h.length - 1].indexOf(playList[current].sid) > -1) {h.pop();}
						h.push('|' + playList[current].sid + ':b');
					
						current += 1;
						if (playList[current]) {
							audio.src = playList[current].url;
							audio.play();
							time = 0;
							port.postMessage({cmd: 'set', song: getCurrentSongInfo()});
						}
						else {
							fetchSongs(function () {
								audio.src = playList[current].url;
								audio.play();
								time = 0;
								port.postMessage({cmd: 'set', song: getCurrentSongInfo()});
							});
						}
					}
					break;
                case 'get':
                    if (playList.length) {
                        port.postMessage({cmd: 'set', song: getCurrentSongInfo()});
                    }
                    else {
                        fetchSongs(function () {
							audio.src = playList[0].url;
							if (isPlay) {audio.play();}
							port.postMessage({cmd: 'set', song: getCurrentSongInfo()});
						});
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

	function fetchSongs(fn) {
		h = h.slice(-20);
		ajax(
			'get',
			'http://douban.fm/j/mine/playlist',
			h.length ? 'type=s&sid='+ h[h.length - 1].slice(1, -2) +'&h='+ h.join('') +'&channel=0&from=mainsite&r='+rand() : 'type=n&h=&channel=0&from=mainsite&r='+rand(),
			10000,
			function (client) {
				client = JSON.parse(client.responseText);
				for (var i = 0, len = client.song.length ; i < len ; i += 1) {
					if (/^\d+$/.test(client.song[i].sid)) {
						client.song[i].picture = client.song[i].picture.replace('mpic', 'lpic');
						playList.push(client.song[i]);
					}
				}
				fn();
			}
		);
	}

	function buffer() {
		canplaythrough = false;
		setTimeout(function () {
			if (!canplaythrough) {
				playList = playList.splice(current + 1);
				bufferNext();
			}
		}, 30000);
	}

	function bufferNext() {
        if (current === playList.length - 1) {
            fetchSongs(function () {
				helper.src = playList[1].url;
				buffer();
			});
        }
        else {
            helper.src = playList[current + 1].url;
			buffer();
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
        var charset = '1234567890abcdef', str = '';
        for (var i = 0 ; i < 10 ; i += 1) {
            str += charset.charAt(Math.floor(Math.random() * 16));
        }
        return str;
    }
})(this, this.document);

