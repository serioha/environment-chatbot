'use strict';

// Imports dependencies and set up http server
const express = require('express');
const bodyParser = require('body-parser');
const app = express().use(bodyParser.json()); // creates express http server

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

app.get("/", function (req, res) {
  res.send("Deployed!");
});

// Creates the endpoint for our webhook
app.post('/webhook', (req, res) => {
  let body = req.body;

  // Checks this is an event from a page subscription
  if (body.object === 'page') {

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {
      let webhook_event = entry.messaging[0];
      let sender_psid = webhook_event.sender.id;
      console.log('Sender PSID: ' + sender_psid);

      entry.messaging.forEach(function(event) {
        if (event.postback) {
          processPostback(event);
        }
      });
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

function processPostback(event) {
  var senderId = event.sender.id;
  var payload = event.postback.payload;


  var message = greeting + "My name is Volunteer Network Bot. I can tell you various details regarding volunteer. Which country do you live in?";
  sendMessage(senderId, {text: message});
  //
  // if (payload === "Greeting") {
  //   // Get user's first name from the User Profile API
  //   // and include it in the greeting
  //   request({
  //     url: "https://graph.facebook.com/v2.6/" + senderId,
  //     qs: {
  //       access_token: process.env.PAGE_ACCESS_TOKEN,
  //       fields: "first_name"
  //     },
  //     method: "GET"
  //   }, function(error, response, body) {
  //     var greeting = "";
  //     if (error) {
  //       console.log("Error getting user's name: " +  error);
  //     } else {
  //       var bodyObj = JSON.parse(body);
  //       name = bodyObj.first_name;
  //       greeting = "Hi " + name + ". ";
  //     }
  //     var message = greeting + "My name is Volunteer Network Bot. I can tell you various details regarding volunteer. Which country do you live in?";
  //     sendMessage(senderId, {text: message});
  //   });
  // }
}

// sends message to user
function sendMessage(recipientId, message) {
  request({
    url: "https://graph.facebook.com/v2.6/me/messages",
    qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
    method: "POST",
    json: {
      recipient: {id: recipientId},
      message: message,
    }
  }, function(error, response, body) {
    if (error) {
      console.log("Error sending message: " + response.error);
    }
  });
}

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

  // Your verify token. Should be a random string.
  // let VERIFY_TOKEN = "<YOUR_VERIFY_TOKEN>"
  let VERIFY_TOKEN = process.env.VERIFICATION_TOKEN

  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {

    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {

      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);

    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});
