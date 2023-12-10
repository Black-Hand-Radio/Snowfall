window.addEventListener("DOMContentLoaded", function() {
	snowfall.setup();
});
const snowfall = {
	// config
	// amount of snowflakes to show. note that min/max values below are still respected.
	// snowflakes: 200, // snowflakes - note, too high value will cause lag.
	snowflakes: window.innerWidth * window.innerHeight / 2500, // dynamic count, based on browser viewport.
	speed: 1, // snowflake fall speed scalar. minimum 0.1, max 100, default 1. use 0.1 - 0.999 to slow things down, 1+ to speed things up.
	min_snowflakes: 50, // minimum amount of snowflakes to display, when using dynamic counts.
	max_snowflakes: 5000, // maximum amount of snowflakes to display, when using dynamic counts.
	style: {
		size: 30, // width/height of our snowflake. note, this includes the shadow too, so you need a value higher than the flake itself. optimally it should be the size of our bitmap, if you set it larger, the bitmap is enlarged, and quality may drop.
		// rgb:[255,255,255], // ignored, we use a bitmap instead of generating the graphics.
	},
	// frames per sec, default/recommended 30, min 1, max 60. 60 has very high cpu usage but doesn't seem smoother than 30. note: it will get rounded to divisions of 60 ie. 60/30/20/15/12/10, so for ex. 41 means 60fps, 40 means 30fps etc.
	fps: 30,
	
	// snowflake graphics to use, put a base64 encoded bitmap image here.
	// this one is sharper
	image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAMAAAAM7l6QAAAAwFBMVEX////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////S0tLp6enq6ur////R0dHExMTV1dXW1tb///+6urr///+zs7P///+zs7P///+zs7OysrLJycna2trr6+v7+/v8/Pz///9lp3WMAAAAOXRSTlMAAQIDBAUGBwkKCwwNDhETFBUYGRwdHh8gIiYnKCkqLTEyNjg5PEBERoODg4OEq6urq9PT9vb39/iFdm0YAAABFklEQVQokYXT227DIAwA0GAM3aZsL9P+/wsnVdOitvhCjUM7JVoLQbkdIOCYMD0t4b/bun8XbnXFemsS1pMdVvypTtVKu3R2A6+Nq3p1dzaBEMEHaF1VqnoD/2JTwOZgrE1ZV3eGCAgxWgtjMxFlFe1smgBTRPDBlYVYqXljgIgRM+KdmQsLi6rPOsaEmJN1P+DEZxGiwkwitTbGmFLOCV8/PBTHC1MpxMzOYJ1TPqT8uUZQvoUuxiRaG2NC0zTPK+uykDkTa+fWOb2/dT79NqYHLOVnx5vB6bwdvE8Nv1xZj5upBUT0hb3MMKnWpWwW9hcWm8NUTnUTlkFQR79k9EOfp8MgmUapeE/knue7RB5tg+EmelSuKqAqLoDYcSEAAAAASUVORK5CYII=',
	
	// this one is blurry
	// image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAMAAAAM7l6QAAAAulBMVEX////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////c3Nzu7u7////c3NzMzMzb29vc3Nz///++vr7///+0tLT///+0tLT///+ysrLJycna2trr6+v7+/v8/Pz///8cpufmAAAAN3RSTlMAAgQGCAoMDhIUFhcZGyElJiguMDU3ODo8P0ZISktNUllaYWRlanB2eampqarGxsbG4eH5+fr6E7gnPgAAARJJREFUKJGF0+lOwzAMAODWRwcq/IH3f0YEiGqrj+C42VArtqRRry9JE9cZh4dl/O+2HN+N17phuTYZt1McUfKpDCVKvTROg6yVi2dNTw6BESEHqF3dimeD/GJVoOoQ7FXVN08GBALEaBEcZubq5o1DGYiRIAd3NVGX6pUBkJAmohurrmpq7jlrRCaamBFPNOjZTWRVFbNSKhMyTxPT02uG4nNVWVdR1WRAJp5OzG9bBO3D5BIs5qUyMVWd5419WSRcRb1xdn55bnz+qSx32OT7wLvB5bIfvE2N3lPVv3ZTG4koF3aaYXAvi+wW9hcWYoqwlF1YOkHt/ZLeD32cDp1k6qXiLZFbnh8SubcNupvoXvkFKgwqLlgC3kUAAAAASUVORK5CYII=',
	
	// runtime values
	framecount: 0,
	frametime: 0, // current frame time
	frametime_total: 0, // total frame time
	container: null, // container element placeholder for the effect, if empty
	canvas_front: null,
	canvas_bg: null,
	flakes: [], // container for snowflakes
	easing: { // https://easings.net/
		easeInOutSine: function(x){
			return -(Math.cos(Math.PI * x) - 1) / 2;
		},
		easeInOutQuad: function(x){
			return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
		},
		easeInOutCubic: function(x){
			return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
		},
		easeInOutQuart: function(x){
			return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
		},
		easeInOutQuint: function(x){
			return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2;
		},
	},
	setup: function() {
		var self = this;
		
		// defaults
		if (!self.snowflakes) self.snowflakes = window.innerWidth * window.innerHeight / 2500;
		if (!self.min_snowflakes) self.min_snowflakes = 50;
		if (!self.max_snowflakes) self.max_snowflakes = 500;
		if (!self.fps) self.fps = 30;
		if (!self.speed) self.speed = 1;
		
		
		if (self.snowflakes < self.min_snowflakes) self.snowflakes = self.min_snowflakes;
		if (self.snowflakes > self.max_snowflakes) self.snowflakes = self.max_snowflakes;
		
		if (self.fps > 60) self.fps = 60;
		if (self.fps < 1) self.fps = 1;
		self.fps = 60 / Math.round( 60 / self.fps ); // this will round the framerate to a division of 60, ie. 60/30/20/15/12/10 etc.
		
		if (self.speed < 0.1) self.speed = 0.1;
		if (self.speed > 10) self.speed = 10;
		
		// throttle for IE. <-- not necessary if we do bitmap rendering.
		// if (!!window.document.documentMode) {
			// if (self.snowflakes > 75) self.snowflakes = 75;
		// }
		
		if (document.querySelector("#snowfall") == null) {
			var c = document.createElement("div");
			c.id = "snowfall";
			self.container = c;
			document.body.appendChild(c);
			
			var c1 = document.createElement("canvas");
			c1.id = "snowfall_background";
			self.canvas_bg = c1;
			c.appendChild(c1);
			
			var c2 = document.createElement("canvas");
			c2.id = "snowfall_foreground";
			self.canvas_front = c2;
			c.appendChild(c2);
			
			self.resize();
			window.addEventListener('resize', function() {self.resize();}, {passive:true});
			
			var img = new Image();
			img.src = self.image;
			self.image = img;
		}
		for (var i = 0; i < self.snowflakes; i++) {
			self.flakes.push(self.newSnowflake());
		}
		
		self.frametime = 0;
		self.frametime_total = 0;
		self.arc = Math.PI*2;
		
		// animateFlakes will call itself in another requestAnimationFrame creating an endless loop,
		// but it only runs when the window is active, so it's not CPU intensive.
		window.requestAnimationFrame(function() {self.animateFlakes();});
		
	},
	newSnowflake: function(vals) {
		var flake = {};
		
		// initial coords
		var ivals = ["x","y","scale","opacity"];
		for (var i = 0, n = ivals.length; i < n; i++) {
			var ival = ivals[i];
			if (typeof vals == "object" && typeof vals[ival] != "undefined") {
				flake[ival] = vals[ival];
				if (flake[ival] > 1) flake[ival] = 1;
				if (flake[ival] < 0) flake[ival] = 0;
			}
			else {
				flake[ival] = Math.random();
			}
		}
		
		// snowflakes in the foreground, faster movement
		if (flake.opacity > 0.5) {
			flake.z = 1;
			flake.opacity = 1;
			flake.bob = Math.random() * (5 - 1) + 1; // horizontal bob, higher is more movement.
			flake.speed = Math.random() * (30 - 10) + 10; // fall speed
		}
		// snowflakes in the background, slower movement
		else {
			flake.z = 0;
			flake.bob = 1; // horizontal bob, higher is more movement.
			flake.speed = Math.random() * (60 - 30) + 30; // fall speed
			flake.scale = flake.scale / ((Math.random() + 1) * 1); // background flakes are always smaller.
		}
		
		flake.bob = flake.bob / 100;
		
		// movement deltas
		flake.xd = Math.random(); // movement x delta
		flake.yd = flake.y; // movement y delta
		flake.y = 0; // fixed top value
		
		return flake;
	},
	resize: function() {
		if (document.querySelector("#snowfall") == null) return;

		var self = this;
		
		var W = document.documentElement.clientWidth;
		var H = document.documentElement.clientHeight;
		
		// this is required because a canvas CSS size is not the same as the canvas render size.
		// ie. you can have a 320x240 canvas stretched to 1920x1080 while still rendering at 320x240.
		self.canvas_front.width = W;
		self.canvas_front.height = H;
		self.canvas_bg.width = W;
		self.canvas_bg.height = H;
		self.drawFlakes();
	},
	drawFlakes : function() {
		var self = this;
		var style = self.style;
		var ctx0 = self.canvas_bg.getContext("2d");
		var ctx1 = self.canvas_front.getContext("2d");
		var W = document.documentElement.clientWidth;
		var H = document.documentElement.clientHeight
		var arc = self.arc;
		ctx0.clearRect(0, 0, W, H);
		ctx1.clearRect(0, 0, W, H);
		var overflow1 = self.style.size * 6;
		var overflow2 = self.style.size * 3;
		
		for (var i = 0,n = self.flakes.length; i < n; i++) {
			var flake = self.flakes[i];
			
			var bobpx = (W * flake.bob) * flake.scale; // max bob width, in pixels
			
			// for reverse movement
			var bob = flake.xd * 2;
			if (bob > 1) bob = 2 - bob; 
			
			bob = self.easing.easeInOutSine(bob); // percentage of the bob width
			var x = (flake.x * W) + (bobpx * bob);
			
			// y value must have some overflow calculated in, so the flakes don't abruptly disappear at the bottom.
			// so in this case, we add the flake size*2 to the max height.
			// a flake also has a shadow radius, so flake size is really flake size*3.
			var y = ((flake.y + flake.yd) * (H + overflow1)) - overflow2;
			// var size = (style.size * flake.scale) / 2;
			var size = style.size * flake.scale;
				
			if (flake.z == 0)
				var ctx = ctx0;
			else
				var ctx = ctx1;
			
			/*
			// this path generates all flakes with canvas, unfortunately this is a huge resource hog on older browsers.
			ctx.save();
			if (flake.z == 1) {
				// draw a dark, full circle with white shadow
				// then enable clipping and draw a white circle, with 1px offset.
				// this simulates box-shadow(-1px -1px 0 0 rgba(0,0,0,0.3) inset)
				// it works because the clipping is calculated for the arc only, not the shadow.
				
				ctx.beginPath();
				ctx.fillStyle = "rgb(178,178,178)";
				ctx.shadowColor = "rgb("+style.rgb.join(",")+")";
				ctx.shadowBlur = style.size;
				ctx.arc(x, y, size, 0, arc); // x, y, radius, startAngle, endAngle, counterClockwise
				
				// if (i == 0)
					// ctx.clip(); // this cannot be put in a loop, it's permanent.

				ctx.fill();
				ctx.closePath();
				
				ctx.beginPath();
				ctx.fillStyle = "rgb("+style.rgb.join(",")+")";
				ctx.shadowBlur = style.size;
				ctx.arc(x-1, y-1, size, 0, arc); // x, y, radius, startAngle, endAngle, counterClockwise
				ctx.fill();

				ctx.closePath();
			}
			else {
				ctx.globalAlpha = flake.opacity;
				ctx.beginPath();
				ctx.fillStyle = "rgb("+style.rgb.join(",")+")";;
				ctx.shadowColor = "rgb("+style.rgb.join(",")+")";;
				ctx.shadowBlur = 10;
				// ctx.fillStyle = "rgba("+style.rgb.join(",")+","+flake.opacity+")";
				// ctx.shadowColor = "rgba("+style.rgb.join(",")+","+flake.opacity+")";
				ctx.arc(x, y, size, 0, arc); // x, y, radius, startAngle, endAngle, counterClockwise
				ctx.fill();

				ctx.closePath();
			}
			ctx.restore();
			*/
			
			// because rendering shadowBlur is super slow, we instead draw a pre-generated snowflake image.
			if (flake.z == 1) {
				ctx.globalAlpha = 1;
			}
			else {
				ctx.globalAlpha = flake.opacity;
			}
			ctx.drawImage(self.image,x,y,size,size);
		}
	},
	animateFlakes: function() {
		var self = this;
		if (self.framecount > self.fps) self.framecount = 0;
		else self.framecount++;
		window.requestAnimationFrame(function() {self.animateFlakes();});
		
		// frame skipping
		// NOTE: this will limit us to 1 fps if the fps is not divisable by 60!
		if (self.framecount % (60/self.fps) !== 0) {
			return;
		}
		
		// seconds since last frame.
		self.frametime = (window.performance.now() - self.frametime_total) / 1000;
		
		// console.log(1 / self.fps, self.frametime);
		
		// if the tab is inactive for ex. 15 seconds, we will only calculate 1 second worth of movement.
		// this is to prevent excess snowflakes to pile up on the top of the page if the tab is inactive for too long.
		// (if so much time elapsed that a flake reaches the bottom, a new one will always spawn on the top,
		//  so if enough time is spent off tab, all flakes eventually reach the bottom and respawn at the same time on the next frame)
		if (self.frametime > 1) {
			self.frametime = 1;
		}
		
		self.frametime_total = window.performance.now();
		
		var W = document.documentElement.clientWidth;
		var H = document.documentElement.clientHeight;
		
		// iterate through the flakes, and add a delta
		// to the x position based on the bobbing,
		// and the y position based on screen height (and if a snowflake reaches the bottom, create a new one at the top)
		for (var i = 0,n = self.flakes.length; i < n; i++) {
			var flake = self.flakes[i];
			
			// flake.speed is in seconds, frametime is in microseconds
			// yd is percentage: 0 is 0%, 1 is 100%
			// so get what fraction of flake.speed is frametime, and increment yd with that
			flake.yd = (flake.yd + (self.frametime / flake.speed * self.speed));
			
			// bob speed is always 4s, but when alternating in both directions, this makes it 8s.
			flake.xd = (flake.xd + (self.frametime / 8 * self.speed));
			if (flake.xd > 1) flake.xd = 0;
			
			// snow has reached the bottom. remove it and spawn a new one.
			if (flake.y + flake.yd > 1) {
				self.flakes.splice(i, 1);
				var newflake = self.newSnowflake({
					// y:0, // force starting from top
					
					// start from whatever fraction remains; this is to avoid too many flakes being positioned at the top when the window is minimized for a minute.
					// pointless since we reset flake.y when making a new one...
					y: (flake.y + flake.yd % 1),
					
				});
				self.flakes.push(newflake);
			}
			else {
				self.flakes[i] = flake;
			}
		}
		self.drawFlakes();
		
	}
}


/*
todo:
- make snowflake count truly dynamic. Right now it is only computed once on load.
optimally it should be re-checked on resize, but that alone isn't enough:
on resize, new snowflakes must be generated, or existing ones removed.
however, we should avoid instantly adding/removing flakes.
so there should be a check to see if self.flakes.length is above or below our limit,
if it is below then skip generating a new flake,
if it is above, then generate 2 new snowflakes per frame?

only problem is that this conflicts with the config value.
so we'd need to change the config too, so we can select between fix count or density based count, and for the latter, the density count.

- methods for pausing (freezing the flakes), stopping (no new flakes are generated), resuming from pause, etc.
- look into more accurate framerate control, if possible.
*/