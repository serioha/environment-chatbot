'use strict';
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
// Imports dependencies and set up http server
const
  request = require('request'),
  express = require('express'),
  body_parser = require('body-parser'),
  app = express().use(body_parser.json()); // creates express http server

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Accepts POST requests at /webhook endpoint
app.post('/webhook', (req, res) => {

  // Parse the request body from the POST
  let body = req.body;

  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {

    body.entry.forEach(function(entry) {
      // Gets the body of the webhook event
      let webhook_event = entry.messaging[0];
      console.log('Webhook event:', webhook_event);

      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log('Sender ID: ' + sender_psid);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      } else if (webhook_event.message) {
        console.log('webhook_event.message', webhook_event.message);
        console.log('webhook_event.message["quick_reply"]', webhook_event.message["quick_reply"]);
        if (webhook_event.message.quick_reply){
          handlePostback(sender_psid, webhook_event.message.quick_reply);
        } else{
          handleMessage(sender_psid, webhook_event.message);
        }
      }
    });
    // Return a '200 OK' response to all events
    res.status(200).send('EVENT_RECEIVED');

  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
});

// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {

  /** UPDATE YOUR VERIFY TOKEN **/
  const VERIFY_TOKEN = process.env.VERIFICATION_TOKEN;

  // Parse params from the webhook verification request
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  // Check if a token and mode were sent
  if (mode && token) {

    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {

      // Respond with 200 OK and challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);

    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

function handleMessage(sender_psid, received_message) {
  let response;

  // Checks if the message contains text
  if (received_message.text) {
    // Create the payload for a basic text message, which
    // will be added to the body of our request to the Send API
    response = {
      "text": `You sent the message: "${received_message.text}". Now send me an attachment !`
    }
  } else if (received_message.attachments) {
    // Get the URL of the message attachment
    let attachment_url = received_message.attachments[0].payload.url;
    response = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": "Is this the right picture?",
            "subtitle": "Tap a button to answer.",
            "image_url": attachment_url,
            "buttons": [
              {
                "type": "postback",
                "title": "Yes!",
                "payload": "yes",
              },
              {
                "type": "postback",
                "title": "No!",
                "payload": "no",
              }
            ],
          }]
        }
      }
    }
  }

  // Send the response message
  callSendAPI(sender_psid, response);
}

function handlePostback(sender_psid, received_postback) {
  const START_SEARCH_NO = 'START_SEARCH_NO';
  const START_SEARCH_YES = 'START_SEARCH_YES';
  const GREETING = 'GREETING';
  const AUSTRALIA_YES = 'AUSTRALIA_YES';
  const AUSTRALIA_NO = 'AUSTRALIA_NO';

  // Get the payload for the postback
  let payload = received_postback.payload;

  // Set the response based on the postback payload
  if (payload === START_SEARCH_YES) {
    const yesPayload = {
      "text": " Ok, I have to get to know you a little bit more for this. Do you live in Australia?",
      "quick_replies":[
        {
          "content_type":"text",
          "title":"Yes!",
          "payload": AUSTRALIA_YES
        },
        {
          "content_type":"text",
          "title":"Nope.",
          "payload": AUSTRALIA_NO
        }
      ]
    };
    callSendAPI(sender_psid, yesPayload);
  } else if (payload === START_SEARCH_NO) {
    const noPayload = {
      "attachment":{
      "type":"template",
      "payload":{
        "template_type":"generic",
        "elements":[
           {
            "title":"That'\''s ok my friend, do you want to find other ways to help WWF?",
            "image_url":"http://www.wwf.org.au/Images/UserUploadedImages/416/img-planet-globe-on-moss-forest-1000px.jpg",
            "subtitle":"We'\''ve some other areas needing help.",
            "default_action": {
              "type": "web_url",
              "url": "https://donate.wwf.org.au/campaigns/adopt-a-koala/",
              "messenger_extensions": true,
              "webview_height_ratio": "tall",
              "fallback_url": "http://www.wwf.org.au"
            },
            "buttons":[
              {
                "type":"web_url",
                "url":"https://donate.wwf.org.au/campaigns/adopt-a-koala/",
                "title":"Adopt a Koaka"
              },{
                "type":"web_url",
                "url":"https://donate.wwf.org.au/campaigns/wwf-donate-monthly/",
                "title":"Donate Monthly"
              },{
                "type":"web_url",
                "url":"https://donate.wwf.org.au/campaigns/rhinoappeal/?utm_expid=.m0RW-0r7QV-b74CdIQKXig.0&utm_referrer=https%3A%2F%2Fdonate.wwf.org.au%2Fcampaigns%2Fwwf-donate-monthly%2F",
                "title":"Java Rhino Appeal"
              },{
                "type":"web_url",
                "url":"https://donate.wwf.org.au/campaigns/wildcards/",
                "title":"Send a wildcard"
              }
            ]
          }
        ]
      }
    }
    };
    callSendAPI(sender_psid, noPayload);
  } else if (payload === GREETING) {
    request({
      url: "https://graph.facebook.com/v2.6/" + sender_psid,
      qs: {
        access_token: process.env.PAGE_ACCESS_TOKEN,
        fields: "first_name"
      },
      method: "GET"
    }, function(error, response, body) {
      var greeting = "";
      if (error) {
        console.log("Error getting user's name: " +  error);
      } else {
        var bodyObj = JSON.parse(body);
        const name = bodyObj.first_name;
        greeting = "Hi " + name + ". ";
      }
      const message = greeting + "Would you like to join a community of like-minded pandas in your area?";
      const greetingPayload = {
        "text": message,
        "quick_replies":[
          {
            "content_type":"text",
            "title":"Yes!",
            "payload": START_SEARCH_YES
          },
          {
            "content_type":"text",
            "title":"No, thanks.",
            "payload": START_SEARCH_NO
          }
        ]
      };
      callSendAPI(sender_psid, greetingPayload);
    });
  }
}

function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }

  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  });
}
