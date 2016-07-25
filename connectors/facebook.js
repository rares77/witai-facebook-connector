'use strict';

var request = require('request');
var Config = require('../const.js');

//See the Send API reference
//https://developers.facebook.com/docs/messenger-platform/send-api-reference

//configuring a default facebook request
const fbRequest = request.defaults({
	  uri: 'https://graph.facebook.com/me/messages',
	  method: 'POST',
	  json: true,
	  qs: {
	    access_token: Config.FB_PAGE_TOKEN
	  },
	  headers: {
	    'Content-Type': 'application/json'
	  },
	});

//sending a message to facebook chat
const fbMessage = (recipientId, msg, cb) => {
	const opts = {
			form: {
				recipient: {
					id: recipientId,
				},
				message: {
					text: msg,
				},
			},
	};
	
	/* https://developers.facebook.com/docs/messenger-platform/send-api-reference

	 FOR IMAGES
	 "message":{
	    "attachment":{
	      "type":"image",
	      "payload":{
	        "url":"https://petersapparel.com/img/shirt.png"
	      }
	    }
	  }

	 FOR TEMPLATES
	 "message":{
	   "attachment":{
	     "type":"template",
	     "payload":{
	       "template_type":"button",
	       "text":"What do you want to do next?",
	       "buttons":[
	         {
	           "type":"web_url",
	           "url":"https://petersapparel.parseapp.com",
	           "title":"Show Website"
	         },
	         {
	           "type":"postback",
	           "title":"Start Chatting",
	           "payload":"USER_DEFINED_PAYLOAD"
	         }
	       ]
	     }
	  }
	}
*/
	fbRequest(opts, (err, resp, data) => {
		if (cb) {
			cb(err || data.error && data.error.message, data);
		}
	});
};


//PARSE A FACEBOOK MESSAGE to get user, message body, or attachment
//https://developers.facebook.com/docs/messenger-platform/webhook-reference
var parseMessage = function (body) {
	console.log ("parsing message: " + JSON.stringify(body));
	var val = body.object === 'page' &&
						body.entry &&
						Array.isArray(body.entry) &&
						body.entry.length > 0 &&
						body.entry[0] &&
						body.entry[0].messaging &&
						Array.isArray(body.entry[0].messaging) &&
						body.entry[0].messaging.length > 0 &&
						body.entry[0].messaging[0]
	return val || null
}

module.exports = {
	replyMessage: fbMessage,
	parseMessage: parseMessage
}