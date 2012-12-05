(function (window, document, undefined) {
    var aside = document.querySelector('div.aside div.infobox'),
        infobox = document.createElement('div');

    if (aside) {
        infobox.className = "infobox";
        infobox.innerHTML = aside.innerHTML;
        aside.parentNode.insertBefore(infobox, aside);
        infobox.querySelector('p').innerHTML = '<a href="#">使用豆瓣FM 精美版播放这张专辑</a>';
        infobox.querySelector('a').addEventListener('click', fetchSongs, false);
    }

    function fetchSongs(e) {
        var album = {}, songs;
        album.id = location.href.match(/\d+/)[0];
        album.picture = document.querySelector('#mainpic a').href;
        album.title = document.title.replace(' (豆瓣)', '');
        album.artist = document.querySelector('#info a').innerHTML;
        album.url = location.href;
        album.songs = [];

        songs = Array.prototype.slice.call(document.querySelector('table').querySelectorAll('tr'), 1);
        for (var i = 0, len = songs.length, item, song ; i < len ; i += 1) {
            item = songs[i];
            song = {};
            song.title = item.querySelector('td').innerText;
            song.sid = item.querySelector('a.j').id.match(/\d+/)[0];
            song.like = /\sinterest/.test(item.querySelector('a.j').className) ? '1' : '0';
            album.songs.push(song);
        }

        chrome.extension.sendRequest({cmd: 'albumfm', album: album});

        e.preventDefault();
    }
})(this, this.document);
