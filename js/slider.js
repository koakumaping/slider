/**
 * carousel
 * @authors Ping YF (koakumaping@163.com)
 * @date    2016-04-14 10:48:35
 * @version $Id$
 */

(function(factory) {
    "use strict";
    if(typeof exports === "object" && typeof module === "object") {
        module.exports = factory();
    } else if(typeof define === "function" && (define.amd || define.cmd)) {
        define(factory);
    } else {
        window.slider = factory();
    }
})(function(){
    'use strict';
    function slider (selector) {
        this.config = {
            autoPlayTime: 1, // 单位秒
            speed: 600,
            x: 0,
            xCurrent: 0,
            xEnd: 0,
            y: 0,
            yCurrent: 0,
            zIndex: 2,
            direction: 'stay'
        };
        
        // 定时器
        this.timer;
        this.isPaused = false

        // 选择器
        this.selector = document.querySelectorAll(selector)[0];
        this.length = this.selector.querySelectorAll('li').length;
        this.clientWidth = this.selector.clientWidth;
        this.isRunning = false;

        // 位置
        this.calPosition = 0;
        this.prevCalPosition;
        this.nextCalPosition;

        // 状态
        this.index = 0;
        this.indexPrev;
        this.indexNext;
        this.indexFlag = true;
        this.canMoveX = true;
        this.canMoveY = true;

        // 初始化元素
        this.li = this.selector.querySelectorAll('li');

        this.elment,
        this.elmentPrev,
        this.elmentNext;
        this.init();
    };

    slider.prototype = {
        init: function () {
            var self = this;
            self.addFocus();
            self.setActiveFocus();
            self.requestAnimationFrame();

            // 启动自动播放
            self.autoPlay()
            self.autoPause()

            self.selector.querySelectorAll('ul')[0].addEventListener('touchstart', function (event) {
                event.preventDefault();
                // 清空定时器
                clearInterval(self.timer)

                if (self.isRunning) {
                    return true;
                }

                self.config.x = event.changedTouches[0].pageX;
                self.config.y = event.changedTouches[0].pageY;
            });

            self.selector.querySelectorAll('ul')[0].addEventListener('touchmove', function (event) {
                event.preventDefault();
                if (self.isRunning) {
                    return true;
                }

                self.config.xCurrent = event.changedTouches[0].pageX;
                self.config.yCurrent = event.changedTouches[0].pageY;

                // 上下滑动
                if ( self.canMoveY ) {
                    window.scrollBy(0, self.config.y - self.config.yCurrent);
                    if (Math.abs(self.config.y - self.config.yCurrent) > 12) {
                        self.canMoveX = false;
                    }
                }
                
                // 左右滑动
                if (self.canMoveX) {
                    if (self.index === 0) {
                        self.indexPrev = self.length - 1;
                        self.indexFlag = false;
                    } else {
                        self.indexPrev = self.index - 1;
                    }

                    if (self.index >= self.length - 1) {
                        self.indexNext = 0;
                        self.indexFlag = false;
                    } else {
                        self.indexNext = self.index + 1;
                    }

                    self.calPosition = self.config.xCurrent - self.config.x;

                    // 防止超出
                    if ( self.length > 1 ){
                        if (self.calPosition >= self.clientWidth) {
                            self.calPosition = self.clientWidth;
                        }

                        if (self.calPosition <= - self.clientWidth) {
                            self.calPosition = - self.clientWidth;
                        }
                    } else {
                        return false
                    }

                    self.elment = self.li[self.index].querySelectorAll('img')[0];

                    var elmentPrev,
                        elmentNext;
                    
                    if (self.calPosition >= 0) {
                        // 向右滑动
                        elmentPrev = self.li[self.indexPrev].querySelectorAll('img')[0];
                    } else {
                        // 向左滑动
                        elmentNext = self.li[self.indexNext].querySelectorAll('img')[0];
                    }
                    
                    var elmentLi = self.li[self.index],
                        elmentLiPrev = self.li[self.indexPrev],
                        elmentLiNext = self.li[self.indexNext];

                    elmentLi.style.visibility = 'visible';

                    self.prevCalPosition = self.calPosition - self.clientWidth;
                    self.nextCalPosition = self.clientWidth + self.calPosition;
                    
                    if ( Math.abs(self.calPosition) > 20 ) {
                        self.canMoveY = false;
                        if (elmentPrev) {
                            elmentLiPrev.style.visibility = 'visible';
                            elmentPrev.style.transform = 'translate3d(' + self.prevCalPosition +'px,0,0)';
                        }

                        if (elmentNext) {
                            elmentLiNext.style.visibility = 'visible';
                            elmentNext.style.transform = 'translate3d(' + self.nextCalPosition +'px,0,0)';
                        }
                        
                        self.elment.style.transform = 'translate3d(' + self.calPosition +'px,0,0)';

                        // 向左滑动
                        if (self.calPosition > 0) {
                            self.config.direction = 'left';
                            if ( self.length > 2 ){
                                elmentLiNext.style.visibility = 'hidden';
                            }
                        } else if (self.calPosition < 0) {
                            self.config.direction = 'right';
                            if ( self.length > 2 ){
                                elmentLiPrev.style.visibility = 'hidden';
                            }
                        } else {
                            self.config.direction = 'stay';
                        }
                    }
                }
            });

            self.selector.querySelectorAll('ul')[0].addEventListener('touchend', function (event) {
                self.canMoveX = true;
                self.canMoveY = true;

                if (self.isRunning) {
                    return true;
                }

                switch (self.config.direction) {
                    case 'left':
                        self.prev();
                        self.config.direction = 'stay';
                        break;
                    case 'right':
                        self.next();
                        self.config.direction = 'stay';
                        break;
                    case 'stay':
                        self.stay();
                        break;
                }

                // 启动自动播放
                self.autoPlay()
            });
        },

        autoPlay: function () {
            var self = this
            
            if (!self.timer) {
                self.timer = setInterval(function () {
                    if (!self.isPaused) {
                        self.next()
                    }
                }, this.config.autoPlayTime * 1000)
            }
        },

        autoPause: function () {
            var self = this
            document.addEventListener('visibilitychange', function () {
                if(document.visibilityState === 'hidden') {
                    self.isPaused = true
                } else {
                    self.isPaused = false
                }
            })
        },

        prev: function () {

            var self = this;

            var indexPrev,
                indexFlag = true;

            if (self.index === 0) {
                indexPrev = self.length - 1;
                indexFlag = false;
            } else {
                indexPrev = self.index - 1;
            }

            var elment = self.li[self.index].querySelectorAll('img')[0],
                elmentPrev = self.li[self.indexPrev].querySelectorAll('img')[0];

            var elmentLi = self.li[self.index],
                elmentLiPrev = self.li[self.indexPrev];
            
            elmentLi.style.visibility = 'visible';
            elmentLiPrev.style.visibility = 'visible';

            var start = 0
            var _run = function () {
                self.isRunning = true;

                start ++
                self.prevCalPosition = self.easeOutCubic(start, self.prevCalPosition, self.clientWidth, self.config.speed);
                self.calPosition = self.easeOutCubic(start, self.calPosition, self.clientWidth, self.config.speed);

                elmentPrev.style.transform = 'translate3d(' + self.prevCalPosition +'px,0,0)';
                elment.style.transform = 'translate3d(' + self.calPosition +'px,0,0)';

                if (self.calPosition < self.clientWidth) {
                    requestAnimationFrame(_run);
                } else {
                    self.prevCalPosition = 0;
                    self.calPosition = 0;

                    elmentPrev.style.transform = 'translate3d(' + self.prevCalPosition +'px,0,0)';
                    elment.style.transform = 'translate3d(' + self.calPosition +'px,0,0)';

                    elmentLi.style.visibility = 'hidden';

                    self.isRunning = false;

                    if (!indexFlag) {
                        self.index = self.length - 1;
                    } else {
                        if (self.index > 0) {
                            self.index --;
                        }
                    }
                    self.setActiveFocus()
                }
            }

            _run();
        },

        next: function () {
            var self = this;

            var indexNext,
                indexFlag = true;

            if (self.index >= self.length - 1) {
                indexNext = 0;
                indexFlag = false;
            } else {
                indexNext = self.index + 1;
            }

            var elment =self.li[self.index].querySelector('img');
            var elmentNext = self.li[indexNext].querySelector('img');

            var elmentLi = self.li[self.index];
            var elmentLiNext = self.li[indexNext];
            
            elmentLi.style.visibility = 'visible';
            elmentLiNext.style.visibility = 'visible';

            // 初始化
            self.x = self.calPosition + self.clientWidth;  //prev

            var start = 0
            var _run = function () {
                self.isRunning = true;

                start ++
                self.x = self.easeOutCubic(start, self.x, -self.clientWidth, self.config.speed);
                self.calPosition = self.easeOutCubic(start, self.calPosition, -self.clientWidth, self.config.speed);

                elmentNext.style.transform = 'translate3d(' + self.x +'px,0,0)';
                elment.style.transform = 'translate3d(' + self.calPosition +'px,0,0)';

                if (self.calPosition > - self.clientWidth) {
                    requestAnimationFrame(_run);
                } else {
                    self.x = 0;
                    self.calPosition = 0;

                    elmentNext.style.transform = 'translate3d(' + self.x +'px,0,0)';
                    elment.style.transform = 'translate3d(' + self.calPosition +'px,0,0)';

                    elmentLi.style.visibility = 'hidden';

                    self.isRunning = false;
                    
                    if (indexFlag) {
                        if (self.index < self.length - 1) {
                            self.index ++;
                        }
                    } else {
                        self.index = 0;
                    }
                    self.setActiveFocus()
                }
            }

            _run();

        },

        stay: function () {
            var self = this;
            self.isRunning = false;
        },

        // 添加指示器
        addFocus: function () {
            var self = this;
            var innerHtml = ''
            var baseHtml = '<span class="focus-horizontal-bullet"></span>'
            var $focus = this.selector.querySelector('.focus-horizontal')

            for (var i = 0; i < self.length; ++i) {
                innerHtml += baseHtml
            }

            $focus.innerHTML = innerHtml
        },

        setActiveFocus: function () {

            var $bullets = this.selector.querySelectorAll('.focus-horizontal-bullet')

            for (var i = 0, l = $bullets.length; i < l; ++i) {
                if (i !== this.index) {
                    $bullets[i].className = 'focus-horizontal-bullet'
                } else {
                    $bullets[i].className = 'focus-horizontal-bullet active'
                }
            }
        },

        /*
         * t: current time（当前时间）；
         * b: beginning value（初始值）；
         * c: change in value（变化量）；
         * d: duration（持续时间）。
         * you can visit 'http://easings.net/zh-cn' to get effect
        */
        easeOutCubic: function(t, b, c, d) {
            return c * ((t = t/d - 1) * t * t + 1) + b;
        },

        requestAnimationFrame: function () {
            var lastTime = 0;
            var vendors = ['webkit', 'moz'];
            for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
                window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
                window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] ||    // name has changed in Webkit
                                              window[vendors[x] + 'CancelRequestAnimationFrame'];
            }

            if (!window.requestAnimationFrame) {
                window.requestAnimationFrame = function(callback, element) {
                    var currTime = new Date().getTime();
                    var timeToCall = Math.max(0, 16.7 - (currTime - lastTime));
                    var id = window.setTimeout(function() {
                        callback(currTime + timeToCall);
                    }, timeToCall);
                    lastTime = currTime + timeToCall;
                    return id;
                };
            }
            if (!window.cancelAnimationFrame) {
                window.cancelAnimationFrame = function(id) {
                    clearTimeout(id);
                };
            }
        }
    }

    return slider;
});