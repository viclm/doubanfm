angular.module('player', []).
  filter('strftime', function () {
    return function(seconds) {
        var minutes = Math.floor(seconds / 60), seconds = seconds % 60, str;
        str = (minutes > 9 ? minutes : '0' + minutes) + ':' + (seconds > 9 ? seconds : '0' + seconds);
        return str;
    }
  }).
  filter('b2s', function () {
    return function (bool, str, str2) {
        return bool ? str : str2 || '';
    }
  }).
  directive('blink', function ($timeout) {
    return function (scope, element, attrs) {
        scope.$watch(attrs.blink, function (value) {
            element.css('opacity', '1');
            $timeout(function () {
                element.css('opacity', '0');
            }, 3000);
        }, true);
    }
  });

function Player($scope, $timeout) {

    $scope.song = {
        title: '正在获取歌曲，请稍候'
    };

    $scope.channel = {
        list: channelList,
        current: localStorage.channel,
        setSelected: function (c) {
            return c.channel_id == this.current;
        }
    };

    $scope.playlist = {
        setActive: function (index) {
            return index === this.current ? 'active' : '';
        }
    };

    $scope.message = '';

    var port = chrome.extension.connect({name: 'fm'});
    port.postMessage({cmd: 'get'});
    port.onMessage.addListener(function (msg) {
        $timeout(function (){});
        switch (msg.cmd) {
            case 'progress':
                if (msg.length) {
                    $scope.song.time = msg.time;
                    $scope.song.progress = msg.time / msg.length * 100;
                    if (msg.lrc) {
                        $scope.message = msg.lrc;
                    }
                }
                break;
            case 'set':console.log(msg)
                $scope.song = msg;
                $scope.song.progress = msg.length ? msg.time / msg.length * 100 : 0;
                $scope.song.source = msg.artist + ' | ' + msg.albumtitle;
                $scope.song.like = msg.like ? 'on' : '';
                $scope.song.repeat = msg.isRepeat ? 'on' : '';
                $scope.song.volume = msg.volume * 100;
                if (!msg.canplaythrough){
                    $scope.message = '载入中...';
                }
                $scope.channel.current = localStorage.channel;
                $scope.playlist.list = msg.list;
                $scope.playlist.current = Number(msg.current);
                return;
                this.isPlay = msg.isPlay;
                break;
            case 'canplaythrough':
                //this.onCanplaythrough(msg);
                break;
            case 'error':
                //this.message.text(msg.msg);
                break;
            case 'oauth':
                //this.onOauth(msg);
                break;
        }
    });

    $scope.switch = function () {
        $scope.song.isPlay = !$scope.song.isPlay;
        port.postMessage({cmd: 'switch', isPlay: $scope.song.isPlay});
    };

}
    listUpdate= function(playList, current) {
        var i = 0,
        len = playList.length,
        p,
        trueList = this.list.find('section');
        trueList.empty();
        for (; i < len ; i += 1) {
            p = document.createElement('p');
            p.dataset.index = i;
            if (current === i) {p.className = 'active';}
            p.innerHTML = playList[i].title + ' - ' + playList[i].artist;
            trueList.append(p);
        }
        var offset = (current+1) * p.offsetHeight - window.innerHeight / 2;
        if (offset < 0) {offset = 0;}
        trueList.css('top', -offset+'px');
    }

var dfm = {};

