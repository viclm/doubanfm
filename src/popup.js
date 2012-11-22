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

dfm.Player = Backbone.View.extend({

    el: 'body',

    isPlay: false,

    initialize: function () {

        this.player = $('#player');
        this.list = $('#list');
        this.progress = this.player.find('header progress');
        this.title = this.player.find('header h1');
        this.artist = this.player.find('header p');
        this.doubanlink = this.player.find('section a');
        this.message = this.player.find('section p')
        this.channel = this.player.find('select');
        this.play = $('#play');
        this.prev = $('#prev');
        this.next = $('#next');
        this.love = $('#love');
        this.trash = $('#trash');
        this.sound = $('#sound');
        this.repeat = $('#repeat');
        this.soundCtr = this.player.find('footer input[type=range]');
        this.oauth = $('#oauth');

        for (var i = 0, len = channelList.length, p ; i < len ; i += 1) {
            p = $('<option>');
            p.attr('value', channelList[i].channel_id);
            p.html(channelList[i].name);
            this.channel.append(p);
        }
        this.channel.val(localStorage.channel);

        this.winswitcher = new dfm.Winswitcher();

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
        this.player.css('backgroundImage', 'url('+ msg.picture +')');
        this.list.css('backgroundImage', 'url('+ msg.picture +')');
        this.progress.val(msg.length ? msg.time / msg.length * 100 : 0);
        this.progress.attr('title', this.strftime(msg.time));
        this.title.html(msg.title);
        this.artist.html(msg.artist + ' | ' + msg.albumtitle);
        this.doubanlink.attr('href', msg.album);
        this.soundCtr.val(msg.volume * 100);
        if (msg.like) {
            this.love.addClass('on');
        }
        else {
            this.love.removeClass('on');
        }
        if (msg.isRepeat) {
            this.repeat.addClass('on');
        }
        else {
            this.repeat.removeClass('on');
        }
        if (msg.isPlay) {
            this.play.css('backgroundImage', 'url(../assets/pause.png)');
        }
        else {
            this.play.css('backgroundImage', 'url(../assets/play.png)');
        }
        this.isPlay = msg.isPlay;
        if (!msg.canplaythrough){
            this.message.text('载入中...');
        }
        this.channel.val(localStorage.channel);
        this.channel.css('opacity', 1);
        setTimeout(function () {
            this.channel.css('opacity', 0);
        }.bind(this), 3000);
        this.listUpdate(msg.list, Number(msg.current));
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

    onProgress: function (msg) {
        if (msg.length) {
            this.progress.val(msg.time / msg.length * 100);
            if (msg.lrc) {
                this.message.text(msg.lrc);
            }
        }
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

    switch: function (e) {
        var self = this;
        this.isPlay = !this.isPlay;
        if (this.isPlay) {
            this.play.css('backgroundImage', 'url(../assets/pause.png)');
        }
        else {
            this.play.css('backgroundImage', 'url(../assets/play.png)');
        }
        this.port.postMessage({cmd: 'switch', isPlay: self.isPlay});
        e.preventDefault();
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

    listUpdate: function(playList, current) {
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
    },

    strftime: function (seconds) {
        var minutes = Math.floor(seconds / 60), seconds = seconds % 60, str;
        str = (minutes > 9 ? minutes : '0' + minutes) + ':' + (seconds > 9 ? seconds : '0' + seconds);
        return str;
    }

});

new dfm.Player;
