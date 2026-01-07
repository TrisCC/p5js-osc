// Particle-based OSC emitter
// By Tristan Cotino

// This sketch creates particles that fall under gravity and bounce on the bottom of the canvas.
// On each bounce, an OSC message is sent with the horizontal position and impact strength,
// which can be used to trigger sound grains in an external application.

var socket;
let particles = [];
let gravity = 0.25;

function setup() {
	setupOsc(8081, 3334)
	createCanvas(windowWidth, windowHeight);
}

function draw() {
	background(20);

	// Update and display particles
	for (let i = particles.length - 1; i >= 0; i--) {
		let p = particles[i];
		p.velocity += gravity;
		p.y += p.velocity;
		p.x += p.drift;

		// Bounce Logic
		if (p.y > height) {
			p.y = height;
			p.velocity *= -0.7; // Dampen the bounce

			// If the impact is strong enough, trigger a grain
			if (abs(p.velocity) > 1) {
				sendGrainOSC(p.x, abs(p.velocity));
			}
		}

		// Remove slow/dead particles
		if (abs(p.velocity) < 0.5 && p.y >= height) {
			particles.splice(i, 1);
		}

		// Remove particles that go off-screen
		if (p.x < 0 || p.x > width) {
			particles.splice(i, 1);
		}

		fill(0, 200, 255, 255);
		noStroke();
		ellipse(p.x, p.y, 16, 16);
	}
}

// Click to emit a particle "emitter"
function mousePressed() {
	particles.push({
		x: mouseX,
		y: mouseY,
		velocity: 0,
		drift: random(-1, 1),
		lifespan: 255
	});
}

function sendGrainOSC(posX, impact) {
	// Normalize values for PlugData (0.0 to 1.0)
	let normX = map(posX, 0, width, 0, 1);
	let normAmp = map(impact, 0, 15, 0, 1);

	sendOsc('/grain', [normX, normAmp]);
	println("Sent OSC /grain: " + normX + ", " + normAmp);
}

function receiveOsc(address, value) {
	console.log("received OSC: " + address + ", " + value);
}

function sendOsc(address, value) {
	socket.emit('message', [address].concat(value));
}

function setupOsc(oscPortIn, oscPortOut) {
	socket = io.connect('http://127.0.0.1:8081');
	socket.on('connect', function () {
		socket.emit('config', {
			server: { port: oscPortIn, host: '127.0.0.1' },
			client: { port: oscPortOut, host: '127.0.0.1' }
		});
	});
	socket.on('message', function (msg) {
		if (msg[0] == '#bundle') {
			for (var i = 2; i < msg.length; i++) {
				receiveOsc(msg[i][0], msg[i].splice(1));
			}
		} else {
			receiveOsc(msg[0], msg.splice(1));
		}
	});
}
