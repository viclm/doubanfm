localStorage.channel || (localStorage.channel = '1');
localStorage.notify || (localStorage.notify = '1');
localStorage.lrc || (localStorage.lrc = '1');
localStorage.pin || (localStorage.pin = '0');
localStorage.volume || (localStorage.volume = '100');

var dfm = {};

dfm.Song = Backbone.Model.extend({

    initialize: function () {},

    getLrc: function () {
        var self = this;
        $.ajax({
            type: 'get',
            url: 'http://openapi.baidu.com/public/2.0/mp3/info/suggestion',
            data: 'format=json&word='+encodeURIComponent(self.get('title').replace(/\(.+\)$/, ''))+'&callback=?',
            dataType: 'text',
            success: function (data) {
                data = JSON.parse(data.slice(1, -2)).song;
                if (!data) {return;}
                for (var i = 0, len = data.length ; i < len ; i += 1) {
                    if (self.get('artist').toLowerCase().indexOf(data[i].artistname.toLowerCase()) > -1) {
                        $.ajax({
                            url: 'http://ting.baidu.com/data/music/songlink',
                            data: 'type=mp3&speed=&songIds=' + data[i].songid,
                            dataType: 'json',
                            success: function (data) {
                                var song = data.data.songList[0];
                                if (song) {
                                    $.get('http://ting.baidu.com'+song.lrcLink, function (client) {
                                        self.set({lrc: self.parseLrc(client)});
                                    });
                                }
                            }
                        });
                        break;
                    }
                }
            }
        });
    },

    parseLrc: function (lrc) {
        lrc = lrc.split('\n');
        var filter = /^((?:\[[\d.:]+?\])+?)([^\[\]]*)$/,
        nLrc = {};

        for (var i = 0, len = lrc.length, res, time ; i < len ; i += 1) {
            res = lrc[i].match(filter);
            if (res) {
                time = res[1].slice(1, -1).split('][');
                for (var j = 0, jLen = time.length, tmp ; j < jLen ; j += 1) {
                    tmp = time[j].split(':');
                    nLrc[Number(tmp[0])*60+Math.round(tmp[1])] = res[2];
                }
            }
        }
        return nLrc;
    }


});

dfm.PlayList = Backbone.Collection.extend({

    model: dfm.Song,

    url: 'http://douban.fm/j/mine/playlist',

    parse: function (response) {
        var songs = [];
        if (response.song) {
            response.song.forEach(function (song) {
                if (/^\d+$/.test(song.sid)) {
                    song.picture = song.picture.replace('mpic', 'lpic');
                    //song.url = 'http://otho.douban.com/view/song/small/p'+song.sid+'.mp3';
                    song.album = 'http://music.douban.com' + song.album;
                    songs.push(song);
                }
            });
        }
        return songs;
    }

});

