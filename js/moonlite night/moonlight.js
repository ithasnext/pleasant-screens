var stage;
var canvas;
var paused = false;

var layer = {
	stars: [],
	moon: null,
	clouds: null,
	skySublayer: null,
	starSublayer: null,
	moonSublayer: null,
	cloudSublayer: null
}

var TOTAL_TIME = 300;
var timeline = new gsap.timeline({repeat: -1, repeatDelay: 2});

// Sky
var gradients = [{"color": "#000000", "percent": .45}, {"color": "#131447", "percent": .75}, {"color": "#750c34", "percent": 1}]; // "#750c34"
var GRADIENT_ONE = .45;
var GRADIENT_TWO = .75;
var GRADIENT_THREE = 1;
var skyIncrement = .005;
var skyFadeTime = 120;

// Moon
var MOON_RADIUS = 80;
var MOON_ROTATION = 5;
var currentBlur = 10;//Math.floor(Math.random() * 120);
var shouldGlowExpand = true;
var moonGlowIncrement = 3;
var moonXIncrement = 1.3;
var moonTravelTime = 15;

// Stars
var star = {
    shape: "",
    life: 0,
    dying:false
};
var maxFade = 500;
var maxTwinkleSize = 2;
var maxNumTwinkles = 3;
var twinkleBase = 4;
var maxStarSize = 3;
var maxChildren = 200;
var maxTwinkle = 300;
var stepIncrease = 8;
var rotationIncrement = .1;

/////////
// Setup
/////////

function ready () {
    var width = window.innerWidth;
    var height = screen.height;
	
	// moonGlowIncrement = 
	
	gsap.defaults({ease: "none"});
	canvas = document.getElementById("canvas");
	canvas.width = width;
	canvas.height = height;
	canvas.style.left = "0px";
	canvas.style.top = "0px";
	canvas.style.position = "absolute";
	stage = new createjs.Stage(canvas);

	blackSky();
	createStars();
	drawMoon();

	setInterval(createStars, 2);
}

createjs.Ticker.addEventListener("tick", handleTick);
function handleTick (event) {
	if (!paused) {
		fadeSky();
		moonGlow();
		// stage.update();
		// createStars();
		tickStars();
		stage.update();
	}
}

/////////
// Night sky
/////////

function blackSky () {
	layer.skySublayer = new createjs.Container();
	layer.skySublayer.name = "skySublayer";
	var rect = new createjs.Shape();
	var colors = [];
	var percents = [];
	gradients.forEach(grad => {
		colors.push(grad.color);
		percents.push(grad.percent);
	});
	rect.graphics.beginLinearGradientFill(colors/*, "#FFCC70"*/, percents, 0, 0,  0, canvas.height).drawRect(0,0, canvas.width, canvas.height).endFill();
	layer.skySublayer.addChild(rect);
	stage.addChild(layer.skySublayer);

	skyIncrement = determineIncrement(skyFadeTime, 1 - gradients[0].percent)
} 

function fadeSky () {
	if (gradients.length == 1) {
		return;
	}
	var count = 0;
	var colors = [];
	var percents = [];
	for (var i = 0; i < gradients.length; i++) {
		gradients[i].percent = Math.min(gradients[i].percent + skyIncrement, 1);
		colors.push(gradients[i].color);
		percents.push(gradients[i].percent);
		if (gradients[i].percent == 1) {
			count++;
		}
	}

	if (count > 1) {
		colors.pop();
		percents.pop();
	}
	stage.removeChild(layer.skySublayer);
	layer.skySublayer.removeAllChildren();
	layer.skySublayer = new createjs.Container();
	layer.skySublayer.name = "skySublayer";

	var rect = new createjs.Shape();
	
	rect.graphics.beginLinearGradientFill(colors/*, "#FFCC70"*/, percents, 0, 0,  0, canvas.height).drawRect(0,0, canvas.width, canvas.height).endFill();
	layer.skySublayer.addChild(rect);
	stage.addChildAt(layer.skySublayer, 0);
}

/////////
// Stars
/////////

