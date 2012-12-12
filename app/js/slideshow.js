rjs.define('slideshow', function () {

    /** @class */
    var Base = rjs.Class(
        /** @lends Slideshow.prototype */
        {
        /**
        * hg.Slideshow is abstract class for slideshow, inherit it if you want a slideshow on webpage
        *
        * @author nhnst liuming
        * @version 20110623.4
        * @constructs
        * @requires jQuery
        * @param {Number} [gap=5000] The rate of slideshow plays
        * @param {length} length The number of slides
        * @param {Boolean} [loop=true] Indicate whether the slideshow plays loop
        * @param {Integer} [step=1] The step of slideshow moves
        */
        init: function (args) {
            var args = arguments[0] || {};

            this.gap = args.gap || 5000;
            this.length = args.length || 'auto';
            this.loop = !!args.loop;
            this.step = args.step || 1;
            this.callback = args.callback;

            this.count = 1;
            this.timer = null;
        },
        /**
        * reset the slideshow
        * @public
        */
        reset: function () {
            this.count = 1;
            return this;
        },
        /**
        * start playing the slideshow
        * @public
        */
        start: function () {
            var self = this;
            if (!this.timer) {
                this.timer = setInterval(function () {
                    self.next();//modify in 7.6
                }, this.gap);
            }
        },
        /**
        * stop playing the slideshow
        * @public
        */
        stop: function () {
            clearInterval(this.timer);
            this.timer = null;
        },
        /**
        * move to a special slide
        * @public
        * @param {Integer} index The No. of slide
        * @returns {Integer} The No. of slide moved to, return -1 if moving failed(e.g., move to current slide)
        */
        moveTo: function (index) {
            var res = index;
            if (this.count !== index) {
                this.count = index;
            }
            else {
                res = -1;
            }
            typeof this.callback === 'function' && this.callback(res);
            return res;
        },
        /**
        * move to next slide
        * @public
        * @returns {Integer} The No. of slide moved to, return -1 if moving failed(e.g., move to current slide)
        */
        prev: function () {
            var target = this.count - this.step;
            if (target < 1) {
                if (this.loop) {
                    target = this.length + target;
                }
                else {
                    target = 1;
                }
            }
            return this.moveTo(target);
        },
        /**
        * move to previous slide
        * @public
        * @returns {Integer} The No. of slide moved to, return -1 if moving failed(e.g., move to current slide)
        */
        next: function () {
            var target = this.count + this.step;
            if (target > this.length) {
                if (this.loop) {
                    target = target - this.length;
                }
                else {
                    target = this.length;
                }
            }
            return this.moveTo(target);
        }

    });

    /** @class */
    var Slide = rjs.Class(Base,
        /** @lends Slide.prototype */
        {
        /**
        * hg.Slideshow is a slideshow animating by sliding
        *
        * @author nhnst liuming
        * @version 20110727.3
        * @constructs
        * @augments hg.Slideshow
        * @requires jQuery
        * @param {Object|String} stage The container of slideshow
        * @param {Object|String} slides The slide content of slideshow
        * @param {Object|String} btnIndex The index controller of slideshow
        * @param {Object|String} btnPrev The prev button
        * @param {Object|String} btnNext The next button
        * @param {Number|String} unit The length of every slide, specify 'auto' to caculate it automatly
        * @param {String} easing The animation easing
        * @param {String} direction The direction of slideshow
        */
        init : function (args) {

            this.stage = null;
            this.slides = null;
            this.btnIndex = null;
            this.btnPrev = null;
            this.btnNext = null;
            this.unit = null;
            this.easing = null;
            this.direction = 'horizontal';

            $.extend(this, args);

            this.$super(args);

            var self = this, stage;

            stage = $(this.stage).eq(0);
            this.slides = $(this.slides, stage);
            this.prop = this.direction === 'horizontal' ? 'left' : 'top';

            if (this.length === 'auto') {
                this.length = this.slides.children().length;
            }

            this.slides.css(this.prop, 0);
            this.direction === 'horizontal' ? this.slides.width(this.unit * this.length) : this.slides.height(this.unit * this.length);

            if (this.btnIndex) {
                this.btnIndex = stage.find(this.btnIndex);
                this.btnIndex.each(function (index, elem) {
                    var i = index + 1;
                    $(elem).click(function () {
                        var bak = this.count;
                        if (self.moveTo(i) > -1) {
                            self.slideTo(bak, i);
                        }
                    });
                });
            }

            if (this.btnPrev) {
                this.btnPrev = stage.find(this.btnPrev);
                this.btnPrev.click(function (e) {
                    if (self.length > 1) {
                        self.prev();
                    }
                    e.preventDefault();
                    return false;
                });
            }

            if (this.btnNext) {
                this.btnNext = stage.find(this.btnNext);
                this.btnNext.click(function (e) {
                    if (self.length > 1) {
                        self.next();
                    }
                    e.preventDefault();
                    return false;
                });
            }
        },

        reset : function () {
            this.$super();
            this.slides.css(this.prop, 0);
        },

        slideTo : function (from, to, callback) {
            var props = {}, animOptions = {};
            this.slides.stop(true, true);
            props[this.prop] = '-=' + this.unit * (to - from);
            animOptions['duration'] = 500;
            this.easing && (animOptions['easing'] = this.easing);
            animOptions['complete'] = callback;
            this.slides.animate(props, animOptions);
        },

        prev : function () {
            var bak = this.count, res = this.$super(), self = this,  i;
            if (res > -1) {
                if (res > bak) {
                    i = this.length;
                    while (i > bak) {
                        this.slides.children(':last').prependTo(this.slides);
                        i -= 1;
                    }
                    this.slides.css(this.prop, parseInt(this.slides.css(this.prop), 10) - this.unit * (this.length - bak));
                }

                this.slideTo(bak, bak - this.step, function () {
                    if (typeof i !== 'undefined') {
                        self.slides.css(self.prop, parseInt(self.slides.css(self.prop), 10) - self.unit * i);
                        while (i) {
                            self.slides.children(':last').prependTo(self.slides);
                            i -= 1;
                        }
                    }
                });
            }
        },

        next : function () {
            var bak = this.count, res = this.$super(), self = this,  i;
            if (res > -1) {
                if (res < bak) {
                    i = 1;
                    while (i < bak) {
                        this.slides.children(':first').appendTo(this.slides);
                        i += 1;
                    }
                    this.slides.css(this.prop, parseInt(this.slides.css(this.prop), 10) + this.unit * (i - 1));
                }
                this.slideTo(bak, bak + this.step, function () {
                    if (typeof i !== 'undefined') {
                        self.slides.css(self.prop, parseInt(self.slides.css(self.prop), 10) + self.unit * (self.length - i + 1));
                        while (i <= self.length) {
                            self.slides.children(':first').appendTo(self.slides);
                            i += 1;
                        }
                    }
                });
            }
        }
    });

    /** @class */
    var Fade = rjs.Class(Base,
        /** @lends Fade.prototype */
        {
        /**
        * hg.Slideshow is a slideshow animating by sliding
        *
        * @author nhnst liuming
        * @version 20110727.3
        * @constructs
        * @augments hg.Slideshow
        * @requires jQuery
        * @param {Object|String} stage The container of slideshow
        * @param {Object|String} slides The slide content of slideshow
        * @param {Object|String} btnIndex The index controller of slideshow
        * @param {Object|String} btnPrev The prev button
        * @param {Object|String} btnNext The next button
        */
        init : function (args) {

            this.stage = null;
            this.slides = null;
            this.btnIndex = null;
            this.btnPrev = null;
            this.btnNext = null;

            $.extend(this, args);

            this.$super(args);

            var self = this, stage;

            stage = $(this.stage).eq(0);
            this.slides = $(this.slides, stage);

            if (this.length === 'auto') {
                this.length = this.slides.length;
            }

            if (this.btnIndex) {
                this.btnIndex = stage.find(this.btnIndex);
                this.btnIndex.each(function (index, elem) {
                    var i = index + 1;
                    $(elem).click(function (e) {
                        self.moveTo(i);
                        e.preventDefault();
                    });
                });
            }

            if (this.btnPrev) {
                stage.find(this.btnPrev).click(function (e) {
                    if (self.length > 1) {
                        self.prev();
                    }
                    e.preventDefault();
                    return false;
                });
            }

            if (this.btnNext) {
                stage.find(this.btnNext).click(function (e) {
                    if (self.length > 1) {
                        self.next();
                    }
                    e.preventDefault();
                    return false;
                });
            }
        },

        reset : function () {
            this.moveTo(0);
        },

        moveTo : function (index) {
            var bak = this.count, res = this.$super(index);
            if (res > -1) {
                this.slides.eq(bak - 1).fadeOut();
                this.slides.eq(res - 1).fadeIn();
                this.btnIndex.filter('.active').removeClass('active');
                this.btnIndex.eq(res-1).addClass('active');
            }
            return res;
        }
    });

    var SlideDynamic = rjs.Class(Slide, {

        init: function (opt) {

            this.url = null;

            $.extend(this, opt);

            this.$super(opt);

            this.hasmore = 1;


            this.cache = [];

            this.cache.push(this.slides.find('ul').html());

        },

        next: function () {

            if ((this.cache[this.count] || this.hasmore )&& !this.slides.is(':animated')) {
                this.length += 1;
                this.count += 1;
                var nextPage = $('<ul>').appendTo(this.slides), self = this;
                /*if (this.slides.find('ul').length > 1) {
                    nextPage = this.slides.find('ul').first().appendTo(this.slides);
                    this.slides.css('left', '0');
                }
                else {
                    nextPage = $('<ul>').appendTo(this.slides);
                }*/
                if (this.cache[this.count - 1]) {
                    nextPage.html(this.cache[this.count - 1]);
                }
                else {
                nextPage.html('<img src="http://a.xnimg.cn/shopping/cssimg/loading.gif">');
                $.get(this.url + this.slides.find('li:last').attr('data-gid'), function (data) {
                    self.hasmore = !!data.hasmore;
                    nextPage.html('');
                    $.each(data.info, function (index, value) {
                        $('<li>')
                        .attr('data-gid', value.gid)
                        .addClass(index % 2 === 1 ? 'even' : 'odd')
                        .append('<a href="http://j.renren.com/u/'+value.uid+'"><img src="'+value.avatar+'"></a><a href="http://j.renren.com/u/'+value.uid+'">'+value.name+'</a><span>'+value.action+'</span>')
                        .appendTo(nextPage);
                    });
                    self.cache.push(nextPage.html());
                }, 'json');
                }
                this.slideTo(1, 2, function () {
                    self.slides.find('ul').first().remove();
                    self.slides.css('left', 0);
                });
            }
        },

        prev: function () {
            if (this.cache[this.count - 2] && !this.slides.is(':animated')) {
                this.length -= 1;
                this.count -= 1;
                var prevPage = $('<ul>').prependTo(this.slides), self = this;
                prevPage.html(this.cache[this.count - 1]);
                this.slides.css('left', '-' + this.unit + 'px');
                this.slideTo(2, 1, function () {
                    self.slides.find('ul').last().remove();
                });
            }
        }
    });

    return {

        Base: Base,

        slide: function (opt) {
            return new Slide(opt);
        },

        fade: function (opt) {
            return new Fade(opt);
        }
    };

});
