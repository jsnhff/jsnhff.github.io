$( document ).ready(function() {
	$("#slideshow1").responsiveSlides({
	    auto: true,
	    random: true
	});
	$("#slideshow2").responsiveSlides({
	    auto: true,
	    random: true
	});
	$("#slideshow3").responsiveSlides({
	    auto: true,
	    random: true
	});
	$("#slideshow4").responsiveSlides({
	    auto: true,
	    random: true
	});

	var myDate = new Date().getHours();
	if(myDate > 0 && myDate <= 11) {
		console.log('Good Morning!');
	} else if(myDate >= 12 && myDate < 18) {
		console.log('Good afternoon!');
	} else if(myDate >= 18 && myDate <= 24) {
		console.log('Hello night owl!');
	}
});