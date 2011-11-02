(function (window, document, undefined) {
    var isPlay = false;
    var port = chrome.extension.connect({name: 'fm'});
    var play = document.querySelector('#play');
    var title = document.querySelector('h1');
    var artist = document.querySelector('p');
    var progress = document.querySelector('header div');

    port.postMessage({cmd: 'getCurrentSongInfo'});

    port.onMessage.addListener(function (msg) {
        switch (msg.cmd) {
		case 'progress':
			progress.style.width = msg.time / msg.length * 275 + 'px';
            progress.title = strftime(msg.time) + '/' + strftime(msg.length);
			break;
        case 'setCurrentSongInfo':
            title.innerHTML = msg.song.title;
            artist.innerHTML = msg.song.artist + ' | ' + msg.song.albumtitle;
            progress.title = strftime(msg.song.time) + '/' + strftime(msg.song.length);
            progress.style.width = msg.song.progress / msg.song.length * 275 + 'px';
            document.body.style.backgroundImage = 'url('+ msg.song.picture +'), url(../assets/loading.gif)';
			isPlay = msg.song.isPlay;
			if (isPlay) {
				play.style.backgroundImage = 'url(../assets/pause.png)';
			}
			else {
				play.style.backgroundImage = 'url(../assets/play.png)';
			}
            break;
        default:
            document.body.style.backgroundImage = 'none';
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
        progress.style.width = 0;
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
