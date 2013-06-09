$( document ).ready(function() {
	var baseTime = 3500;
	var fadeTime = 700;
	var timeArray = [];
	for (var i = 0; i < 4; i++) {
		var minusTime = Math.floor(Math.random()*3000);
		timeArray[i] = (baseTime+ minusTime);
		console.log(timeArray[i]);
	};

	$("#slideshow1").responsiveSlides({
	    auto: true,
	    random: true,
	    pause: true,
	    speed: fadeTime,
	    timeout: timeArray[0]
	});
	$("#slideshow2").responsiveSlides({
	    auto: true,
	    random: true,
	    pause: true,
	    speed: fadeTime,
	    timeout: timeArray[1]
	});
	$("#slideshow3").responsiveSlides({
	    auto: true,
	    random: true,
	    pause: true,
	    speed: fadeTime,
	    timeout: timeArray[2]
	});
	$("#slideshow4").responsiveSlides({
	    auto: true,
	    random: true,
	    pause: true,
	    speed: fadeTime,
	    timeout: timeArray[3]
	});

	var myDate = new Date().getHours();
	if(myDate > 5 && myDate <= 11) {
		console.log('Good Morning!');
		$('body').addClass('day');
	} else if(myDate >= 12 && myDate < 20) {
		console.log('Good afternoon!');
		$('body').addClass('day');
	} else if(myDate >= 20 && myDate <= 5) {
		console.log('Hello night owl!');
		$('body').addClass('night');
	}
});