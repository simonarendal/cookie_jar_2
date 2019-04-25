/*
	MANUAL IDENTIFICATION MQTT CODE

	This code requires that the user choose an ID that they want at the start.
	Since some advanced HTML stuff like vibrations or speech requires that a user interacts,
	this might be like hitting two birds with one stone.

	It's a bit more of a hassle to write advanced stuff with this, because it's manual, but it's 
	definitely easier to get started. 

	In practice, this code does the following:
	1. 		When an ID is chosen by clicking a button, the device sets its ID and connects to MQTT
	2. 		Once connected, it sends out a random number to everyone
	2a. 	If a device receives a random number from someone with a different ID than itself, the device will show it on the screen

*/

// This will be our MQTT client
var client;

// Uncomment one of the three following lines to choose your public broker
// var MQTTBrokerUrl = 'ws://iot.eclipse.org:80/ws';
var MQTTBrokerUrl = 'ws://test.mosquitto.org:8080/ws';
// var MQTTBrokerUrl = 'ws://broker.hivemq.com:8000';

// Topics can be thought of like "chat rooms", only those listening to the correct topic get the message
// Make sure that this is very unique, so you only get your own messages
// I.e. don't name it 'test', but instead 'JesperHyldahlFoghTest'
// 
var basicTopic = 'JesperHyldahlFoghManual'; // CHANGE THIS TO SOMETHING UNIQUE TO YOUR PROJECT

// You can define as many topics as you want and use them for different things
// Remember to subscribe to them in .on('connect')!
var firstTopic = basicTopic + '-first';
var secondTopic = basicTopic + '-second';
// etc...

// We use a timer in order to only show the interface after we are fairly certain we have a unique ID
var connectionTimer = null;

// We keep a numerical ID for each client
var numericId = -1;

$('document').ready(function() {
	// If we click button-one, set our ID and start the MQTT
	$('.button-one').click(function() {
		numericId = 1;
		startMQTT();
	});

	// If we click button-two, also set our ID and start the MQTT
	$('.button-two').click(function() {
		numericId = 2;
		startMQTT();
	});

	// If we click the send-new-number button, send a number over MQTT
	$('.send-new-number').click(function() {
		sendRandomNumber();
	})
})

function startMQTT() {
	// We connect to the broker in the beginning after clicking a button
	// Be aware that this is not secure because it's public
	client = mqtt.connect(MQTTBrokerUrl);

	// Hide the ID chooser buttons
	$('.id-button-container').hide();
	// Show that we are connecting to MQTT
	$('.connecting').show();
	// Show our chosen ID
	$('.id-elem').text(numericId);
	// By changing the attribute 'data-id' on the HTML body, we can change the styling. See the CSS file for more.
	$('body').attr('data-id', numericId);

	// When we connect we want to do something
	client.on('connect', function (connack) {
		// We successfully connected, so let's hide the message
		$('.connecting').hide();
		// Show the place where we show messages
		$('.message-container').show();
		// Send a random number over MQTT
		sendRandomNumber();
	})

	// When we get any kind of message, we want to do something
	client.on('message', function (topic, payload) {

		// The payload comes in as a Buffer(i.e. incomprehensible bytes), so we need to convert it first
		// This happens by using JSON.parse() after converting the Buffer to a string
		var convertedPayload = JSON.parse(payload.toString());

		if(convertedPayload.id !== numericId) {
			// Only show this, if we did not send it ourselves
			$('.received').text('"' + convertedPayload.id + ': ' + convertedPayload.message + '"');
		}
	})

	// We start subscribing/listening to the basic topic, otherwise we don't get the sent messages
  client.subscribe(basicTopic, function(err) {
    // If we get an error show it on the interface so we can see what went wrong
    if(err) {
    	$('.error-container').text(err);
    }
  })
}

function sendRandomNumber() {
	// Messages are called payloads in MQTT
	// We create a payload with our numerical ID, our random unique and a random number
	var payload = {
		id : numericId,
		message : Math.random()
	};
	// Show to the interface what number we are sending
	$('.sending').text('"' + payload.id + ': ' + payload.message + '"');
	// We send/publish the message to the basic topic
	client.publish(basicTopic, JSON.stringify(payload));
}