function createStars() {
	if (layer.starSublayer == null) {
		layer.starSublayer = new createjs.Container();
		layer.starSublayer.name = "starSublayer";
		stage.addChild(layer.starSublayer);
	}

    var numStars = Math.floor(Math.random() * stepIncrease);
    for (var i = 0; i < numStars; i++) {
		if (layer.starSublayer.numChildren > maxChildren) return;
		
		var star = new createjs.Container();
		
		var circle = new createjs.Shape();
		var poly = new createjs.Shape();

		var size = Math.floor(Math.random() * maxStarSize);
		var twinkleSize = Math.floor(Math.random() * twinkleBase);
		// Part one
		// var rectBG = new createjs.Shape();
        var rect = new createjs.Shape();
		
		// star.graphics.beginFill(/*"#0000ff"*/"white").drawPolyStar(0,0,size,4,3,20);
		
		// circle.graphics.beginFill("#FFFFFF").drawEllipse(0,0, size/2, size);
		// circle.graphics.beginFill("#FFFFFF").drawCircle(0,0,size);
		rect.graphics.beginFill("#FFFFFF").drawRect(0,0,size,size);
		rect.regX = rect.regY = size/2;
		rect.rotation = 45;
		poly.graphics.beginFill("#FFFFFF").drawPolyStar(0,0,size/2,4,3,20);
		poly.name = "glow";
		star.addChild(poly);
		star.addChild(rect);

		// star.rotation = Math.floor(Math.random() * 360); // random
        star.x = Math.floor(Math.random() * canvas.width);
        star.y = Math.floor(Math.random() * canvas.height);
		star.life = 2 * Math.floor(Math.random() * maxFade); //always even
		star.children[0].scaleX = star.children[0].scaleY = 0; 
		star.maxTwinkle = Math.random() * maxTwinkleSize;
		star.numTwinkles = Math.floor(Math.random() * maxNumTwinkles);
        star.alpha = 0;
		star.state = "growing";
		star.shadow = new createjs.Shadow("#794cf5", 0, 0, 25);
        layer.starSublayer.addChild(star);
	}
}

function fade(star) {
    if (star == null || !star.life) return;
    if (star.state == "dying" && star.alpha <= 0) {
        layer.starSublayer.removeChild(star);
        return;
	} 
	var step = 1/(star.life/2);
	star.alpha += star.state == "dying" ? -step : step;
	if (star.alpha >= 1 && star.state == "growing") star.state = "twinkleUp";
	
}

function twinkle (star) {
	// if (!star.shadow) {
	// 	star.shadow
	// }
	if (star.state == "twinkleUp") {
		star.children[0].scaleX += rotationIncrement;
		star.children[0].scaleY += rotationIncrement;

		if (star.children[0].scaleY >= star.maxTwinkle) {
			star.state = "twinkleDown";
		}
	}
	else {
		star.children[0].scaleX -= rotationIncrement;
		star.children[0].scaleY -= rotationIncrement;
		
		if (star.children[0].scaleY <= 0) {
			star.state = "twinkleUp";
			star.numTwinkles -=1;
		}
	}

	if (star.numTwinkles <= 0 && star.state == "twinkleUp") {
		star.state = "dying";
	}
}

function tickStars () {
	if (layer.starSublayer) {
		layer.starSublayer.children.forEach(star => {
            if (star.state.indexOf("twinkle") == -1) {
                fade(star);
            }
            else {
                twinkle(star);
            }
		});
	}
}

function clearStars () {
	layer.stars = [];
	layer.starSublayer.removeAllChildren();
	stage.removeChild(layer.starSublayer);
	layer.starSublayer = null;
}

/////////
// Moon
/////////

function drawMoon () {
	var circle =  new createjs.Shape();
	circle.name = "moon";
	
	circle.graphics.beginFill("#FFFFFF").drawCircle(0,0,MOON_RADIUS).endFill();
	circle.shadow = new createjs.Shadow("#FFFFFF", 0, 0, 10);

  	stage.addChild(circle);
  	circle.x = -100;
  	circle.y = 150;
  	// circle.regX = canvas.width/2;
  	// circle.regY = 20;
	layer.moon = circle;
	layer.moon.setBounds(0,0, MOON_RADIUS,MOON_RADIUS);
	
	moonGlowIncrement = determineIncrement(TOTAL_TIME/3, 40); 
	moonXIncrement = determineIncrement(TOTAL_TIME, layer.moon.getBounds().width + canvas.width - circle.x);
	timeline.to(circle, {x: canvas.width + layer.moon.getBounds().width, duration: TOTAL_TIME, ease:"none"});
	// timeline.to(circle.shadow, {blur: 120, duration: TOTAL_TIME/3});

}

function moonGlow () {
	// var moonChild = stage.getChildByName("moon");
	if (layer.moon) {
		if (currentBlur > 40) {
			shouldGlowExpand = false;
		}
		else if (currentBlur < 10) {
			shouldGlowExpand = true;
		}

		currentBlur += shouldGlowExpand ? moonGlowIncrement : -moonGlowIncrement; 

		// layer.moon.x += moonXIncrement;
		layer.moon.shadow = new createjs.Shadow("#FFFFFF", 0, 0, currentBlur);
	}
}


/////////
// Utilities
/////////

function determineIncrement (time, distance) {
	return distance / (time * 30);
}


// Debug
document.addEventListener("keypress", (e) => {
	if (e.key == " ") {
		paused = !paused;
	}
});

/*
	black sky 
	stars <-- layer with lots of objs, try cloning
	moon <-- one glow object
	clouds/haze <-- lots of
	star glow - 794cf5
	
	have the sky gradient change after time

	the moon starts out with low/no glow then it increases as the sky transition fades

	the stars all when they reach their end point twinkle randomly before fading

	or is it that a twinkle can happen at anypoint they can twinkle on their way up and out, but they must twinkle before fading
	
	this is all done with 30fps in mind, so limits should be calculated accordingly. Need a sparkle 
*/