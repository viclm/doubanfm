var player = angular.module('player', []).
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
  directive('blink', ['$timeout', function ($timeout) {
    return function (scope, element, attrs) {
        scope.$watch(attrs.blink, function (value) {
            element.css('opacity', '1');
            $timeout(function () {
                element.css('opacity', '0');
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

function Player($scope, $timeout) {

    var port = chrome.extension.connect({name: 'fm'});
    port.postMessage({cmd: 'get'});
    port.onMessage.addListener(function (msg) {
        $timeout(function (){});
        switch (msg.cmd) {
        case 'progress':
            if (msg.length) {
                $scope.time = msg.time;
                $scope.progress = msg.time / msg.length * 100;
                if (msg.lrc) {
                    $scope.message = msg.lrc;
                }
            }
            break;
        case 'set':console.log(msg)
            $scope.album = msg.album;
            $scope.isLike = !!msg.like;
            $scope.isPlay = msg.isPlay;
            $scope.isRepeat = msg.isRepeat;
            $scope.picture = msg.picture;
            $scope.progress = msg.length ? msg.time / msg.length * 100 : 0;
            $scope.source = msg.artist + ' | ' + msg.albumtitle;
            $scope.time = msg.time;
            $scope.title = msg.title;
            $scope.url = msg.url;
            if (!msg.canplaythrough) {
                $scope.message = '载入中...';
            }
            $scope.channel.current = localStorage.channel;
            $scope.playlist.list = msg.list;
            $scope.playlist.current = Number(msg.current);
            break;
        case 'canplaythrough':
            $scope.progress = 0;
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
            //this.onOauth(msg);
            break;
        }
    });

    $scope.album = '';
    $scope.isLike = false;
    $scope.isPlay = true;
    $scope.isRepeat = false;
    $scope.picture = '';
    $scope.progress = 0;
    $scope.source = '';
    $scope.time = 0;
    $scope.title = '正在获取歌曲，请稍候';
    $scope.url = '';
    $scope.volume = localStorage.volume;

    $scope.message = '';

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

    $scope.hover = function (e) {
        var target = document.body, r = e.relatedTarget;
        while (r && r !== target) {r = r.parentNode;}
        if (r !== target) {
            port.postMessage({cmd: 'event', type: e.type});
        }
    };

    $scope.action = function (type, e) {
        switch (type) {
        case 'channel':
            port.postMessage({cmd: type, value: $scope.channel.current});
            break;
        case 'index':
            if (e.target.className !== 'active') {
                port.postMessage({cmd: type, index: Number(e.target.dataset.index)});
                //this.winswitcher.prev();
            }
            break;
        case 'like':
        case 'play':
        case 'repeat':
            var prop = 'is' + type.replace(/^./, function (s) {return s.toUpperCase();});
            $scope[prop] = !$scope[prop];
            port.postMessage({cmd: type, value: $scope[prop]});
            break;
        case 'skip':
            port.postMessage({cmd: 'skip', rate: e.offsetX/e.target.offsetWidth});
            break;
        case 'volume':
            port.postMessage({cmd: type, value: $scope.volume});
            break;
        default:
            port.postMessage({cmd: type});
        }
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

var Winswitcher = function (args) {

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

    this.moveTo(2)
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

new Winswitcher();
