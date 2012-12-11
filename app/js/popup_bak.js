dfm.Player = Backbone.View.extend({

    el: 'body',

    isPlay: false,

    initialize: function () {
        this.onResize();
        $(window).resize(this.onResize.bind(this));
    },

    events: {
        'submit #oauth form': 'login',
        'click #oauth a': 'undoLogin'
    },

    onResize: function () {
        $('body').width(window.innerWidth).height(window.innerHeight);
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
    }
});
