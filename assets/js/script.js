//Slide show and nighttime mode
$( document ).ready(function() {

	/* modernizr-test.js
	 * Daniel Ott
	 * 3 March 2011
	 * Custom Tests using Modernizr's addTest API
	 */
	 
	/* iOS
	 * There may be times when we need a quick way to reference whether iOS is in play or not.
	 * While a primative means, will be helpful for that.
	 */
	Modernizr.addTest('ipad', function () {
	  return !!navigator.userAgent.match(/iPad/i);
	});
	 
	Modernizr.addTest('iphone', function () {
	  return !!navigator.userAgent.match(/iPhone/i);
	});

	if(Modernizr.ipad){
	  $('body').addClass('ipad');
	}

	if(Modernizr.iphone){
	  $('body').addClass('iphone');
	}

	var baseTime = 3500;
	var fadeTime = 700;
	var timeArray = [];
	for (var i = 0; i < 4; i++) {
		var minusTime = Math.floor(Math.random()*3000);
		timeArray[i] = (baseTime+ minusTime);
	};

	var elems1 = $("#slideshow1 li");
	var photos1 = jQuery.makeArray(elems1);

	var elems2 = $("#slideshow2 li");
	var photos2 = jQuery.makeArray(elems2);

	var elems3 = $("#slideshow3 li");
	var photos3 = jQuery.makeArray(elems3);

	var elems4 = $("#slideshow4 li");
	var photos4 = jQuery.makeArray(elems4);

	if(Modernizr.iphone){
		for(var i = 0; i < photos1.length; i++) {
			$(photos1[i]).append('<img src="assets/images/slides1/0'+(i+1)+'.jpg" alt="'+(i+1)+'">');
		};
		for(var i = 0; i < photos2.length; i++) {
			$(photos2[i]).append('<img src="assets/images/slides2/0'+(i+1)+'.jpg" alt="'+(i+1)+'">');
		};
	} else {
		for(var i = 0; i < photos1.length; i++) {
			$(photos1[i]).append('<img src="assets/images/slides1/0'+(i+1)+'.jpg" alt="'+(i+1)+'">');
		};
		for(var i = 0; i < photos2.length; i++) {
			$(photos2[i]).append('<img src="assets/images/slides2/0'+(i+1)+'.jpg" alt="'+(i+1)+'">');
		};
		for(var i = 0; i < photos3.length; i++) {
			$(photos3[i]).append('<img src="assets/images/slides3/0'+(i+1)+'.jpg" alt="'+(i+1)+'">');
		};
		for(var i = 0; i < photos4.length; i++) {
			if(i+1 < 10) {
				$(photos4[i]).append('<img src="assets/images/slides4/0'+(i+1)+'.jpg" alt="'+(i+1)+'">');
			}else {
				$(photos4[i]).append('<img src="assets/images/slides4/'+(i+1)+'.jpg" alt="'+(i+1)+'">');
			}
		};
	}

	if(Modernizr.iphone){
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
	} else {
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
	}

	var myDate = new Date().getHours();
	if(myDate > 4 && myDate < 11) {
		console.log('Good Morning!');
		$('body').addClass('day');
	} else if(myDate > 10 && myDate < 20) {
		console.log('Good afternoon!');
		$('body').addClass('day');
	} else {
		console.log('Hello night owl!');
		$('body').addClass('night');
	}
});