dfm.Winswitcher = function (args) {

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

extend(dfm.Winswitcher, Slideshow);

dfm.Winswitcher.prototype.moveTo = function (index) {
    var res = this.superclass.moveTo.call(this, index);
    if (res > -1) {
        this.slide.style.left = -(res-1)*100+'%';
        this.setNav();
    }
};

dfm.Winswitcher.prototype.setNav = function () {
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

new dfm.Winswitcher();
/*

dfm.Player = Backbone.View.extend({

    el: 'body',

    isPlay: false,

    initialize: function () {

        this.port = chrome.extension.connect({name: 'fm'});
        this.port.postMessage({cmd: 'get'});
        this.port.onMessage.addListener(function (msg) {
            switch (msg.cmd) {
                case 'progress':
                    this.onProgress(msg);
                    break;
                case 'set':
                    this.render(msg);
                    break;
                case 'canplaythrough':
                    this.onCanplaythrough(msg);
                    break;
                case 'error':
                    this.message.text(msg.msg);
                    break;
                case 'oauth':
                    this.onOauth(msg);
                    break;
            }
        }.bind(this));

        this.onResize();
        $(window).resize(this.onResize.bind(this));
    },

    render: function (msg) {
    },

    events: {
        'mouseover': 'onhover',
        'mouseout': 'onhover',
        'keyup': 'hotkey',
        //'contextmenu #player': 'switch',
        'click #player': 'openAlbum',
        'click progress': 'fastForward',
        'click #play': 'switch',
        'click #prev': 'onPrev',
        'click #next': 'onNext',
        'click #love': 'onLove',
        'click #trash': 'onTrash',
        'click #sound': 'onSound',
        'click #repeat': 'onRepeat',
        'change input[type=range]': 'onSoundAjust',
        'change select': 'onChannel',
        'click #list p': 'onIndex',
        'mousewheel #list': 'onscroll',
        'submit #oauth form': 'login',
        'click #oauth a': 'undoLogin'
    },

    onhover: function (e) {
        var target = document.body, r = e.relatedTarget;
        while (r && r !== target) {r = r.parentNode;}
        if (r !== target) {
            this.port.postMessage({cmd: 'event', type: e.type});
        }
    },

    onResize: function () {
        $('body').width(window.innerWidth).height(window.innerHeight);
    },



    onCanplaythrough: function (msg) {
        this.progress.val(0);
        if (msg.status) {
            this.message.text('');
        }
        else {
            this.message.text('载入中...');
        }
    },

    onOauth: function (msg) {
        var form = ('<form type="post" action="http://douban.fm/j/login">\
                <h2>登陆</h2>\
                <input type="hidden" name="souce" value="radio" />\
                <input type="hidden" name="remember" value="on" />\
                <input type="text" name="alias" placeholder="用户名" required />\
                <input type="password" name="form_password" placeholder="密码" required />\
                <input type="hidden" name="captcha_id" />\
                <input type="text" name="captcha_solution" placeholder="验证码" required />\
                <img src="" alt="" />\
                <input type="submit" value="登陆" />\
                <a href="#">取消</a>\
            </form>'), self = this;
        this.oauth.html(form);
        //var self = this, form = this.oauth.find('form').hide().eq(1);
        //form.show();
        if (localStorage.username) {
            this.oauth.find('input').eq(2).val(base64.decode(localStorage.username));
        }
        if (localStorage.password) {
            this.oauth.find('[name=form_password]').val(base64.decode(localStorage.password));
        }
        var image = new Image();
        image.onerror = function () {
            $.ajax({
                url: 'http://douban.fm/j/new_captcha',
                type: 'get',
                success: function (data) {
                    data = data.slice(1,-1);
                    self.oauth.find('[name=captcha_id]').val(data);
                    self.oauth.find('img').attr('src', 'http://douban.fm/misc/captcha?size=m&id=' + data);
                }
            });
        }
        image.src = 'http://douban.fm/j/new_captcha';
        this.oauth.show().css('top', '0');
    },

    login: function (e) {
        var form = $(e.target), mask = $('<div class="mask">登陆中...</div>').appendTo(this.oauth), self = this;
        form.find('p').remove();
        $.ajax({
            url: form.attr('action'),
            type: form.attr('type'),
            data: form.serialize(),
            dataType: 'json',
            success: function (data) {
                if (data.r === 1) {
                    if (data.err_no === 1011) {
                        $.ajax({
                            url: 'http://douban.fm/j/new_captcha',
                            type: 'get',
                            success: function (data) {
                                data = data.slice(1,-1);
                                form.find('[name=captcha_id]').val(data);
                                form.find('img').attr('src', 'http://douban.fm/misc/captcha?size=m&id=' + data).prev().val('');
                            }
                        });
                    }
                    form.append($('<p>'+data.err_msg+'</p>'));
                }
                else if (data.r === 0) {
                    chrome.cookies.get({
                        url: 'http://douban.fm',
                        name: 'dbcl2'
                    }, function (c) {console.log(c)
                        chrome.cookies.set({
                            url: 'http://douban.com',
                            name: 'dbcl2',
                            value: c.value,
                            domain: '.douban.com',
                            path: '/',
                            secure: c.secure,
                            httpOnly: c.httpOnly,
                            expirationDate: c.expirationDate,
                            storeId: c.storeId
                        });
                    });
                    localStorage.username = base64.encode(form.find('[name=alias]').val());
                    localStorage.password = base64.encode(form.find('[name=form_password]').val());
                    self.oauth.css('top', '100%');
                    self.port.postMessage({cmd: 'channel'});
                }
                mask.remove();
            },
            error: function (xhr, err) {
                console.log(xhr, err);
                mask.remove();
                self.oauth.css('top', '100%');
                self.port.postMessage({cmd: 'channel'});
            }
        });

        e.preventDefault();
    },

    undoLogin: function (e) {
        this.oauth.css('top', '100%');
        localStorage.channel = 1;
        this.port.postMessage({cmd: 'channel'});
        e.preventDefault();
    },

    openAlbum: function (e) {
        if (e.target.id === 'player') {
            window.open(this.doubanlink.attr('href'));
        }
    },

    fastForward: function (e) {
        this.port.postMessage({cmd: 'skip', rate: e.offsetX/275});
    },



    onPrev: function (e) {
        this.port.postMessage({cmd: 'prev'});
        e.preventDefault();
    },

    onNext: function (e) {
        this.port.postMessage({cmd: 'next'});
        e.preventDefault();
    },

    onSound: function (e) {
        this.soundCtr.toggle();
        e.preventDefault();
    },

    onSoundAjust: function (e) {
        this.port.postMessage({cmd: 'volume', value: e.target.value});
    },

    onRepeat: function (e) {
        if (this.repeat.hasClass('on')) {
            this.repeat.removeClass('on');
            this.port.postMessage({cmd: 'repeat', status: false});
        }
        else {
            this.repeat.addClass('on');
            this.port.postMessage({cmd: 'repeat', status: true});
        }
        e.preventDefault();
    },

    onLove: function (e) {
        if (this.love.hasClass('on')) {
            this.love.removeClass('on');
            this.port.postMessage({cmd: 'love', status: false});
        }
        else {
            this.love.addClass('on');
            this.port.postMessage({cmd: 'love', status: true});
        }
        e.preventDefault();
    },

    onTrash: function (e) {
        this.port.postMessage({cmd: 'trash'});
        e.preventDefault();
    },

    hotkey: function (e) {
        var self = this;
        switch (e.keyCode) {
            case 37:
                this.port.postMessage({cmd: 'prev'});
                break;
            case 38:
                this.soundCtr.val(this.soundCtr.val() + 5);
                this.port.postMessage({cmd: 'volume', value: self.soundCtr.val()});
                break;
            case 39:
                this.port.postMessage({cmd: 'next'});
                break;
            case 40:
                this.soundCtr.val(this.soundCtr.val() - 5);
                this.port.postMessage({cmd: 'volume', value: self.soundCtr.val()});
                break;
            case 32:
                this.switch(e);
                break;
            case 9:
                e.preventDefault();
            break;
        }
    },

    onChannel: function (e) {
        localStorage.channel = this.channel.val();
        this.port.postMessage({cmd: 'channel'});
    },

    onIndex: function (e) {
        if (this.className !== 'active') {
            this.port.postMessage({cmd: 'index', index: Number(e.target.dataset.index)});
            this.winswitcher.prev();
        }
    },

    onscroll: function (e) {
        var trueList = this.list.find('section')[0];
        var top = parseInt(getComputedStyle(trueList).getPropertyValue('top'), 10) + (e.wheelDelta>0?1:-1)*window.innerHeight/5;
        var height = trueList.scrollHeight - window.innerHeight;
        if (height <= 0) {return;}
        if (top > 0) {top = 0;}
        else if (top < -height) {top = -height;}
        trueList.style.top = top + 'px'
    },




});*/

//new dfm.Player;


