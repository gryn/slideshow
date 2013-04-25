!function($) {

// SLIDESHOW:

// 12/08/12:
//  Rewrite with full documentation and use of jQuery 1.7 events.
//  Not generally backwards compatible, but no major modifications to port old code.

// An event framework for creating slideshows.
// Could be useful for tabs, accordions,
// and other similar patterns when you have a group of HTML elements
// and you want to have one selected at a time.

// HOW TO USE:

// Slideshow comes with one default effect,
// which assumes the following markup/css:

//  <div style="width: 100px; overflow: hidden">
//    <div style="width: 1000px; position: relative">
//      <section style="float: left">...</section>
//      ...
//    </div>
//  </div>

// You'd create and initialize the slideshow by calling:

//  $('#slideshow').slideshow(); // where #slideshow is the outer div above

// There are utility functions to setup navigation and arrows:
// (see API for more options)

//  var nav = $('<nav></nav>');
//  $('#slideshow').slideshow('navigation', nav);
//  var leftArrow = $('<a class="left">back</a>');
//  var rightArrow = $('<a class="right">forward</a>');
//  $('#slideshow').slideshow('arrows', leftArrow, rightArrow);
//  $('#slideshow').append(nav, leftArrow, rightArrow);

// API:
// $.fn.slideshow(options) - Creates a new slideshow
//  options:
//    effect: string,
//      indicates which effect to use,
//      you must add your own if you want something other than sliding*
//    wrapper: selector,
//      informs the effect how to select a wrapper element
//      (not all effects will need a wrapper)
//    slide: selector,
//      informs slideshow (and the effect) where the slides are
// options may have effect specific options in it,
// the default effect takes no options.

// $.fn.slideshow(method) - Calls a method on the slideshow
//  method: string,
//    The method to call, detailed below.**
//    Methods may be prepended with '=' to retreive the value of the method, if any.
//    Otherwise, the method will allow jQuery standard chaining.

// $.fn.slideshow('goto', slide, context) - Goto a slide
//  slide: element/selector or string-keyword,
//    The slide to goto, typically indicated by an ID selector, i.e. #foo,
//    or an actual jQuery or DOM element.
//    You may also indicate the next slide via 'next', 'prev', 'next-wrap' or 'prev-wrap'.
//  context: object,
//    An object that will be passed to both event listeners and the effect.
//    May be modified.
//    Slideshow uses { force: true } to force the goto of a slide is already the current slide.
//    Other example usage would be to pass directions to an effect,
//    such as passing { animate: false },
//    to indicate to an effect that you do not want to animate this time.
//    Another example would be to pass who sent the event,
//    this would allow you to avoid event loops.
//  returns animation promise if called as '=goto'

// $.fn.slideshow('=currentSlide') - Returns the current slide

// $.fn.slideshow('arrows', left, right, wrap) - Setup arrows
//  left, right: element
//    The left and right elements to bind events.
//  wrap: boolean
//    Whether to make the arrows wrap.
//  Regardless of the value of wrap,
//  a 'disabled' class will be added to the left and right elements
//  when on the first or last slide, respectively.
//  This is a convenience function,
//  you can listen to events and call goto directly if you wish.

// $.fn.slideshow('navigation', nav, linkCreateCallback) - Setup navigation
//  nav: element
//    The element to hold the navigation created.
//  linkCreateCallback: function(i, slide)
//    Defaults to return $('<a>'+(i+1)+'</a>') if not passed.
//    The function is called for each slide in the slideshow,
//    and the value return is appended to nav.
//  A 'selected' class will be added to the link of the currently selected slide.

// EVENTS:
// Events are passed slideshow, slide and context (on the event object).
// The following custom events can be bound:

// slideshowBeforeGoto:
//  Called after determining the slide to goto but before starting the effect.
//  If it cancelled the goto is immediately stopped
//  and context (if present) has context.cancelled = false.
//  (use slideshow.$currentSlide to see the outgoing slide).
// slideshowGoto:
//  Called after starting the effect.
// slideshowGotoComplete:
//  Called when the promise returned by the effect has completed,
//  i.e. the slide has finished showing itself.
//  (The goto method also returns the same promise).


// *ADDING AN EFFECT:
// Adding an effect is as simple as creating it on the Slideshow.effects object.
// Please see the example near the bottom of the source code: Slideshow.effects.fade.
// Creating a new effect, 'swipe', could be done by modifying the goto method as such:

//  Slideshow.effects.swipe = {
//    ...
//    goto: function(slideshow, slide, context) {
//      slide.show().css({'z-index': 10, 'visibility': 'visible', left: 0});
//      slideshow.$currentSlide.css('z-index', 20);
//      var swipeDistance = slideshow.$currentSlide.width() / 2;
//      return slideshow.$currentSlide.animate(opacity: 'hidden', left: -swipeDistance);
//    }
//  };

// See "Effects" for full rules.

// **ADDING A METHOD:
// Adding a method is as simple as creating it on the Slideshow object:
//  Slideshow.nextSlide = function() {
//    return this._figurePage('next');
//  }
// It can than be called like any other method:
// var nextSlide = $('#slideshow').slideshow('=nextSlide');

// INTERNAL API NOTES:
// Slideshow, without documentation, effects and accoutrements is only about 100 lines of code.
// As such there are not many rules internally.

// $currentSlide:
//  This is the current slide shown, and the only state kept and used by slideshow.
//  It's expected that the other slides are sibling elements and match the selector options.slides.

// Effects:
//  Effects must implement init and goto.
//  Init must set $currentSlide on the passed slideshow object.
//  Goto is expected to hide $currentSlide and show the upcoming slide
//  (passed as the second argument, slide).
//  Goto must return a promise object that indicates when the slide is visible.
//  Generally, this means return $currentSlide.animate(...).
//  (If animating several elements return them all wrapped in $.when( first, second, ... ) ).

var Slideshow = {
  init: function(el, options) {
    this.$el = $(el);
    this.options = $.extend({}, Slideshow.defaults, options);
    
    this.effect =
      this.effects[this.options.effect] ||
      this.effects['default'];

    this.effect.init(this);

    if(!this.$currentSlide.length)
      throw "$currentSlide not found, options.wrapper or options.slide perhaps incorrect?";
  },
  effects: {
    'default': {
      init: function(slideshow) {
        slideshow.wrapper = slideshow.$el.children(slideshow.options.wrapper);
        slideshow.children = slideshow.wrapper.children(slideshow.options.slide);
        slideshow.$currentSlide = slideshow.children.first();
        slideshow.$el.scrollLeft(0);
      },
      goto: function(slideshow, slide, context) {
        var position = slide.position();
        return slideshow.wrapper.stop().animate({'left': -position.left});
      }
    }
  },
  _figurePage: function(slide) {
    if( slide == 'next' || slide == '#next' )
      return this.$currentSlide.next(this.options.slide);
    if( slide == 'prev' || slide == '#prev' )
      return this.$currentSlide.prev(this.options.slide);
    if( slide == 'next-wrap' || slide == '#next-wrap' ) {
      var next = this.$currentSlide.next(this.options.slide);
      if( next.length ) return next;
      var prevAll = this.$currentSlide.prevAll(this.options.slide);
      if( prevAll.length ) return prevAll.last(); // order is closest to $currentSlide
      return this.$currentSlide;
    }
    if( slide == 'prev-wrap' || slide == '#prev-wrap' ) {
      var prev = this.$currentSlide.prev(this.options.slide);
      if( prev.length ) return prev;
      var nextAll = this.$currentSlide.nextAll(this.options.slide).last();
      if( nextAll.length ) return nextAll.last();
      return this.$currentSlide;
    }
    return $(slide);
  },
  goto: function(slide, context) {
    var base = this;

    slide = this._figurePage(slide);
    if( context && context.force || !slide.length || slide[0] == this.$currentSlide[0] ) return this.$currentSlide;

    var beforeGotoEvent = $.Event('slideshowBeforeGoto', {
      slideshow: this,
      slide: slide,
      context: context
    });
    this.$el.trigger(beforeGotoEvent);
    if(beforeGotoEvent.isDefaultPrevented()) {
      if( context ) context.cancelled = true;
      return this.$currentSlide;
    }

    var promise = this.effect.goto(this, slide, context);
    if(!promise.then) {
      if(typeof promise.promise != 'function')
        throw "Effect did not return a promise object";

      promise = promise.promise();
    }
    this.$currentSlide = slide;

    var gotoEvent = $.Event('slideshowGoto', {
      slideshow: this,
      slide: slide,
      context: context
    });
    this.$el.trigger(gotoEvent);

    var gotoCompleteEvent = $.Event('slideshowGotoComplete', {
      slideshow: this,
      slide: slide,
      context: context
    });

    promise.then(function() {
      base.$el.trigger(gotoCompleteEvent);
    });

    return promise;
  },
  currentSlide: function() {
    return this.$currentSlide;
  }
};

Slideshow.defaults = {
  wrapper: 'div',
  slide: 'section'
};

$.fn.slideshow = function(method) {
  var methodArguments = $.makeArray(arguments).slice(1);
  var returnValue = /^=/.test(method);

  // init
  if(typeof method !== "string") {
    var options = method;
    return this.each(function() {
      var slideshow = $(this).data('Slideshow');
      if(!slideshow) {
        slideshow = Object.create(Slideshow)
        slideshow.init(this, options);
        $.data(this, 'Slideshow', slideshow);
      }
    });
  }

  // otherwise, method call

  // NOTE: we wrap the result in an array to ensure
  // null and undefine results do not get dropped.
  // However, if some elements do not have a slideshow,
  // they are still silently dropped from the result array!
  return this.map(function() {
    var slideshow = $(this).data('Slideshow');
	  if( !slideshow ) {
      return returnValue ?
        undefined :
        this;
    }

    var result = slideshow[method].apply(slideshow, methodArguments);

    return returnValue ?
      [result] :
      this;
	});
};

Slideshow.arrows = function(left, right, wrap) {
  var slideshow = this;
  if( !slideshow ) return;

  wrap = wrap ? '-wrap' : ''; 

  left.click(function() {
    slideshow.goto('prev'+wrap);
  });
  right.click(function() {
    slideshow.goto('next'+wrap);
  });

  function onGoto() {
    var prev = slideshow._figurePage('prev');
    var next = slideshow._figurePage('next');
    left.toggleClass('disabled', !prev.length);
    right.toggleClass('disabled', !next.length);
  }
  onGoto();

  slideshow.$el.on('slideshowGoto', onGoto);
};

Slideshow.navigation = function(nav, linkCreateCallback) {
  var slideshow = this;
  if( !slideshow ) return this;

  if(!linkCreateCallback) linkCreateCallback = function(i, slide) {
    return $('<a>'+(i+1)+'</a>');
  }

  var children = slideshow.$currentSlide.parent().children(slideshow.options.slide);
  children.each(function(i, slide) {
    slide = $(slide);
    var el = linkCreateCallback(i, slide);
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

  function onGoto() {
    var el = slideshow.$currentSlide.data('Slideshow-nav');
    el.addClass('selected');
    el.siblings().removeClass('selected');
  }
  onGoto();

  slideshow.$el.on('slideshowGoto', onGoto);
};

// fade assumes markup/style:
//  <div style="">
//    <div style="">
//      <section style="position: absolute; visibility: hidden">...</section>
//      ...
//    </div>
//  </div>
Slideshow.effects.fade = {
  init: function(slideshow) {
    slideshow.wrapper = slideshow.$el.children(slideshow.options.wrapper);
    slideshow.children = slideshow.wrapper.children(slideshow.options.slide);
    slideshow.$currentSlide = slideshow.children.first();
    slideshow.$el.scrollLeft(0);
    slideshow.$currentSlide.css({'z-index': 10, 'visibility': 'visible'});
  },
  goto: function(slideshow, slide, context) {
    slide.show().css({'z-index': 10, 'visibility': 'visible'});
    slideshow.$currentSlide.css('z-index', 20);
    return slideshow.$currentSlide.fadeOut();
  }
};

window.Slideshow = Slideshow;

}(jQuery);
