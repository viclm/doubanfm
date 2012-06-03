var Winswitcher = (function (window, document, undefined) {
    function Winswitcher(args) {

        this.superclass.constructor.call(this, args);

        this.slide = document.querySelector('body > div');
        this.btnPrev = left;
        this.btnNext = right;
        this.count = 1;
        this.length = 2;

        var self = this;

        var hover = false;

        this.btnPrev.addEventListener('mouseover', function (e) {
            hover = true;
            setTimeout(function () {
                if (hover) {self.prev();}
            }, 500);
        }, false);

        this.btnPrev.addEventListener('mouseout', function (e) {
            hover = false;
        }, false);

        this.btnNext.addEventListener('mouseover', function (e) {
            hover = true;
            setTimeout(function () {
                if (hover) {self.next();}
            }, 500);
        }, false);

        this.btnNext.addEventListener('mouseout', function (e) {
            hover = false;
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

    extend(Winswitcher, Slideshow);

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



    var winswitcher = new Winswitcher();

    css();
    window.addEventListener('resize', css, false);

    function css() {
        player.style.width = innerWidth + 'px';
        list.style.width = innerWidth + 'px';
        //player.querySelector('section').style.height = innerHeight + 'px';
    }

    var PlayerUI = Class({

        init: function () {

            var self = this;

            this.isPlay = false;

            this.port = chrome.extension.connect({name: 'fm'});
            this.port.postMessage({cmd: 'get'});
            this.port.onMessage.addListener(function (msg) {
                switch (msg.cmd) {
                case 'progress':
                    self.onProgress(msg);
                    break;
                case 'set':
                    self.onSet(msg);
                    break;
                case 'canplaythrough':
                    self.onCanplaythrough(msg);
                    break;
                case 'error':
                    //alert('您当前网速很慢', message);
                    break;
                case 'channel':
                    self.onChannel(msg)
                    break;
                }
            });


            this.player = $('#player');
            this.list = $('#list');

            this.progress = this.player.find('header progress');
            this.title = this.player.find('header h1');
            this.artist = this.player.find('header p');
            this.doubanlink = $('#doubanlink');
            this.channel = $('#message');
            this.play = $('#play');
            this.love = $('#love');
            this.repeat = $('#repeat');
            this.soundCtr = this.player.find('input[type=range]');
            this.loading = $('#loading');
            this.oauth = $('#oauth');

            this.player.click(function () {
                window.open(doubanlink.href);
            });

            this.player.find('header, section, footer').click(function (e) {
                e.stopPropagation();
            });

            this.progress.parent().click(function (e) {
                self.port.postMessage({cmd: 'skip', rate: e.offsetX/275});
            }, false);

            this.play.bind('click', function (e) {
                self.switch();
                e.preventDefault();
            }, false);

            this.player.bind('contextmenu', function (e) {
                self.switch();
                e.preventDefault();
            }, false);

            this.player
            .mouseover(function (e) {
                self.channel.css('opacity', 1);
            }).mouseout(function () {
                self.channel.css('opacity', 0);
            });

            this.player.find('#prev').click(function (e) {
                self.port.postMessage({cmd: 'prev'});
                e.preventDefault();
            }, false);

            this.player.find('#next').click(function (e) {
                self.port.postMessage({cmd: 'next'});
                e.preventDefault();
            }, false);

            this.player.find('#sound').click(function (e) {
                self.soundCtr.toggle();
                e.preventDefault();
            }, false);

            this.soundCtr.bind('change', function (e) {
                self.port.postMessage({cmd: 'volume', value: e.target.value});
            }, false);

            this.player.find('#repeat').click(function (e) {
                if (this.className === 'on') {
                    this.className = '';
                    self.port.postMessage({cmd: 'repeat', status: false});
                }
                else {
                    this.className = 'on';
                    self.port.postMessage({cmd: 'repeat', status: true});
                }
                e.preventDefault();
            }, false);

            this.player.find('#love').click(function (e) {
                if (this.className === 'on') {
                    this.className = '';
                    self.port.postMessage({cmd: 'love', status: false});
                }
                else {
                    this.className = 'on';
                    self.port.postMessage({cmd: 'love', status: true});
                }
                e.preventDefault();
            }, false);

            this.player.find('#trash').click(function (e) {
                e.preventDefault();
                self.port.postMessage({cmd: 'trash'});
            }, false);


            $(document).keyup(function (e) {
                switch (e.keyCode) {
                case 37:
                    self.port.postMessage({cmd: 'prev'});
                    break;
                case 38:
                    self.soundCtr.val(self.soundCtr.val() + 5);
                    self.port.postMessage({cmd: 'volume', value: self.soundCtr.val()});
                    break;
                case 39:
                    self.port.postMessage({cmd: 'next'});
                    break;
                case 40:
                    self.soundCtr.val(self.soundCtr.val() - 5);
                    self.port.postMessage({cmd: 'volume', value: self.soundCtr.val()});
                    break;
                case 32:
                    self.switch();
                    break;
                case 9:
                    e.preventDefault();
                    break;
                }
            });


            this.channelInit();

            this.channel.change(function (e) {
                self.port.postMessage({cmd: 'channel', channel: Number(e.target.value)});
            });

            this.list.delegate('p', 'click', function () {
                if (this.className !== 'active') {
                    self.port.postMessage({cmd: 'index', index: Number(this.dataset.index)});
                    winswitcher.prev();
                }
            });

            this.list.bind('mousewheel', function (e) {
                var trueList = self.list.find('section')[0];
                var top = parseInt(getComputedStyle(trueList).getPropertyValue('top'), 10) + (e.wheelDelta>0?1:-1)*window.innerHeight/5;
                var height = trueList.scrollHeight - window.innerHeight;
                if (height <= 0) {return;}
                if (top > 0) {top = 0;}
                else if (top < -height) {top = -height;}
                trueList.style.top = top + 'px'
            }, false);

            this.oauth.find('a').click(function (e) {
                if (e.target.innerHTML === '确定') {
                    window.open('http://douban.fm/');
                }
                self.oauth.css('top', '100%');
                e.preventDefault();
            });
        },

        switch: function () {
            var self = this;
            this.isPlay = !this.isPlay;
            if (this.isPlay) {
                this.play.css('backgroundImage', 'url(../assets/pause.png)');
            }
            else {
                this.play.css('backgroundImage', 'url(../assets/play.png)');
            }
            this.port.postMessage({cmd: 'switch', isPlay: self.isPlay});
        },

        onProgress: function (msg) {
            this.progress.val(msg.time / msg.length * 100);
            if (msg.lrc) {
                lrc.innerHTML = msg.lrc;
            }
        },

        onSet: function (msg) {
            var self = this;
            this.title.html(msg.title);
            this.artist.html(msg.artist + ' | ' + msg.albumtitle);
            this.doubanlink.attr('href', msg.album);
            this.progress.val(msg.length ? msg.time / msg.length * 100 : 0);
            this.player.css('backgroundImage', 'url('+ msg.picture +')');
            this.list.css('backgroundImage', 'url('+ msg.picture +')');
            this.soundCtr.val(msg.volume * 100);
            if (msg.like === '1') {love.className = 'on';}
            else {love.className = '';}
            if (msg.isRepeat) {repeat.className = 'on';}
            else {repeat.className = '';}
            this.isPlay = msg.isPlay;
            if (this.isPlay) {
                this.play.css('backgroundImage', 'url(../assets/pause.png)');
            }
            else {
                this.play.css('backgroundImage', 'url(../assets/play.png)');
            }

            if (!msg.canplaythrough){
                this.loading.show();
            }

            this.channel.val(msg.channel);
            this.channel.css('opacity', 1);
            setTimeout(function () {
                self.channel.css('opacity', 0);
            }, 3000);

            this.listUpdate(msg.list, Number(msg.current));
        },

        progress: function () {
        },

        onCanplaythrough: function (msg) {
            this.progress.val(0);
            if (msg.status) {
                lrc.innerHTML = '';
            }
            else {
                lrc.innerHTML = '加载中...';
            }
        },

        onChannel: function (msg) {
            var self = this;
            if (typeof msg.channel !== 'undefined') {
                this.channel.val(msg.channel);
                this.channel.css('opacity', 1);
                setTimeout(function () {
                    self.channel.css('opacity', 0);
                }, 3000);
            }
            else {
                this.oauth.css('top', '0');
            }
        },

        channelInit: function () {
            for (var i = 0, len = channelList.length, p ; i < len ; i += 1) {
                p = $('<option>');
                p.attr('value', channelList[i].channel_id);
                p.html(channelList[i].name);
                this.channel.append(p);
            }
            this.channel.val(localStorage.channel)
        },

        listUpdate: function(playList, current) {
            var i = 0,
            len = playList.length,
            p,
            trueList = this.list.find('section')[0];
            trueList.innerHTML = '';
            for (; i < len ; i += 1) {
                p = document.createElement('p');
                p.dataset.index = i;
                if (current === i) {p.className = 'active';}
                p.innerHTML = playList[i].title + ' - ' + playList[i].artist;
                trueList.appendChild(p);
            }
            var offset = (current+1) * p.offsetHeight - window.innerHeight / 2;
            if (offset < 0) {offset = 0;}
            trueList.style.top = -offset+'px';
        },

        alert: function(msg) {
            var node = message;
            node.innerHTML = msg;
            node.style.opacity = '1';
            setTimeout(function () {
                node.style.opacity = '0';
            }, 5000);
        }

    });

    new PlayerUI();



    function strftime(seconds) {
        var minutes = Math.floor(seconds / 60), seconds = seconds % 60, str;
        str = (minutes > 9 ? minutes : '0' + minutes) + ':' + (seconds > 9 ? seconds : '0' + seconds);
        return str;
    };

})(this, this.document);
