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
})(this, this.document);
