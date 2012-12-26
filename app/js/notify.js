var player = angular.module('player', []);

player.filter('b2s', function () {
    return function (bool, str, str2) {
        return bool ? str : str2 || '';
    }
});

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


player.controller('Player', ['$scope', '$timeout', function ($scope, $timeout) {

    var port = chrome.extension.connect({name: 'fm'});
    port.postMessage({cmd: 'get'});
    port.onMessage.addListener(function (msg) {
        $timeout(function (){});
        switch (msg.cmd) {
        case 'set':
            $scope.album = msg.album;
            $scope.isLike = msg.isLike;
            $scope.isPlay = msg.isPlay;
            $scope.isRepeat = msg.isRepeat;
            $scope.picture = msg.picture;
            $scope.source = msg.artist + ' | ' + msg.albumtitle;
            $scope.title = msg.title;
            $scope.url = msg.url;
            break;
        }
    });

    $scope.album = '';
    $scope.isLike = false;
    $scope.isPlay = true;
    $scope.isRepeat = false;
    $scope.picture = '';
    $scope.source = '';
    $scope.title = '正在获取歌曲，请稍候';
    $scope.url = '';

    $scope.hover = false;

    $scope.onhover = function (e) {
        var target = document.body, r = e.relatedTarget;
        while (r && r !== target) {r = r.parentNode;}
        if (r !== target) {
            port.postMessage({cmd: 'event', value: e.type});
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
            win.prev();
            break;
        case 'like':
        case 'play':
        case 'repeat':
            var prop = 'is' + type.replace(/^./, function (s) {return s.toUpperCase();});
            $scope[prop] = !$scope[prop];
            value = $scope[prop];
            break;
        case 'skip':
            value = $scope.length * e.offsetX / e.target.offsetWidth;;
            break;
        case 'volume':
            value = $scope.volume;
            break;
        }
        port.postMessage({cmd: type, value: value});
        e && e.preventDefault();
    };

    $scope.openAlbum = function (e) {
        window.open($scope.album);
    };

}]);
