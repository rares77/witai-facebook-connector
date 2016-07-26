'use strict';

require('@risingstack/trace');
//You need to `npm install` the following dependencies: body-parser, express, request.
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

const app = express();

const Config = require('./const.js');
const FB = require('./connectors/facebook.js');

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());

//views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
	response.render('pages/index');
});

app.listen(app.get('port'), function() {
	console.log('Node app is running on port', app.get('port'));
});


//This will contain all user sessions.
//Each session has an entry:
//sessionId -> {fbid: facebookUserId, context: sessionState}
const sessions = {};

const findOrCreateSession = (fbid) => {
	let sessionId;
//	Let's see if we already have a session for the user fbid
	Object.keys(sessions).forEach(k => {
		if (sessions[k].fbid === fbid) {
			// Yep, got it!
			sessionId = k;
		}
	});
	if (!sessionId) {
//		No session found for user fbid, let's create a new one
		sessionId = new Date().toISOString();
		sessions[sessionId] = {
				fbid: fbid,
				context: {
					_fbid_: fbid
				}
		}; // set context, _fid_
	}
	return sessionId;
};

//Webhook verify setup using FB_VERIFY_TOKEN
app.get('/webhook', (req, res) => {
	console.log("verify method Request :: " +req);
	if (!Config.FB_VERIFY_TOKEN) {
		throw new Error('missing FB_VERIFY_TOKEN');
	}
	if (req.query['hub.mode'] === 'subscribe' &&
			req.query['hub.verify_token'] === Config.FB_VERIFY_TOKEN) {
		console.log("veryfing webhook token suceess.");
		res.send(req.query['hub.challenge']);
	} else {
		res.sendStatus(400);
	}
});

//The main message handler
app.post('/webhook', (req, res) => {
	// Parsing the Messenger API response
	const messaging = FB.parseMessage(req.body);
	if (messaging && messaging.message) {

		// Yay! We got a new message!

		// We retrieve the Facebook user ID of the sender
		const sender = messaging.sender.id;

		// We retrieve the user's current session, or create one if it doesn't exist
		// This is needed for our bot to figure out the conversation history
		const sessionId = findOrCreateSession(sender);

		// We retrieve the message content
		const msg = messaging.message.text;
		const atts = messaging.message.attachments;

		if (atts) {
			// We received an attachment

			// Let's reply with an automatic message
			FB.replyMessage( sender, 'Sorry I can only process text messages for now.');
		} else if (msg) {
			// We received a text message
			/*
			// Let's forward the message to the Wit.ai Bot Engine
			// This will run all actions until our bot has nothing left to do
			wit.runActions(
					sessionId, // the user's current session
					msg, // the user's message 
					sessions[sessionId].context, // the user's current session state
					(error, context) => {
						if (error) {
							console.log('Oops! Got an error from Wit:', error);
						} else {
							// Our bot did everything it has to do.
							// Now it's waiting for further messages to proceed.
							console.log('Waiting for futher messages.');

							// Based on the session state, you might want to reset the session.
							// This depends heavily on the business logic of your bot.
							// Example:
							// if (context['done']) {
							//   delete sessions[sessionId];
							// }

							// Updating the user's current session state
							sessions[sessionId].context = context;
						}
					}
			);
			*/
			FB.replyMessage( sender, msg);
		}
	}
	res.sendStatus(200);
});

