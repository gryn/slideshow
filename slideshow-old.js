
!function($) {

// default assumes markup/style:
// <div style="width: 100px; overflow: hidden">
//   <div style="width: 1000px; position: relative">
//     <section style="float: left">...</section>
//     ...
//   </div>
// </div>
var Slideshow = {
  init: function(el, options) {
    this.$el = $(el);
    this.options = $.extend({}, Slideshow.defaults, options);
    
    this.effect =
      this.effects[this.options.style] ||
      this.effects[this.options.effect] ||
      this.effects['default'];
    $.extend( this, this.effect );

    this.init_effect();
  },
  // effects get dumped into the slideshow,
  // init_effect is expected to set $currentSlide
  effects: {
    'default': {
      init_effect: function() {
        this.wrapper = this.$el.children(this.options.wrapper);
        this.children = this.wrapper.children(this.options.wrapperChild);
        this.$currentSlide = this.children.first();
        this.$el.scrollLeft(0);
      },
      goto_effect: function(page, context) {
        var position = page.position();
        this.wrapper.stop().animate({'left': -position.left});
      }
    }
  },
  _figurePage: function(page) {
    if( page == 'next' || page == '#next' )
      return this.$currentSlide.next(this.options.wrapperChild);
    if( page == 'prev' || page == '#prev' )
      return this.$currentSlide.prev(this.options.wrapperChild);
    if( page == 'next-wrap' || page == '#next-wrap' ) {
      var next = this.$currentSlide.next(this.options.wrapperChild);
      if( next.length ) return next;
      var prevAll = this.$currentSlide.prevAll(this.options.wrapperChild);
      if( prevAll.length ) return prevAll.last(); // order is closest to $currentSlide
      return this.$currentSlide;
    }
    if( page == 'prev-wrap' || page == '#prev-wrap' ) {
      var prev = this.$currentSlide.prev(this.options.wrapperChild);
      if( prev.length ) return prev;
      var nextAll = this.$currentSlide.nextAll(this.options.wrapperChild).last();
      if( nextAll.length ) return nextAll.last();
      return this.$currentSlide;
    }
    return $(page);
  },
  goto: function(page, context) {
    page = this._figurePage(page);
    if( !page.length || page[0] == this.$currentSlide[0] ) return;

    if( this.options.onBeforeGoto && !this.options.onBeforeGoto(this, page, context) ) return;

    this.goto_effect(page, context);
        
    this.$currentSlide = page;

    if( this.options.onGoto ) this.options.onGoto(this, context);
  }
}

Slideshow.defaults = {
  // if an effect needs a wrapper, how to identify it
  wrapper: 'div',
  // when using 'next' 'prev' how to identify the next/prev slide
  wrapperChild: 'section'
};

$.fn.slideshow = function(options) {
  return this.each(function() {
	  var slideshow = $(this).data('Slideshow');
	  if( slideshow ) return;

    slideshow = Object.create(Slideshow)
    slideshow.init(this, options);
    $.data(this, 'Slideshow', slideshow);
	});
} 
$.fn.slideshowGoto = function(page, context) {
  return this.each(function() {
	  var slideshow = $.data(this, 'Slideshow');
	  if( !slideshow ) return;
    slideshow.goto(page, context);
	});
}
$.fn.slideshowCurrentSlide = function() {
  return this.map(function() {
    var slideshow = $.data(this, 'Slideshow');
    if( !slideshow ) return;
    return slideshow.$currentSlide[0];
  });
}

// helper function, sets up events for arrow buttons,
// adds 'disabled' when on the first or last slide
$.fn.slideshowArrows = function(left, right, wrap) {
  var slideshow = this.data('Slideshow');
  if( !slideshow ) return this;

  wrap = wrap ? '-wrap' : ''; 

  left.click(function() {
    slideshow.goto('prev'+wrap);
  });
  right.click(function() {
    slideshow.goto('next'+wrap);
  });

  var onGoto;
  var newOnGoto = function() {
    var prev = slideshow._figurePage('prev');
    var next = slideshow._figurePage('next');
    left.toggleClass('disabled', !prev.length);
    right.toggleClass('disabled', !next.length);
    if(onGoto) onGoto.apply(this, arguments);
  }
  newOnGoto();

  onGoto = slideshow.options.onGoto;
  slideshow.options.onGoto = newOnGoto;

  return this;
}

// helper function, sets up events for navigation buttons,
// adds 'selected' when respective slide is active.
// creatNav is passed the index and slide
// and should return the element to be used.
$.fn.slideshowNavigation = function(nav, createNav) {
  var slideshow = this.data('Slideshow');
  if( !slideshow ) return this;

  if(!createNav) createNav = function(i, slide) {
    return $('<a>'+i+'</a>');
  }

  var children = slideshow.$currentSlide.parent().children(slideshow.options.wrapperChild);
  children.each(function(i, slide) {
    slide = $(slide);
    var el = createNav(i, slide);
    el.data('Slideshow-slide', slide);
    slide.data('Slideshow-nav', el);
    nav.append(el);
    el.click(navClick);
  });

  function navClick() {
    var el = $(this);
    var slide = el.data('Slideshow-slide');
    slideshow.goto(slide);
  }

  var onGoto;
  var newOnGoto = function() {
    var el = slideshow.$currentSlide.data('Slideshow-nav');
    el.addClass('selected');
    el.siblings().removeClass('selected');

    if(onGoto) onGoto.apply(this, arguments);
  }
  newOnGoto();

  onGoto = slideshow.options.onGoto;
  slideshow.options.onGoto = newOnGoto;
}

// fade assumes markup/style:
// <div style="">
//   <div style="">
//     <section style="position: absolute; visibility: hidden">...</section>
//     ...
//   </div>
// </div>
Slideshow.effects.fade = {
  init_effect: function() {
    this.wrapper = this.$el.children(this.options.wrapper);
    this.children = this.wrapper.children(this.options.wrapperChild);
    this.$currentSlide = this.children.first();
    this.$el.scrollLeft(0);
    this.$currentSlide.css({'z-index': 10, 'visibility': 'visible'});
  },
  goto_effect: function(page, context) {
    page.show().css({'z-index': 10, 'visibility': 'visible'});
    this.$currentSlide.css('z-index', 20);
    this.$currentSlide.fadeOut();
  }
}

window.Slideshow = Slideshow;

}(jQuery);
