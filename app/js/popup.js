var player = angular.module('player', []);

player.factory('slideshow', [function () {

    function Slideshow(opt) {
        this.slide = angular.element(document.querySelector(opt.slide));
        this.btnPrev = angular.element(document.querySelector(opt.btnPrev));
        this.btnNext = angular.element(document.querySelector(opt.btnNext));

        this.btnPrev.bind('click', this.prev.bind(this));
        this.btnNext.bind('click', this.next.bind(this));
    };

    Slideshow.prototype.prev = function () {
        if (this.slide.css('left') ===  '0px') {
            this.slide.prepend(this.slide.children().eq(1));
            this.slide.css('-webkit-transition', 'none');
            this.slide.css('left', '-100%');
        }
        this.slide[0].offsetWidth;
        this.slide.css('-webkit-transition', 'left .5s');
        this.slide.css('left', 0);
    };

    Slideshow.prototype.next = function () {
        if (this.slide.css('left') ===  '-100%') {
            this.slide.append(this.slide.children().eq(0));
            this.slide.css('-webkit-transition', 'none');
            this.slide.css('left', '0');
        }
        this.slide[0].offsetWidth;
        this.slide.css('-webkit-transition', 'left .5s');
        this.slide.css('left', '-100%');
    };

    return {
        run: function (o) {
            this.instance = new Slideshow(o);
        },
        prev: function () {
            this.instance.prev();
        },
        next: function () {
            this.instance.next();
        }
    };
}]);

player.filter('strftime', function () {
    return function(seconds) {
        var minutes = Math.floor(seconds / 60), seconds = seconds % 60, str;
        str = (minutes > 9 ? minutes : '0' + minutes) + ':' + (seconds > 9 ? seconds : '0' + seconds);
        return str;
    }
});

player.filter('b2s', function () {
    return function (bool, str, str2) {
        return bool ? str : str2 || '';
    }
});

player.directive('blink', ['$timeout', function ($timeout) {
    return function (scope, element, attrs) {
        scope.$watch(attrs.blink, function (value) {
            element.addClass('show');
            $timeout(function () {
                element.removeClass('show');
            }, 3000);
        }, true);
    }
}]);

['mousewheel', 'contextmenu', 'keyup'].forEach(function (directiveName) {
    player.directive(directiveName, ['$parse', function ($parse) {
        return function (scope, element, attrs) {
            var fn = $parse(attrs[directiveName]);
            element.bind(directiveName, function (event) {
                scope.$apply(function () {
                    fn(scope, {$event: event});
                });
            });
        }
    }]);
});

