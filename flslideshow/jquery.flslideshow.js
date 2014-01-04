/*
 * JQUERY FLSLIDESHOW
 **/
(function($) {
    var FLSLIDEDATA = 'flslidedata';
    var methods = {
        init: function(settings) {
            return $(this).each(function(){
                var me = $(this), ui = {
                    elems: {},
                    numSlides: 0
                }, hasSlides = me.children().size() > 0;

                ui.elems.next = $('<a>').addClass(settings.classNext).appendTo(me);
                ui.elems.prev = $('<a>').addClass(settings.classPrev).appendTo(me);
                ui.elems.viewport = $('<div>').addClass(settings.classViewPort);
                ui.elems.navblock = $('<div>').addClass(settings.classNavBlock);
                ui.elems.scroll = $('<ul>').addClass(settings.classScroll).appendTo(ui.elems.viewport);

                me.data(FLSLIDEDATA, {ui: ui, settings: settings});
                var slider_ci = slider(me);

                if(!hasSlides){
                    $.each(settings.slides, function(index, slide){
                        slider_ci.addSlide(slide);
                    });

                }else{
                    ui.elems.scroll.append(me.children('ul').remove().children('li').each(function(){
                        slider_ci.addSlideDom(this);
                    }).end().contents());

                }
                ui.elems.viewport.appendTo(me);

                ui.elems.navblock.appendTo(me);
                slider_ci.refresh();

                function resizeSlides(){
                    var scroll = ui.elems.scroll;
                    var w = me.width();
                    var h = me.height();

                    ui.slidesize = {
                        w: w,
                        h: h
                    };

                    scroll.children().width(w).height(h);
                    slider_ci.navigateTo(slider_ci.getCurrentIndex());
                };
                resizeSlides();

                $(window).resize(function(){
                   resizeSlides();
                });

                ui.elems.next.click(function(){
                    slider_ci.nextSlide(function(){
                        slider_ci.replay();
                    });

                });
                ui.elems.prev.click(function(){
                    slider_ci.prevSlide(function(){
                        slider_ci.replay();
                    });
                });
                slider_ci.navigateTo(1);
                if(settings.autoplay === true){
                    slider_ci.play();
                }
            });
        },
        getCurrent: function() {
            return slider(this).getCurrent();
        },
        append: function(settings) {
            return $(this).each(function() {
                methods.init.call($('<div></div>').appendTo(this), settings);
            });
        }
    };
    
    
    var slider = (function(){
        var transition = function(slider){
            var params, DEFAULT_EFFECT = 'float';
            
            function effectComplete(){
                slider.switching = false;
                if(params.onComplete){
                    params.onComplete.call(slider);
                }
            }
            
            var effects = {
                simple: function(){
                    this.navigateTo(params.nextRealIndex + 1);
                    effectComplete();
                },
                fade: function(){
                    params.curSlide.animate({opacity: 0}, 400, 'swing', function(){
                        //$(this).css('visibility', 'hidden');
                    });
                    
                    params.nextSlide.css('opacity', 1);
                    var next = params.nextSlide.css('visibility', 'visible').clone()
                            .css({
                                visibility: 'visible', 
                                opacity: 0,
                                position: 'absolute',
                                left: -this.ui.elems.scroll.position().left
                            })
                            .appendTo(this.ui.elems.scroll)
                            .animate({opacity: 1}, 800, 'swing', function(){

                            });
                    return next.queue(function(){
                        slider.navigateTo(params.nextDomIndex);
                        $(this).remove();
                        $(this).dequeue();
                        effectComplete();
                    });
                },
                float: function(){
                    var delta = Math.abs(params.increment), component = (params.increment > 0 ? 1 : -1),
                        from = this.getCurrentIndex() + component,
                        to = this.getCurrentIndex() + params.increment - component;
                
                    if(delta >= 2){
                        toggleSlides.call(this, 
                                          from, 
                                          to );
                    }
                    if(params.increment < 0){
                        this.moveLeft(this.getCurrentIndex() - from + to - 1);
                        //alert(1);
                    }
                    this.ui.elems.scroll.animate(
                            {
                                left: (params.increment > 0?'-':'+') + '=' + this.ui.slidesize.w + 'px'
                            },
                            500,
                            'swing',
                            function(){
                                if(delta >= 2){
                                    toggleSlides.call(slider, 
                                              from, 
                                              to,
                                              true);
                                }
                                slider.navigateTo(params.nextDomIndex);
                                effectComplete();
                            }
                    );
                }
                
            };
            
            return {
                go: function(name){
                    if(!effects[name])
                        name = DEFAULT_EFFECT;
                    effects[name].call(slider);
                },
                set: function(pms){
                    params = pms;
                    return this;
                }
            };
        };
        
        function toggleSlides(from, to, visible){
            if(from > to){
                to = [from, from = to][0];
            }
            console.log(from, to);
            
            this.ui.elems.scroll.children().each(function(index, slide){
                if(index >= from && index <= to){
                    $(slide).css('display', visible?'list-item':'none');
                }
            });
        }
        
        function loadSlide(increment, complete){
            if(this.ui.numSlides <= 1){
                return false;
            }
            
            if(this.settings.block && this.switching){
                return false;
            }
            
            var me = this, elems = this.ui.elems;
            var slides = elems.scroll.children();
            if(slides.size() <= 1)
                return false;
            
            var params = {
                increment: increment,
                nextDomIndex: this.domSlideIndex(this.ui.currentIndex + increment),
                curSlide: this.getCurrent(),
                onComplete: complete
            };
            
            params.nextRealIndex = this.realSlideIndex(params.nextDomIndex);
            params.nextSlide = slides.eq(params.nextDomIndex);
            
            this.switching = true;
            this.transition.set(params).go(this.settings.animation);
        }
        
        function loadSlideByIndex(index, complete){
            index = this.domSlideIndex(index + 1);
            return loadSlide.call(this, index - this.getCurrentIndex(), complete);
        }
        
        function nextSlide(complete){
            return loadSlide.call(this, 1, complete);
        }

        function prevSlide(complete){
            return loadSlide.call(this, -1, complete);
        }
        
        function domSlideIndex(index){
            var elems = this.ui.elems;
            var slides = elems.scroll.children();
            if(index <= 0){
                index = slides.size() - 2;
            }else if (index > slides.size() - 2){
                index = 1;
            }
            return index;
        }
        
        function realSlideIndex(dom_index){
            if(typeof dom_index === 'undefined'){
                dom_index = this.getCurrentIndex();
            }
            
            if(dom_index === 0){
                dom_index += 1;
            }
            return dom_index - 1;
        }
        
        function moveLeft(index){
            var pos = -(index * this.ui.slidesize.w);
            this.ui.elems.scroll.css('left', pos + 'px');
            return pos;
        }
        
        function navigateTo(index){
            var elems = this.ui.elems;
            var slides = elems.scroll.children();
            index = this.domSlideIndex(index);
            this.setNavActiveSlide(this.realSlideIndex(index));
            console.log(this, index, this.moveLeft(index));
            this.ui.current = slides.eq(index);
            this.ui.currentIndex = index;
        }
        
        function getCurrent(){
            return this.ui.current;
        }
        
        function getCurrentIndex(){
            return this.ui.currentIndex;
        }
        
        function setNavActiveSlide(index){
            this.ui.elems.navblock.children().removeClass('active').eq(index).addClass('active');
        }
        
        function rebuildNavigation(){
            var i, me = this, 
                navblock = this.ui.elems.navblock, 
                count = this.ui.elems.scroll.children().filter(':not([data-flfakeslide])').size();
            navblock.html('');
            
            for(i = 0; i < count; i ++){
                (function(){
                    var index = i;
                    navblock.append(
                            $('<a class="nav-slide"></a>').click(function(){
                                if(index !== me.realSlideIndex()){
                                    me.setNavActiveSlide(index);
                                    me.loadSlideByIndex(index, function(){
                                        me.replay();
                                    });
                                }
                            })
                    );
                    
                })();
            }
        }
        
        function addSlideDom(slide, rebuildNav){
            $(slide).addClass(this.settings.classSlide)
                    .addClass(this.settings.classSlide + '-' + (this.ui.elems.scroll.children().size() + 1));
            
            this.ui.numSlides ++;
            
            if(rebuildNav){
                this.refresh();
            }
        }
        
        function addSlide(slide, rebuildNav){
            var i, sdom = $('<li>').addClass(this.settings.classSlide)
                                   .addClass(this.settings.classSlide + '-' + (this.ui.elems.scroll.children().size() + 1)),
                items = ['Title', 'Desc', 'AltInfo'];
        
            $('<img/>').attr('src', slide.bgimage).attr('alt', slide.title)
                       .appendTo($('<div/>').addClass(this.settings.classBackgroundImage).appendTo(sdom));
            for(i = 0; i < items.length; i++)
                $('<div>').addClass(this.settings['class' + items[i]])
                          .html(slide[items[i].toLowerCase()]).appendTo(sdom);
            this.ui.elems.scroll.append(sdom);
            
            this.ui.numSlides ++;
            
            if(rebuildNav){
                this.refresh();
            }
        }
        
        function addFakeSlides(){
           var slides = this.ui.elems.scroll.children();
           slides.filter('[data-flfakeslide]').remove();
           slides.eq(0).clone().attr('data-flfakeslide', true).insertAfter(slides.eq(-1));
           slides.eq(-1).clone().attr('data-flfakeslide', true).insertBefore(slides.eq(0));
           console.log(slides);
           
        }
        
        function refresh(){
            if(this.settings.autoHideNavControls){
                var els = this.ui.elems.navblock.add(this.ui.elems.prev).add(this.ui.elems.next);
                if(this.ui.numSlides <= 1){
                    els.hide();
                }else{
                    els.show();
                }
            }
            this.rebuildNavigation();
            this.addFakeSlides();
        }
        
        function play(){
            var me = this;
            this.timer = window.setTimeout(function(){
                me.nextSlide(function(){
                    me.play();
                });
                
            }, this.settings.nextSlideTimeout);
        }
        
        function stop(){
            window.clearTimeout(this.timer);
        }
        
        function replay(){
            this.stop();
            this.play();
        }
        
        return function(dom){
            return new function(){
                this.dom = $(dom);
                this.data = this.dom.data(FLSLIDEDATA);
                if(!this.data){
                    $.error('`flslideshow` was not initialized on this dom element');
                }
                
                this.ui = this.data.ui;
                this.settings = this.data.settings;
                
                this.switching = false;
                this.timer = null;
                this.transition = transition(this);
                
                this.nextSlide = nextSlide;
                this.prevSlide = prevSlide; 
                this.getCurrent = getCurrent;
                this.addFakeSlides = addFakeSlides;
                this.navigateTo = navigateTo;
                this.realSlideIndex = realSlideIndex;
                this.domSlideIndex = domSlideIndex;
                this.moveLeft = moveLeft;
                this.rebuildNavigation = rebuildNavigation;
                this.addSlide = addSlide;
                this.addSlideDom = addSlideDom;
                this.loadSlideByIndex = loadSlideByIndex;
                this.getCurrentIndex = getCurrentIndex;
                this.setNavActiveSlide = setNavActiveSlide;
                this.play = play;
                this.stop = stop;
                this.replay = replay;
                this.refresh = refresh;
            };
        };
    })();
    
    
    
    
    var plugin = $.fn.flslideshow = function(options) {
        if (methods[options]) {
            return methods[ options ].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof options === 'object' || !options) {
            var settings = {
                classSlide: 'slide',
                classTitle: 'title',
                classDesc: 'description',
                classAltInfo: 'altinfo',
                classBackgroundImage: 'bg-image',
                classNext: 'nav-but next-but',
                classPrev: 'nav-but prev-but',
                classScroll: 'scroll-area',
                classViewPort: 'viewport',
                classNavBlock: 'nav-block',
                classNavSlide: 'nav-slide',
                animation: 'float',
                block: true,
                autoplay: true,
                nextSlideTimeout: 5000,
                autoHideNavControls: false,
                slides: [],
                slideChanged: function(){},
                slideShowing: function(){}
            };
            $.extend(settings, options);
            return methods.init.apply(this, [settings]);
        } else {
            $.error('Method ' + options + ' does not exist on jQuery.flslideshow');
        }

    };

})(jQuery);
