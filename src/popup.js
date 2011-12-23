var Winswitcher = (function (window, document, undefined) {
    function Winswitcher(args) {

        this.superclass.constructor.call(this, args);

        this.slide = document.querySelector('body > div');
        this.btnPrev = left;
        this.btnNext = right;
        this.count = 2;
        this.length = 3;

        var self = this;

        this.btnPrev.addEventListener('click', function (e) {
            self.prev();
            e.preventDefault();
        }, false);

        this.btnNext.addEventListener('click', function (e) {
            self.next();
            e.preventDefault();
        }, false);

        document.body.addEventListener('mouseover', function () {
            if (self.btnPrev.dataset.visible === 'hidden') {
                self.btnPrev.style.display = 'none';
            }
            else {
                self.btnPrev.style.display = 'block';
            }

            if (self.btnNext.dataset.visible === 'hidden') {
                self.btnNext.style.display = 'none';
            }
            else {
                self.btnNext.style.display = 'block';
            }
        }, false);

        document.body.addEventListener('mouseout', function () {
            self.btnPrev.style.display = 'none';
            self.btnNext.style.display = 'none';
        }, false);

        this.setNav();
        this.btnPrev.style.display = 'none';
        this.btnNext.style.display = 'none';
    }

    S.extend(Winswitcher, Slideshow);

    Winswitcher.prototype.moveTo = function (index) {
        var res = this.superclass.moveTo.call(this, index);
        if (res > -1) {
            this.slide.style.left = -(res-1)*100+'%';
            this.setNav();
        }
    };

    Winswitcher.prototype.setNav = function () {
        if (this.count === 1) {
            this.btnPrev.style.display = 'none';
            this.btnPrev.dataset.visible = 'hidden';
        }
        else {
            this.btnPrev.style.display = 'block';
            this.btnPrev.dataset.visible = 'show';
        }

        if (this.count === this.length) {
            this.btnNext.style.display = 'none';
            this.btnNext.dataset.visible = 'hidden';
        }
        else {
            this.btnNext.style.display = 'block';
            this.btnNext.dataset.visible = 'show';
        }
    }

    return Winswitcher;
})(this, this.document);

