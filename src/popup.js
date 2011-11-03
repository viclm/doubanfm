(function (window, document, undefined) {
    var isPlay = false;
	var timer = null;
    var port = chrome.extension.connect({name: 'fm'});
    var play = document.querySelector('#play');
    var title = document.querySelector('h1');
    var artist = document.querySelector('p');
    var progress = document.querySelector('header div');
	var loading = document.querySelector('#loading');

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

    function strftime(seconds) {
        var minutes = Math.floor(seconds / 60), seconds = seconds % 60, str;
        str = (minutes > 9 ? minutes : '0' + minutes) + ':' + (seconds > 9 ? seconds : '0' + seconds);
        return str;
    };
})(this, this.document);