dfm.Player = Backbone.View.extend({

    tagName: 'audio',
    attributes: {
        preload: 'auto'
    },
    p: null,
    playList: [],
    current: 0,
    canplaythrough: false,
    isPlay: true,
    isRepeat: false,
    time: 0,
    notify: null,

    initialize: function () {
        this.playList = new dfm.PlayList();
        this.notify = this.notifyInit();
        if (localStorage.pin === '0') {
            chrome.browserAction.setPopup({popup: '../partials/popup.html'});
        }
        else {
            chrome.browserAction.onClicked.addListener(function(tab) {
                if (this.p) {
                    chrome.windows.update(this.p.sender.tab.windowId, {focused: true});
                }
                else {
                    chrome.windows.create({
                        width: 275,
                        height: 275,
                        url: '../partials/popup.html',
                        type: 'popup'
                    });
                }
            }.bind(this));
        }

        chrome.extension.onConnect.addListener(function(port) {
            if (port.name === 'fm') {
                if (this.p && this.notify.isVisible()) {
                    this.notify.hide();
                }
                setTimeout(function () {this.p = port;}.bind(this), 100);

                port.onDisconnect.addListener(function (port) {
                    if (port.name === 'fm') {
                        this.p = null;
                    }
                }.bind(this));

                port.onMessage.addListener(function (msg, port) {
                    var self = this;
                    switch (msg.cmd) {
                    case 'event':
                        if (this.notify.isVisible()) {
                            if (msg.type === 'mouseover') {
                                this.notify.clear();
                            }
                            else {
                                //this.notify.timer();
                            }
                        }
                        break;
                    case 'skip':
                        this.el.currentTime = this.el.duration * msg.rate;
                        break;
                    case 'play':
                        this.isPlay = msg.value;
                        if (msg.value) {
                            chrome.browserAction.setIcon({path: '../img/icon_small.png'});
                            if (this.playList.length) {
                                this.el.play();
                            }
                        }
                        else {
                            chrome.browserAction.setIcon({path: '../img/icon_small_pause.png'});
                            this.el.pause();
                        }
                        break;
                    case 'next':
                        if (this.playList.at(this.current + 1)) {
                            this.current += 1;
                            this.el.src = this.playList.at(this.current).get('url');
                            if (this.isPlay) {this.el.play();}
                            this.time = 0;
                            port.postMessage(this.getCurrentSongInfo());
                        }
                        else {
                            this.fetchSongs('s', function () {
                                self.current += 1;
                                self.el.src = self.playList.at(self.current).get('url');
                                if (self.isPlay) {self.el.play();}
                                self.time = 0;
                                port.postMessage(self.getCurrentSongInfo());
                            });
                        }
                        break;
                    case 'prev':
                        if (this.current) {
                            this.current -= 1;
                            this.el.src = this.playList.at(this.current).get('url');
                            if (this.isPlay) {this.el.play();}
                        }
                        port.postMessage(this.getCurrentSongInfo());
                        break;
                    case 'index':
                        this.current = msg.index;
                        this.el.src = this.playList.at(this.current).get('url');
                        if (this.isPlay) {this.el.play();}
                        port.postMessage(this.getCurrentSongInfo());
                        break;
                    case 'volume':
                        this.el.volume = msg.value / 100;
                        localStorage.volume = msg.value;
                        break;
                    case 'repeat':
                        this.isRepeat = msg.value;
                        break;
                    case 'like':
                        var type, song = this.playList.at(this.current);
                        if (msg.value) {
                            type = 'r';
                            song.set({like: 1});
                        }
                        else {
                            type = 'u';
                            song.set({like: 0});
                        }
                        this.fetchSongs(type);
                        break;
                    case 'trash':
                        var f = false;
                        this.fetchSongs('b', function (playList) {
                            if (f) {
                                self.current += 1;
                                self.el.src = self.playList.at(self.current).get('url');
                                if (self.isPlay) {self.el.play();}
                                self.time = 0;
                                port.postMessage(self.getCurrentSongInfo());
                            }
                        });
                        this.playList.remove(this.playList.at(this.current));
                        if (this.playList.at(this.current)) {
                            this.el.src = this.playList.at(this.current).get('url');
                            this.el.play();
                            port.postMessage(this.getCurrentSongInfo());
                        }
                        else {
                            this.current -= 1;
                            f = true;
                        }
                        break;
                    case 'get':
                        if (this.playList.length) {
                            port.postMessage(this.getCurrentSongInfo());
                        }
                        else {
                            this.fetchSongs('n', function (loginNeeded) {
                                var self = this;
                                if (loginNeeded) {
                                    port.postMessage({cmd: 'oauth', type: loginNeeded});
                                }
                                else {
                                    this.el.src = this.playList.at(0).get('url');
                                    if (this.isPlay) {
                                        this.el.volume = Number(localStorage.volume) / 100;
                                        this.el.play();
                                        chrome.browserAction.setIcon({path: '../img/icon_small.png'});
                                    }
                                    port.postMessage(this.getCurrentSongInfo());
                                }
                            }.bind(this));
                        }
                        break;
                    case 'channel':
                        this.playList.remove(this.playList.models.slice(this.current + 1));
                        this.fetchSongs('n', function (loginNeeded) {
                            var self = this;
                            if (loginNeeded) {
                                port.postMessage({cmd: 'oauth', type: loginNeeded});
                            }
                            else {
                                this.current += 1;
                                this.el.src = this.playList.at(this.current).get('url');
                                if (this.isPlay) {
                                    this.el.volume = Number(localStorage.volume) / 100;
                                    this.el.play();
                                }
                                localStorage.channel = msg.value;
                                port.postMessage(this.getCurrentSongInfo());
                            }
                        }.bind(this));
                        break;
                    }
                }.bind(this));
            }
        }.bind(this));
    },

    events: {
        'loadstart': 'onloadstart',
        'canplaythrough': 'oncanplaythrough',
        'timeupdate': 'ontimeupdate',
        'ended': 'onended',
        'error': 'onerror',
        'stalled': 'onstalled'
    },

    notifyInit: function () {
        var notify, visible = false, timer = null, self = this;
        return {
            show: function () {
                notify = localStorage.notifyStyle === '1' ? window.webkitNotifications.createNotification(
        self.playList.at(self.current).get('picture'), self.playList.at(self.current).get('title'), self.playList.at(self.current).get('artist')) : webkitNotifications.createHTMLNotification('../pages/popup.html');
                notify.show();
                visible = true;
                this.timer();
            },
            hide: function () {
                notify.cancel();
                visible = false;
            },
            timer: function () {
                timer = setTimeout(function () {
                    this.hide();
                    timer = null;
                }.bind(this), 5000);
            },
            clear: function () {
                clearTimeout(timer);
                timer = null;
            },
            isVisible: function () {
                return visible;
            }
        }
    },

    onloadstart: function () {
        this.canplaythrough = false;
        this.time = 0;
        this.p && this.p.postMessage({cmd: 'canplaythrough', status: false});
    },

    oncanplaythrough: function () {
        var song = this.playList.at(this.current);
        this.canplaythrough = true;
        this.p && this.p.postMessage({cmd: 'canplaythrough', status: true});
        if (localStorage.lrc === '1' && !song.get('lrc')) {
            song.getLrc();
        }
        if (localStorage.notify === '1') {
            if (!this.p) {
                this.notify.show();
            }
        }
        chrome.browserAction.setTitle({title: song.get('title')+'-'+song.get('artist')});
        if (!this.playList.at(this.current + 1)) {
            this.fetchSongs('p', function () {
                this.p && this.p.postMessage(this.getCurrentSongInfo());
            }.bind(this));
        }
    },

    ontimeupdate: function () {
        var currentTime = Math.round(this.el.currentTime), lrc, msg;
        if (currentTime !== this.time) {
            this.time = currentTime;
            if(this.p) {
                lrc = this.playList.at(this.current).get('lrc');
                msg = {cmd: 'progress', time: currentTime};
                msg.length = Math.round(this.el.duration);
                if(lrc && lrc[currentTime]) {
                    msg.lrc = lrc[currentTime];
                }
                this.p.postMessage(msg);
            }
        }
    },

    onended: function () {
        var self = this;
        if (!this.isRepeat) {
            this.fetchSongs('e');
            if (this.playList.at(this.current + 1)) {
                this.current += 1;
                this.el.src = this.playList.at(this.current).get('url');
            }
            else {
                this.fetchSongs('p', function () {
                    self.current += 1;
                    self.el.src = playList.at(self.current).get('url');
                    if (self.isPlay) {self.el.play();}
                    self.time = 0;
                    self.p && self.p.postMessage(self.getCurrentSongInfo());
                });
            }
        }
        this.time = 0;
        this.el.play();
        this.p && this.p.postMessage(this.getCurrentSongInfo());
    },

    onerror: function () {
        console.log('error');
        this.playList.remove(this.playList.models.slice(this.current + 1));
        this.fetchSongs('n', function (loginNeeded) {
            var self = this;
            if (loginNeeded) {
                port.postMessage({cmd: 'oauth', type: loginNeeded});
            }
            else {
                this.playList.remove(this.playList.at(this.current));
                this.el.src = this.playList.at(this.current).get('url');
                if (this.isPlay) {
                    this.el.volume = Number(localStorage.volume) / 100;
                    this.el.play();
                }
                this.p && this.p.postMessage(this.getCurrentSongInfo());
            }
        }.bind(this));
    },

    onstalled: function() {
        if (isNaN(this.el.duration)) {
            var song = this.playList.at(this.current),
                stalledCount = song.get('stalledCount') || 0;
            stalledCount += 1;
            console.log('wo ca', stalledCount)
            if (stalledCount > 3) {
                this.onerror();
                return;
            }
            song.set({stalledCount: stalledCount});
            this.el.load();
            if (this.isPlay) {
                this.el.play();
            }
        }
    },

    getCurrentSongInfo: function () {
        var info = this.playList.at(this.current).toJSON();
        info.cmd = 'set';
        info.time = this.time;
        info.length = Math.floor(this.el.duration);
        info.isPlay = this.isPlay;
        info.isRepeat = this.isRepeat;
        info.volume = this.el.volume;
        info.canplaythrough = this.canplaythrough;
        info.current = this.current;
        info.list = this.playList.toJSON();
        return info;
    },

    fetchSongs: function (type, fn) {
        var channel = Number(localStorage.channel),
            fetch = function () {
                var data = 'type='+type+'&channel='+channel+'&from=mainsite&r='+self.rand();
                if (type !== 'n') {
                    data += '&sid='+self.playList.at(self.current).get('sid');
                }
                self.playList.fetch({
                    add: true,
                    data: data,
                    dataType: 'json',
                    success: function () {
                        if (fn) {fn();}
                    },
                    error: function (client) {
                        if (self.p) {self.p.postMessage({cmd: 'error'})}
                    }
                });
            },
            self = this;

        if (isNaN(channel)) {
            localStorage.channel = channel = 1;
        }
        if (channel < 1) {
            chrome.cookies.get({
                url: 'http://douban.com',
                name: 'dbcl2'
            }, function (c) {
                if (c === null) {
                    chrome.cookies.remove({
                            url: 'http://douban.fm',
                            name: 'dbcl2'
                        },
                        function () {
                        chrome.cookies.get({
                            url: 'http://douban.fm',
                            name: 'dbcl2'
                        }, function (c) {console.log(c, 'fm')
                            if (c) {
                                fetch();
                            }
                            else {
                                if (fn) {fn(true);}
                            }
                        });
                    })
                }
                else {
                    chrome.cookies.get({
                        url: 'http://douban.fm',
                        name: 'dbcl2'
                    }, function (c) {
                        if (c) {
                            fetch();
                        }
                        else {
                            if (fn) {fn(true);}
                        }
                    });
                }
            });
        }
        else {
            fetch();
        }
    },

    rand: function () {
        var charset = '1234567890abcdef', str = '', i;
        for (i = 0 ; i < 10 ; i += 1) {
            str += charset.charAt(Math.floor(Math.random() * 16));
        }
        return str;
    }

});

new dfm.Player;
