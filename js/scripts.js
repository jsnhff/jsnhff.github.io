var siteHeader = $('header');
var navigation = $('nav');
var mobileNav  = $('#js-mobile-nav');
var navTrigger = $('#js-mobile-nav-trigger');

navTrigger.click(function(){
    if(mobileNav.hasClass('hide')){
        mobileNav.removeClass('hide');
    } else {
        mobileNav.addClass('hide');
    };
});

