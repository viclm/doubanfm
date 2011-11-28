(function (window, document, undefined) {
    var isPlay = false;
    var timer = null;
    var port = chrome.extension.connect({name: 'fm'});
    var title = player.querySelector('h1');
    var artist = player.querySelector('p');
    var progress = player.querySelector('header div');
    var soundCtr = player.querySelector('input[type=range]');
    var channelCurrent = 0;
    var channelTo;


    function S(args) {

        this.$super.constructor.call(this, args);

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

    extend(S, Slideshow);

    S.prototype.moveTo = function (index) {
        var res = this.$super.moveTo.call(this, index);
        if (res > -1) {
            this.slide.style.left = -(res-1)*100+'%';
            this.setNav();
        }
    };

    S.prototype.setNav = function () {
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

    var slideshow = new S();


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

            channelCurrent = Number(localStorage.channel);
            channelOrient(channelCurrent, channelList);
            listFlush(msg.list, Number(msg.current));
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
        case 'channel':
            if (msg.channel) {
                var c = channel.querySelector('.active');
                if (c) {c.className = ''}
                channelCurrent = msg.channel.v;
                //localStorage.channel = channelCurrent;
                this.className = 'active';
                slideshow.next();
                msg.innerHTML = '切换至 ' + msg.channel.t;
                msg.style.display = 'block';
                setTimeout(function () {
                    msg.style.display = 'none';
                }, 5000);
            }
            else {
                oauth.style.top = 0;
            }
            break;
        case 'error':
            error.style.top = 0;
            break;
        }
    });

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
                }, i*100);
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
                }, i*100);
            })();
        }
    }

    function channelOrient(v, list, index) {
        for (var i = 0, len = list.length ; i < len ; i += 1) {
            if (list[i].v === v) {
                channelFlush(list, index);
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

    delegate(list, 'p', 'click', function () {
        if (this.className !== 'active') {
            port.postMessage({cmd: 'index', index: Number(this.dataset.index)});
        }
    });


    function listFlush(playList, current) {
        var i = current - 5 < 0 ? 0 : current - 5,
        len = current + 6 > playList.length ? playList.length : current + 6,
        p,
        j = 0;
        list.innerHTML = '';
        for (; i < len ; i += 1) {
            p = document.createElement('p');
            p.dataset.index = i;
            if (current === i) {p.className = 'active';}
            p.innerHTML = playList[i].title + ' - ' + playList[i].artist;
            list.appendChild(p);
            j++;
            (function () {
                var pp = p;
                setTimeout(function () {
                    pp.style.opacity = 1;
                }, j*100);
            })();
        }
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

    function extend(childCtor, parentCtor) {
        function tempCtor() {};
        tempCtor.prototype = parentCtor.prototype;
        childCtor.prototype = new tempCtor();
        childCtor.prototype.$super = parentCtor.prototype;
        childCtor.prototype.constructor = childCtor;
    }

    function ajax(method, url, data, success, error, timeout) {
        var client = new XMLHttpRequest(), isTimeout = false;
        method = method.toLowerCase();
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
        client.onerror = function () {
            error(client)
        }
        client.open(method, url, true);
        if (method === 'post') {client.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');}
        client.setRequestHeader('ajax', 'true');
        client.send(data);
        setTimeout(function () {isTimeout = true;}, timeout || 2000);
    };
})(this, this.document);
