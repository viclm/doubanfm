(function (window, document, undefined) {
    var isPlay = false;
	var timer = null;
    var port = chrome.extension.connect({name: 'fm'});
    var title = document.querySelector('h1');
    var artist = document.querySelector('p');
    var progress = document.querySelector('header div');
	var soundCtr = document.querySelector('input[type=range]')

    port.postMessage({cmd: 'get'});

    port.onMessage.addListener(function (msg) {
        switch (msg.cmd) {
		case 'progress':
			progress.style.width = msg.time / msg.length * 275 + 'px';
            progress.title = strftime(msg.time) + '/' + strftime(msg.length);
			break;
        case 'set':
            title.innerHTML = msg.song.title;
            artist.innerHTML = msg.song.artist + ' | ' + msg.song.albumtitle;
            progress.title = strftime(msg.song.time) + '/' + strftime(msg.song.length);
            progress.style.width = msg.song.progress / msg.song.length * 275 + 'px';
            document.body.style.backgroundImage = 'url('+ msg.song.picture +')';
			isPlay = msg.song.isPlay;
			if (isPlay) {
				play.style.backgroundImage = 'url(../assets/pause.png)';
			}
			else {
				play.style.backgroundImage = 'url(../assets/play.png)';
			}

			if (msg.song.progress === 0) {
				loading.style.display = 'block';
			}
            break;
        case 'canplaythrough':
            loading.style.display = 'none';
			progress.style.width = 0;
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
		if (soundCtr.style.display === 'none') {
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
			this.style.backgroundImage = 'url(../assets/repeat.png)';
			this.className = '';
			port.postMessage({cmd: 'repeat', status: false});
		}
		else {
			this.style.backgroundImage = 'url(../assets/repeati.png)';
			this.className = 'on';
			port.postMessage({cmd: 'repeat', status: true});
		}
        e.preventDefault();
    }, false);

	love.addEventListener('click', function (e) {
		if (this.className === 'on') {
			this.style.backgroundImage = 'url(../assets/love.png)';
			this.className = '';
			port.postMessage({cmd: 'love', status: false});
		}
		else {
			this.style.backgroundImage = 'url(../assets/lovei.png)';
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
})(this, this.document);
