/**
 * @version 1215
 **/
var Sherry, S;
Sherry = S = {

    extend: function (childCtor, parentCtor) {
        var fnTest = /\bsuperclass\b/, parent = parentCtor.prototype
        function tempCtor() {};
        if (parent.superclass && !parent.multiSuperclass) {
            parent.multiSuperclass = true;
            for (var name in parent) {
                if (parent.hasOwnProperty(name) && fnTest.test(parent[name])) {
                    parent[name] = (function (name, fn) {
                        return function () {
                            var bak = this.superclass[name];
                            this.superclass[name] = parent.superclass[name];
                            var res = fn.apply(this, arguments);
                            this.superclass[name] = bak;
                            return res;
                        }
                    })(name, parent[name]);
                }
            }
        }
        tempCtor.prototype = parent;
        childCtor.prototype = new tempCtor();
        childCtor.prototype.superclass = parentCtor.prototype;
        childCtor.prototype.constructor = childCtor;
    },

    proxy: function (fn, obj) {
        return function () {
            return fn.apply(obj, arguments);
        }
    },

    clone: function (destination, source) {
        for (var key in source) {
            destination[key] = source[key];
        }
        return destination;
    },

    ajax: function (url, options) {
        if (typeof options === 'function') {
            options = {
                load: options
            }
        }

        var client = new XMLHttpRequest(),
            isTimeout = false,
            isComplete = false,
            method = options.method ? options.method.toLowerCase() : 'get',
            data = options.data,
            timeout = options.timeout || 2000,
            before = options.before || function () {},
            load = options.load || function () {},
            error = options.error || function () {};

        if (method === 'get' && data) {
            url += '?' + data;
            data = null;
        }

        client.onload = function () {
            if (!isComplete) {
                if (!isTimeout && ((client.status >= 200 && client.status < 300) || client.status == 304)) {
                    load(client);
                }
                else {
                    error(client);
                }
                isComplete = true;
            }
        };

        client.onerror = function () {
            if (!isComplete) {
                error(client);
                isComplete = true;
            }
        };

        client.open(method, url, true);
        if (method === 'post') {client.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');}
        client.setRequestHeader('ajax', 'true');
        before(client);
        setTimeout(function () {
            isTimeout = true;
            if (!isComplete) {
                client.timeout = true;
                error(client);
                isComplete = true;
            }
        }, timeout);
        client.send(data);
    },

    jsonp: function (url, callback) {
        var script = document.createElement('script'), callbackName;
        script.type = 'text/javascript';
        callbackName = /&([\w.]+)=$/.exec(url)[1];
        script.src = url + callbackName;
        window[callbackName] = function (data) {
            callback(data);
            document.head.removeChild(script);
        };
        document.head.appendChild(script);
    }
};

