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
    slideshow.wrapper = slideshow.$el.children(slideshow.options.wrapper);
    slideshow.children = slideshow.wrapper.children(slideshow.options.slide);
    slideshow.$currentSlide = slideshow.children.first();
    slideshow.$el.scrollLeft(0);
    slideshow.$currentSlide.css({'z-index': 10, 'visibility': 'visible', 'position': 'relative'});
  },
  'goto': function(slideshow, slide, context) {
    slideshow.$el.css({'height': slideshow.$currentSlide.outerHeight()});
    slide.show().css({'z-index': 10, 'visibility': 'visible'});
    slideshow.$currentSlide.css({'z-index': 20, 'position': 'absolute'});

    var fadeOut = slideshow.$currentSlide.fadeOut(slideshow.options.duration);
    var resize = slideshow.$el.animate({'height': slide.outerHeight()}, slideshow.options.duration);

    var lastSlide = slideshow.$currentSlide;
    var flipLayout = function() {
      slide.css({'position': 'relative'});
      lastSlide.css({'position': 'absolute'});
      slideshow.$el.css({'height': ''});
    }

    var both = $.when(fadeOut, resize);
    both.then(flipLayout);
    return both;
  }
};
