// fadeAndResize assumes markup/style:
//  <div style="">
//    <div style="">
//      <section style="position: absolute; visibility: hidden; left: 0; right: 0;">...</section>
//      ...
//    </div>
//  </div>
// fadeAndResize differs from the basic fade effect by allowing the current slide to be
// position: relative rather than absolute.
// This allows the container to be sized based on the content found inside.
// (the container will also animate to it's new size rather than jump).
Slideshow.effects.fadeAndResize = {
  init: function(slideshow) {
    slideshow.wrapper = slideshow.$el.find(slideshow.options.wrapper);
    slideshow.children = slideshow.wrapper.children(slideshow.options.slide);
    slideshow.$currentSlide = slideshow.children.first();
    slideshow.$el.scrollLeft(0);
    slideshow.$currentSlide.css({zIndex: 10, display: 'block', visibility: 'visible', position: 'relative'});
  },
  'goto': function(slideshow, slide, context) {
    var target = { height: slideshow.$currentSlide.outerHeight() };
    if(slideshow.options.setWidth) {
      target.width = slideshow.$currentSlide.outerWidth();
    }
    slideshow.$el.css(target);

    slide.show().css({zIndex: 10, visibility: 'visible'});
    slideshow.$currentSlide.css({zIndex: 20, position: 'absolute'});

    target = { height: slide.outerHeight() };
    if(slideshow.options.setWidth) {
      target.width = slide.outerWidth();
    }
    
    var fadeOut = $.when();
    var resize = $.when();

    if(typeof context.animate == 'undefined' || context.animate !== false) {
      fadeOut = slideshow.$currentSlide.fadeOut(slideshow.options.duration);
      resize = slideshow.$el.animate(target, slideshow.options.duration);
    } else {
      slideshow.$currentSlide.hide();
      slideshow.$el.css(target);
    }
      

    var lastSlide = slideshow.$currentSlide;
    var flipLayout = function() {
      slide.css({'position': 'relative'});
      lastSlide.css({'position': 'absolute'});
      if(slideshow.options.resetHeightAfterGoto)
        slideshow.$el.css({height: '', width: ''});
    }

    var both = $.when(fadeOut, resize);
    both.then(flipLayout);
    return both;
  }
};
