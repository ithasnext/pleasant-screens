var canvas;
var stage;

var isReady = false;
var paused = false;

var rainLength = 10;
var rainSize = 5;
var maxDrops = 5000;
var dropIncrease = 10;
var dropRate = 10;

var layer = {
    sky: null,
    rainDrops: [],
    lamp: [],
    light: null,
    skySublayer: null,
    rainSublayer: null,
    lampSublayer: null,
    lightSublayer: null
}

/////////
// Setup
/////////

function ready () {
    var width = window.innerWidth;
    var height = screen.height;
	
	canvas = document.getElementById("canvas");
	canvas.width = width;
	canvas.height = height;
	canvas.style.left = "0px";
	canvas.style.top = "0px";
	canvas.style.position = "absolute";
	stage = new createjs.Stage(canvas);

    blackSky();
    createLamp();
    createLight();
    
    stage.update();
    isReady = true;
}
createjs.Ticker.framerate = 60;
createjs.Ticker.addEventListener("tick", handleTick);
function handleTick (event) {
	if (!paused && isReady) {
        dropRate = event.delta/1000*500;
        spawnRain();
        dropRain();

		stage.update();
	}
}

/////////
// Night sky
/////////

function blackSky () {
	// layer.skySublayer = new createjs.Container();
	// layer.skySublayer.name = "skySublayer";
	var rect = new createjs.Shape();
	var colors = [];
	var percents = [];
	// gradients.forEach(grad => {
	// 	colors.push(grad.color);
	// 	percents.push(grad.percent);
	// });
	rect.graphics.beginLinearGradientFill(["#91918c", "#000000"], [.1, 1], 0,0,0, canvas.height).drawRect(0,0, canvas.width, canvas.height).endFill();
	// layer.skySublayer.addChild(rect);
	stage.addChild(rect);

	// skyIncrement = determineIncrement(skyFadeTime, 1 - gradients[0].percent)
} 

/////////
// Rain
/////////

function spawnRain () {
    if (!isReady || paused) return;
    if (!layer.rainSublayer) {
        layer.rainSublayer = new createjs.Container();
        stage.addChild(layer.rainSublayer);
    }

    var currentDroppedCount = 0;
    while (layer.rainSublayer.children.length < maxDrops && currentDroppedCount < dropIncrease) {
        var xSpawn = Math.floor(Math.random() * canvas.width);
        var line = new createjs.Shape();
        line.graphics.beginStroke("white").setStrokeStyle(1).moveTo(0, -15).lineTo(0, -15+ rainLength);
        line.x = xSpawn;
        layer.rainSublayer.addChild(line);
        currentDroppedCount++;
    }
}

function dropRain () {
    if (layer.rainSublayer) {
        layer.rainSublayer.children.forEach(drop => {
            drop.y += dropRate;
            if (checkCollision(drop)) {
                if (!drop.collisionY) {
                    drop.collisionY = canvas.height;
                }
                despawnDrop(drop);
            }
        });
    }
}

function despawnDrop(drop) {
    layer.rainSublayer.removeChild(drop);
    createSplash(drop);
    drop = null;
    // spawn a growing circle that also dies
}

/////////
// Lamplight
/////////

function createLamp () {
    layer.lampSublayer = new createjs.Container();
    for (var i = 0; i < 3; i++) {
        var lamp = new createjs.Container();
        layer.lamp.push(lamp);

        var pole = new createjs.Shape();
        pole.graphics.beginFill("grey").drawRect(0,0,30, canvas.height/2);
        var arm = new createjs.Shape();
        arm.graphics.beginFill("grey").drawRect(0,0,100,30);

        var hit = new createjs.Shape();
        hit.graphics.drawRect(0,0, 100,30);
        
        arm.x = 0;
        arm.y = -30;
        
        lamp.addChild(pole);
        lamp.addChild(arm);
        lamp.setBounds(arm.x,canvas.height/2 + arm.y, 100, canvas.height/2);
        lamp.x = 50 + i*500;
        lamp.y = canvas.height/2;
        layer.lampSublayer.addChild(lamp);
    }

    stage.addChild(layer.lampSublayer);
}

function createLight () {
    layer.light = [];

    layer.lightSublayer = new createjs.Container();
    layer.lamp.forEach(lamp => {
        var triangularLight = new createjs.Shape();
        triangularLight.graphics.beginFill("#fff833").drawPolyStar(0,0, canvas.height/2, 3, .5, -90);
        triangularLight.name = "light";
        triangularLight.alpha = .3;

        var light = new createjs.Container();;
        
        lamp.addChildAt(triangularLight, 1);
        triangularLight.shadow = new createjs.Shadow("yellow", 0,0, 100);

        layer.light.push(light);
        // layer.light.alpha = .3;
        triangularLight.y = lamp.getBounds().y;
        triangularLight.x = 3 * lamp.getBounds().width/4;
        // layer.light.shadow = 
        layer.lightSublayer.addChild(light);
    });
    
    stage.addChild(layer.lightSublayer);
}

function checkCollision (drop) {
    var collided = false;
    for (var i = 0; i < layer.lamp.length; i++) {
        var lamp = layer.lamp[i];
        if ((lamp.x <= drop.x && drop.x <= lamp.getBounds().width + lamp.x) && lamp.getBounds().y + 7 <= drop.y) {
            collided = true;
            drop.collisionY = lamp.getBounds().y;
            break;
        }
    }
    
    return drop.y >= canvas.height || collided;
}

function createSplash (drop) {
    var splash = new createjs.Container();
    var puddle = new createjs.Shape();
    var upL = new createjs.Shape();
    var upR = new createjs.Shape();

    var width = Math.random() > .5 ? 8 : 5; 
    puddle.graphics.beginStroke("white").setStrokeStyle(1).moveTo(0,0).lineTo(width, 0).endStroke();
    splash.addChild(puddle);
    
    var upperL = Math.floor(Math.random() * width/2);
    upL.graphics.beginStroke("white").setStrokeStyle(1).moveTo(upperL,-1).lineTo(upperL, -4).endStroke();
    splash.addChild(upL);
    
    var upperR = width/2 + (Math.random() * width/2);
    upR.graphics.beginStroke("white").setStrokeStyle(1).moveTo(upperR,-1).lineTo(upperR, -4).endStroke();
    splash.addChild(upR);

    splash.x = drop.x-width/2;
    splash.y = drop.collisionY//Math.min(drop.y, canvas.height);

    stage.addChild(splash);
    setTimeout(destroySplash, 2, splash);
}

function destroySplash (splash) {
    stage.removeChild(splash);
    splash = null;
}

//////////
// Utilities
//////////

function coinFlip (percentage = 3) {
    return Math.floor((Math.random() * 10)/percentage) <= percentage;
}

// Debug
document.addEventListener("keypress", (e) => {
	if (e.key == " ") {
		paused = !paused;
	}
});

/*
    splash effect
    horizontal line of 5-9 length
    2 vertical lines, one to the left and one to the right of the middle point (drop)
        lines propportinal to the horizontal line
        distance as well
        spawn 1 px above the horizontal line
        continue for 5 px and then die
            could leave the horizontal line
*/