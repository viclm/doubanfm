(function (window, document, undefined) {
    var isPlay = false;
    var timer = null;
    var port = chrome.extension.connect({name: 'fm'});
    var title = player.querySelector('h1');
    var artist = player.querySelector('p');
    var progress = player.querySelector('header div');
    var soundCtr = player.querySelector('input[type=range]');
	var channelCurrent = 0;

    port.postMessage({cmd: 'get'});

    port.onMessage.addListener(function (msg) {
        switch (msg.cmd) {
        case 'progress':
            progress.style.width = msg.time / msg.length * 275 + 'px';
            progress.title = strftime(msg.time) + '/' + strftime(msg.length);
            break;
        case 'set':
            title.innerHTML = msg.title;
            artist.innerHTML = msg.artist + ' | ' + msg.albumtitle;
            progress.title = strftime(msg.time) + '/' + strftime(msg.length);
            progress.style.width = msg.time / msg.length * 275 + 'px';
            document.body.style.backgroundImage = 'url('+ msg.picture +')';
            soundCtr.value = msg.volume * 100;
            if (msg.like === '1') {love.className = 'on';}
            if (msg.isRepeat) {repeat.className = 'on';}
            isPlay = msg.isPlay;
            if (isPlay) {
                play.style.backgroundImage = 'url(../assets/pause.png)';
            }
            else {
                play.style.backgroundImage = 'url(../assets/play.png)';
            }

            if (!msg.canplaythrough){
                loading.style.display = 'block';
            }
            break;
        case 'canplaythrough':
            if (msg.status) {
                loading.style.display = 'none';
            }
            else {
                loading.style.display = 'block';
                progress.style.width = 0;
            }
            break;
        }
    });

    play.addEventListener('click', function (e) {
        if (isPlay) {
            this.style.backgroundImage = 'url(../assets/play.png)';
        }
        else {
            this.style.backgroundImage = 'url(../assets/pause.png)';
        }
        isPlay = !isPlay;
        port.postMessage({cmd: 'switch', isPlay: isPlay});
        e.preventDefault();
    }, false);

    next.addEventListener('click', function (e) {
        port.postMessage({cmd: 'next'});
        e.preventDefault();
    }, false);

    prev.addEventListener('click', function (e) {
        port.postMessage({cmd: 'prev'});
        e.preventDefault();
    }, false);

    sound.addEventListener('click', function (e) {
        if (soundCtr.style.display !== 'block') {
            soundCtr.style.display = 'block';
        }
        else {
            soundCtr.style.display = 'none';
        }
        e.preventDefault();
    }, false);

    soundCtr.addEventListener('change', function (e) {
        port.postMessage({cmd: 'volume', value: e.target.value});
    }, false);

    repeat.addEventListener('click', function (e) {
        if (this.className === 'on') {
            this.className = '';
            port.postMessage({cmd: 'repeat', status: false});
        }
        else {
            this.className = 'on';
            port.postMessage({cmd: 'repeat', status: true});
        }
        e.preventDefault();
    }, false);

    love.addEventListener('click', function (e) {
        if (this.className === 'on') {
            this.className = '';
            port.postMessage({cmd: 'love', status: false});
        }
        else {
            this.className = 'on';
            port.postMessage({cmd: 'love', status: true});
        }
        e.preventDefault();
    }, false);

    trash.addEventListener('click', function (e) {
        port.postMessage({cmd: 'trash'});
    }, false);

    function strftime(seconds) {
        var minutes = Math.floor(seconds / 60), seconds = seconds % 60, str;
        str = (minutes > 9 ? minutes : '0' + minutes) + ':' + (seconds > 9 ? seconds : '0' + seconds);
        return str;
    };


	//channelFlush(channelList);
	//
	
	channelCurrent = Number(localStorage.channel);
	channelOrient(channelCurrent, channelList);

	delegate(channel, 'p', 'click', function () {
		if (!this.dataset.cascade) {channelFlush(channelList)}
		else {
			var cascade = this.dataset.cascade.split('|'), i, len, obj;
			obj = channelList[cascade[0]];
			for (i = 1, len = cascade.length ; i < len ; i += 1) {
				obj = obj.sub[cascade[i]];
			}
			if (obj.sub) {
				channelFlush(obj.sub, this.dataset.cascade);
			}
			else {
				var c = channel.querySelector('.active');
				if (c) {c.className = ''}
				channelCurrent = obj.v;
				this.className = 'active';
				localStorage.channel = channelCurrent;
			}
		}
	});

	function channelFlush(data, cascade) {
		var i, len, html = '';
		for (i = 0, len = data.length ; i < len ; i += 1) {
			html += '<p data-cascade="' + (cascade ? cascade + '|' : '') + i + '"' + (data[i].v !== undefined && data[i].v === channelCurrent ? 'class="active"' : '') +'>' + data[i].t + '</p>';
		}
		if (cascade) {
			html += '<p class="nav" data-cascade="' + cascade.slice(0, -2) + '">上一层</p>';
		}
		channel.innerHTML = html;
	}

	function channelOrient(v, list, index) {
		for (var i = 0, len = list.length ; i < len ; i += 1) {
			if (list[i].v === v) {
				channelFlush(list, index);
				channel.querySelector('p:nth-child(' +(i+1)+ ')').className = 'active';
				return index ? index + '|' + i : i;
			}

			if (list[i].sub) {
				var res = channelOrient(v, list[i].sub, index ? index + '|' + i : i);
				if (res) {
					return res;
				}
			}
		}
		return false;
	}


	function delegate(node, selector, type, handler) {
        node.delegate || (node.delegate = {});
        node.delegate[selector] = {handler: handler};
        delegate.nodeList || (delegate.nodeList = []);
        if (delegate.nodeList.indexOf(node) === -1) {
            node.addEventListener(type, function (e) {
                var target = e.target, key, tmp;
                do {
                    for (key in node.delegate) {
                        tmp = node.delegate[key];
                        if (Array.prototype.indexOf.call(node.querySelectorAll(key), target) > -1) {
                            delete e.target;
                            e.target = target;
                            tmp.handler.call(target, e);
                            return;
                        }
                    }
                    target = target.parentNode;
                }
                while (target && target !== this);
            }, false);
            delegate.nodeList.push(node);
        }
    };
	
})(this, this.document);
