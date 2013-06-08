$( document ).ready(function() {
	var myDate = new Date().getHours();
	if(myDate > 0 && myDate < 11) {
		console.log('Good Morning!');
	} else if(myDate > 12 && myDate < 18) {
		console.log('Goo afternoon!');
	} else if(myDate > 18 && myDate <= 24) {
		console.log('Hello night owl!');
	}
});