player.directive('login', ['$http', function ($http) {
    return function (scope, element, attrs) {

        function post(e) {
            e.preventDefault();
            var form = element.find('form'), mask = angular.element('<div class="mask">登陆中...</div>');
            form.find('p').html('');
            element.append(mask);
            $http({
                method: form.attr('type'),
                url: form.attr('action'),
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                data: 'source=radio&remember=on'
                    +'&alias='+form[0].querySelector('[name=alias]').value
                    +'&form_password='+form[0].querySelector('[name=form_password]').value
                    +'&captcha_id='+form[0].querySelector('[name=captcha_id]').value
                    +'&captcha_solution='+form[0].querySelector('[name=captcha_solution]').value
            }).success(function (data) {
                    if (data.r === 1) {
                        if (data.err_no === 1011) {
                            $http({method: 'GET', url: 'http://douban.fm/j/new_captcha'}).
                                success(function (data, status, headers, config) {
                                    data = data.slice(1,-1);
                                    form.find('input').eq(0).val(data);
                                    form.find('img').attr('src', 'http://douban.fm/misc/captcha?size=m&id=' + data);
                                })
                        }
                        form.find('p').html(data.err_msg);
                    }
                    else if (data.r === 0) {
                        chrome.cookies.get({
                            url: 'http://douban.fm',
                            name: 'dbcl2'
                        }, function (c) {
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
                        localStorage.username = base64.encode(form[0].querySelector('[name=alias]').value);
                        localStorage.password = base64.encode(form[0].querySelector('[name=form_password]').value);
                        scope.loginNeeded = false;
                        element.css('top', '100%');
                        scope.action('channel');
                    }
                    mask.remove();
                });
        }

        function cancel(e) {
            scope.channel = 1;
            element.css('top', '100%');
            scope.action('channel');
            e.preventDefault();
        }

        scope.$watch(attrs.login, function (value) {
            if (value) {
                var form = ('<form type="post" action="http://douban.fm/j/login">\
                        <h2>登陆</h2>\
                        <input type="hidden" name="captcha_id" />\
                        <input type="hidden" name="souce" value="radio" />\
                        <input type="hidden" name="remember" value="on" />\
                        <input type="text" name="alias" placeholder="用户名" required />\
                        <input type="password" name="form_password" placeholder="密码" required />\
                        <input type="text" name="captcha_solution" placeholder="验证码" required />\
                        <img src="" alt="" />\
                        <input type="submit" value="登陆" />\
                        <a href="#">取消</a>\
                        <p></p>\
                    </form>');
                element.html(form);
                if (localStorage.username) {
                    element.find('input').eq(2).val(base64.decode(localStorage.username));
                }
                if (localStorage.password) {
                    element.find('[name=form_password]').val(base64.decode(localStorage.password));
                }
                var image = new Image();
                image.onerror = function () {
                    $http({method: 'GET', url: 'http://douban.fm/j/new_captcha'}).
                        success(function (data, status, headers, config) {
                            data = data.slice(1,-1);
                            element.find('input').eq(0).val(data);
                            element.find('img').attr('src', 'http://douban.fm/misc/captcha?size=m&id=' + data);
                        });
                }
                image.src = 'http://douban.fm/j/new_captcha';
                element.find('form').bind('submit', post);
                element.find('a').bind('click', cancel);
                element.css({display: 'block', top: '0'});
            }
        });
    };
}]);

player.controller('Player', ['$scope', '$timeout', '$window', 'slideshow', function ($scope, $timeout, $window, slideshow) {

    var port = chrome.extension.connect({name: 'fm'});
    port.postMessage({cmd: 'get'});
    port.onMessage.addListener(function (msg) {
        $timeout(function (){});
        switch (msg.cmd) {
        case 'progress':
            $scope.time = msg.time;
            $scope.duration = msg.duration;
            if (msg.lrc) {
                $scope.message = msg.lrc;
            }
            break;
        case 'set':console.log(msg, msg.duration)
            $scope.album = msg.album;
            $scope.isLike = msg.isLike;
            $scope.isPlay = msg.isPlay;
            $scope.isRepeat = msg.isRepeat;
            $scope.picture = msg.picture;
            $scope.source = msg.artist + ' | ' + msg.albumtitle;
            $scope.time = msg.time;
            $scope.duration = msg.duration;//maybe null
            $scope.title = msg.title;
            $scope.url = msg.url;
            if (!msg.canplaythrough) {
                $scope.message = '载入中...';
            }
            $scope.playlist = msg.playlist;
            $scope.current = Number(msg.current);
            break;
        case 'canplaythrough':
            $scope.time = 0;
            if (msg.status) {
                $scope.message = '';
            }
            else {
                $scope.message = '载入中...';
            }
            break;
        case 'error':
            $scope.message = msg.msg;
            break;
        case 'oauth':
            $scope.loginNeeded = true;
            break;
        }
    });

    slideshow.run({
        slide: '#tracker',
        btnPrev: '#left',
        btnNext: '#right'
    });

    angular.element($window).bind('resize', function () {
        angular.element(document.body).css({
            width: window.innerWidth + 'px',
            height: window.innerHeight + 'px'
        });
    });

    $scope.window = $window;

    $scope.loginNeeded = false;

    $scope.album = '';
    $scope.isLike = false;
    $scope.isPlay = true;
    $scope.isRepeat = false;
    $scope.picture = '';
    $scope.source = '';
    $scope.time = 0;
    $scope.duration = 0;
    $scope.title = '正在获取歌曲，请稍候';
    $scope.url = '';
    $scope.volume = localStorage.volume;

    $scope.message = '';

    $scope.channel = localStorage.channel;
    $scope.channelList = JSON.parse(localStorage.channelList);

    $scope.playlist = [];
    $scope.current = 0;

    $scope.hover = false;

    $scope.onhover = function (e) {
        var target = document.body, r = e.relatedTarget;
        while (r && r !== target) {r = r.parentNode;}
        if (r !== target) {
            //port.postMessage({cmd: 'event', type: e.type});
            $scope.hover = e.type === 'mouseover';
        }
    };

    $scope.action = function (type, e) {
        var value;
        switch (type) {
        case 'channel':
            value = $scope.channel;
            break;
        case 'index':
            value = Number(e.target.dataset.index);
            slideshow.prev();
            break;
        case 'like':
        case 'play':
        case 'repeat':
            var prop = 'is' + type.replace(/^./, function (s) {return s.toUpperCase();});
            $scope[prop] = !$scope[prop];
            value = $scope[prop];
            break;
        case 'skip':
            value = $scope.duration * e.offsetX / e.target.offsetWidth;
            break;
        case 'volume':
            value = $scope.volume;
            break;
        }
        port.postMessage({cmd: type, value: value});
        e && e.preventDefault();
    };

    $scope.hotkey = function (e) {
        switch (e.keyCode) {
        case 37:
            $scope.action('prev');
            break;
        case 38:
            $scope.volume = parseInt($scope.volume, 10) > 95 ? 100 : parseInt($scope.volume, 10) + 5;
            $scope.action('volume');
            break;
        case 39:
            $scope.action('next');
            break;
        case 40:
            $scope.volume = parseInt($scope.volume, 10) < 5 ? 0 : parseInt($scope.volume, 10) - 5;
            $scope.action('volume');
            break;
        case 32:
            $scope.action('play');
            break;
        case 9:
            e.preventDefault();
            break;
        }
    };

    $scope.openAlbum = function (e) {
        if (e.target.id === 'player') {
            window.open($scope.album);
        }
    };

    $scope.onmousewheel = function (e) {
        var trueList = angular.element(e.target).parent('section')[0];
        var top = parseInt(getComputedStyle(trueList).getPropertyValue('top'), 10) + (e.wheelDelta>0?1:-1)*window.innerHeight/5;
        var height = trueList.scrollHeight - window.innerHeight;
        if (height <= 0) {return;}
        if (top > 0) {top = 0;}
        else if (top < -height) {top = -height;}
        trueList.style.top = top + 'px'
    };

}]);
