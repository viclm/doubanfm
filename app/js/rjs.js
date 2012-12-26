(function () {

var modsRequred = {},

    modsLoaded = [],

    modsDeferred = {},

    path = '',

    versions = {},

    exports = {},

    loadJS = function (mod, fn) {
        var file = path.replace('{{NAME}}', mod).replace('/{{VERSION}}', versions[mod] ? '/' + versions[mod] : '');
        if (exports[mod]) {
            fn(true);
        }
        else {
            var tag = document.createElement('script');
            tag.onload = tag.onerror = tag.onreadystatechange = function () {
                if (tag && tag.readyState && tag.readyState !== 'loaded' && tag.readyState !== 'complete') {
                    return;
                }
                try {
                    tag.parentNode.removeChild(tag);
                    tag = null;
                }
                catch (ex) {}
                fn();
            }
            tag.src = file;
            document.getElementsByTagName('head')[0].appendChild(tag);
        }
    };

    window.rjs = {

        debug: false,

        config: function (opt) {
            path = opt.path || 'http://s.xnimg.cn/{{VERSION}}/mall/common/js/{{NAME}}.js';
            versions = opt.versions || {};
        },

        Class: function () {
            var Class = function () {
                this.init.apply(this, arguments);
            },
            fnTest = /\$super\b/,
            tempCtor = function(){},
            name,
            i,
            parent = arguments[0],
            props = arguments[arguments.length - 1],
            interface;
            if (typeof parent === 'function') {
                tempCtor.prototype = parent.prototype;
                Class.prototype = new tempCtor();
                props = arguments[arguments.length - 1];
                for (name in props) {
                    if (typeof props[name] === 'function' && fnTest.test(props[name])) {
                        Class.prototype[name] = (function (name, fn, fnSuper) {
                            return function () {
                                var bak = this.$super, res;
                                this.$super = fnSuper;
                                res = fn.apply(this, arguments);
                                this.$super = bak;
                                return res;
                            };
                        })(name, props[name], parent.prototype[name]);
                    }
                    else {
                        Class.prototype[name] = props[name];
                    }
                }
                Class.prototype.$super = parent.prototype;
                interface = Array.prototype.slice.call(arguments, 1, -1);
            }
            else {
                Class.prototype = props;
                interface = Array.prototype.slice.call(arguments, 0, -1);
            }
            for (i = 0, name ; i < interface.length ; i += 1) {
                for (name in interface[i]) {
                    Class.prototype[name] = interface[i][name];
                }
            }
            Class.prototype.constructor = Class;
            return Class;
        },

        define: function (name, depends, fn) {
            if (typeof name === 'function') {
                fn = name;
                depends = [];
                name = null;
            }
            else if (/array/i.test(Object.prototype.toString.call(name))) {
                fn = depends;
                depends = name;
                name = null;
            }
            else if (typeof name === 'string') {
                if (typeof depends === 'function') {
                    fn = depends;
                    depends = [];
                }
                else if (!/array/i.test(Object.prototype.toString.call(depends))) {
                    depends = [];
                }
            }
            else {
                depends = [];
                name = null;
            }

            var i = 0, filter = [], mods = [];

            for ( ; i < depends.length ; i += 1) {
                if (exports[depends[i]]) {mods.push(exports[depends[i]])}
                else {filter.push(depends[i]);}
            }

            if (filter.length) {
                var self = this, nickname = +new Date();
                modsLoaded.push(nickname);
                this.use(depends.join(','), function () {
                    for (var key in exports) {
                        if (exports[key] === nickname) {
                            exports[key] = fn.apply(window, arguments);
                            for (var i in modsDeferred) {
                                if (i == nickname) {
                                    modsDeferred[i]();
                                    break;
                                }
                            }
                            break;
                        }
                    }
                });
            }
            else {
                if (name && modsRequred[name] || !name) {
                    modsLoaded.push(fn.apply(window, mods));
                }
                else {
                    exports[name] = fn.apply(window, mods);//load sync
                }
            }
        },

        use: function (mods, fn) {
            var counter = 0,
                modsDeferredCounter = 0,
                rNickname = /^\d+$/,
                run = function () {
                    try {
                        var modules = [];
                        for (var i = 0; i < mods.length ; i += 1) {
                            modules.push(exports[mods[i]]);
                        }
                        fn.apply(window, modules);
                    }
                    catch (ex) {
                        if (JMC.debug) { throw ex; }
                    }
                };

            if (typeof mods == 'string') {
                mods = mods.replace(/\s*/g, '').split(',');
            }

            for (var i = 0 ; i < mods.length ; i += 1) {
                (function f(mod) {
                    if (modsRequred[mod]) {
                        (function (m) {setTimeout(function () {f(m)}, 200);})(mod);
                        return;
                    }
                    modsRequred[mod] = true;
                    loadJS(mod, function (hasLoaded) {
                        delete modsRequred[mod];
                        counter += 1;
                        if (!hasLoaded) {
                            var ex = modsLoaded.shift();
                            if (rNickname.test(ex)) {
                                modsDeferredCounter += 1;
                                modsDeferred[ex] = function () {
                                    modsDeferredCounter -= 1;
                                    run();
                                };
                            }
                            exports[mod] = ex || {};
                        }
                        if (modsDeferredCounter === 0 && counter === mods.length && typeof fn === 'function') {
                            run();
                        }
                    });
                }(mods[i]));
            }
        }

    };

})();