(function (window, document, undefined) {
    var isPlay = false;
    var port = chrome.extension.connect({name: 'fm'});

    var title = player.querySelector('h1');
    var artist = player.querySelector('p');
    var progress = player.querySelector('header div');
    var soundCtr = player.querySelector('input[type=range]');

    var channelCurrent = 0;

    var trueList = list.querySelector('section');

    var winswitcher = new Winswitcher();

    css();
    window.addEventListener('resize', css, false);

    function css() {
        player.style.width = innerWidth + 'px';
        channel.style.width = innerWidth + 'px';
        list.style.width = innerWidth + 'px';
    }

    if (localStorage.albumfm) {
        channelList.push({t: '专辑兆赫', v: -2, title: JSON.parse(localStorage.albumfm).title});
    }
    channelCurrent = Number(localStorage.channel);
    channelOrient(channelCurrent, channelList);

    port.postMessage({cmd: 'get'});

    port.onMessage.addListener(function (msg) {
        switch (msg.cmd) {
        case 'progress':
            progress.style.width = msg.time / msg.length * window.innerWidth + 'px';
            progress.title = strftime(msg.time) + '/' + strftime(msg.length);
            if (msg.lrc) {
                lrc.innerHTML = msg.lrc;
            }
            break;
        case 'set':
            title.innerHTML = msg.title;
            artist.innerHTML = msg.artist + ' | ' + msg.albumtitle;
            doubanlink.href = msg.album;
            progress.title = strftime(msg.time) + '/' + strftime(msg.length);
            progress.style.width = msg.time / msg.length * 275 + 'px';
            player.style.backgroundImage = 'url('+ msg.picture +')';
            channel.style.backgroundImage = 'url('+ msg.picture +')';
            list.style.backgroundImage = 'url('+ msg.picture +')';
            soundCtr.value = msg.volume * 100;
            if (msg.like === '1') {love.className = 'on';}
            else {love.className = '';}
            if (msg.isRepeat) {repeat.className = 'on';}
            else {repeat.className = '';}
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

            listFlush(msg.list, Number(msg.current));
            break;
        case 'canplaythrough':
            if (msg.status) {
                loading.style.display = 'none';
            }
            else {
                loading.style.display = 'block';
                progress.style.width = 0;
                lrc.innerHTML = '';
            }
            break;
        case 'error':
            alert('您当前网速很慢', message);
            break;
        case 'channel':
            if (msg.channel) {
                var c = channel.querySelector('.active');
                if (c) {c.className = ''}
                if (msg.channel.title && channel.querySelectorAll('p').length === 3) {
                    channelList.push(msg.channel);
                }
                channelCurrent = msg.channel.v;
                channelOrient(channelCurrent, channelList);
                winswitcher.moveTo(2);
                alert('切换至 ' + (msg.channel.title ? msg.channel.title : msg.channel.t), message);
            }
            else {
                oauth.style.top = 0;
            }
            break;
        }
    });


    progress.parentNode.addEventListener('click', function (e) {
        port.postMessage({cmd: 'skip', rate: e.offsetX/275});
    }, false);

    player.addEventListener('contextmenu', function (e) {
        if (isPlay) {
            play.style.backgroundImage = 'url(../assets/play.png)';
        }
        else {
            play.style.backgroundImage = 'url(../assets/pause.png)';
        }
        isPlay = !isPlay;
        port.postMessage({cmd: 'switch', isPlay: isPlay});
        e.preventDefault();
    }, false);

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

    document.body.addEventListener('keyup', function (e) {
        switch (e.keyCode) {
        case 37:
            port.postMessage({cmd: 'prev'});
            break;
        case 38:
            break;
        case 39:
            port.postMessage({cmd: 'next'});
        case 40:
            break;
        case 32:
            if (isPlay) {
                play.style.backgroundImage = 'url(../assets/play.png)';
            }
            else {
                play.style.backgroundImage = 'url(../assets/pause.png)';
            }
            isPlay = !isPlay;
            port.postMessage({cmd: 'switch', isPlay: isPlay});
            break;
        }
    });

    document.body.addEventListener('keydown', function (e) {
        switch (e.keyCode) {
        case 38:
            soundCtr.value += 5;
            port.postMessage({cmd: 'volume', value: soundCtr.value});
            break;
        case 40:
            soundCtr.value -= 5;
            port.postMessage({cmd: 'volume', value: soundCtr.value});
            break;
        case 9:
            e.preventDefault();
            break;
        }
    });

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



    delegate(channel, 'p', 'click', function () {
        if (!this.dataset.cascade) {
            channelFlush(channelList);
        }
        else {
            var cascade = this.dataset.cascade.split('|'), i, len, obj;
            obj = channelList[cascade[0]];
            for (i = 1, len = cascade.length ; i < len ; i += 1) {
                obj = obj.sub[cascade[i]];
            }
            if (obj.sub) {
                channelFlush(obj.sub, this.dataset.cascade);
            }
            else if (obj.v !== channelCurrent) {
                port.postMessage({cmd: 'channel', channel: obj});
            }
        }
    });

    oauth.querySelector('a').addEventListener('click', function (e) {
        window.open('http://douban.fm/');
        oauth.style.top = '100%';
        e.preventDefault();
    }, false);

    oauth.querySelectorAll('a')[1].addEventListener('click', function (e) {
        oauth.style.top = '100%';
        e.preventDefault();
    }, false);

    function channelFlush(data, cascade) {
        var i, len, html = '', p;
        channel.innerHTML = '';
        for (i = 0, len = data.length ; i < len ; i += 1) {
            p = document.createElement('p');
            p.dataset.cascade = cascade ? cascade + '|' + i : i;
            if (data[i].v !== undefined && data[i].v === channelCurrent) {p.className = 'active';}
            p.innerHTML = data[i].t;
            channel.appendChild(p);
            (function () {
                var pp = p;
                setTimeout(function () {
                    pp.style.opacity = 1;
                }, i*50);
            })();
        }
        if (cascade) {
            p = document.createElement('p');
            p.dataset.cascade = cascade.slice(0, -2);
            p.className = 'nav';
            p.innerHTML = '上一层';
            channel.appendChild(p);
            (function () {
                var pp = p;
                setTimeout(function () {
                    pp.style.opacity = 1;
                }, i*50);
            })();
        }
    }

    function channelOrient(v, list, index) {
        for (var i = 0, len = list.length ; i < len ; i += 1) {
            if (list[i].v === v) {
                channelFlush(list, index);
                return index ? index + '|' + i : i.toString();
            }

            if (list[i].sub) {
                var res = channelOrient(v, list[i].sub, index ? index + '|' + i : i.toString());
                if (res) {
                    return res;
                }
            }
        }
        return false;
    }

    delegate(list, 'p', 'click', function () {
        if (this.className !== 'active') {
            port.postMessage({cmd: 'index', index: Number(this.dataset.index)});
            winswitcher.prev();
        }
    });

    list.addEventListener('mousewheel', function (e) {
        var matrix = new WebKitCSSMatrix(window.getComputedStyle(trueList).webkitTransform);
        trueList.style.webkitTransform = matrix.translate(0, e.wheelDelta);
    }, false);

    trueList.addEventListener('webkitTransitionEnd', function (e) {
        var matrix = new WebKitCSSMatrix(window.getComputedStyle(trueList).webkitTransform),
            height = trueList.scrollHeight - window.innerHeight;
        if (height < 0) {height = 0;}
        if (matrix.f > 0) {
            trueList.style.webkitTransform = 'translate(0, 0)';
        }
        if (matrix.f < -height) {
            trueList.style.webkitTransform = 'translate(0, -'+height+'px)';
        }
    }, false);


    function listFlush(playList, current) {
        var i = 0,
        len = playList.length,
        p;
        trueList.innerHTML = '';
        for (; i < len ; i += 1) {
            p = document.createElement('p');
            p.dataset.index = i;
            if (current === i) {p.className = 'active';}
            p.innerHTML = playList[i].title + ' - ' + playList[i].artist;
            trueList.appendChild(p);
        }
        var offset = (current+1) * p.offsetHeight - window.innerHeight / 2;
        trueList.style.webkitTransform = 'translate(0, -'+offset+'px)';
    }


    function alert(msg, node) {
        node.innerHTML = msg;
        node.style.opacity = '1';
        setTimeout(function () {
            node.style.opacity = '0';
        }, 5000);
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
    }

})(this, this.document);
