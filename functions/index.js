//webhook: https://asia-east2-line-collect.cloudfunctions.net/LineBotReply
const functions = require("firebase-functions");
const builderFunction = functions.region('asia-east2').https;
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccount.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://line-collect.firebaseio.com`,
  storageBucket: `line-collect.appspot.com`
});

const rtdb = admin.database();

const firestore = admin.firestore();
let limit = 20;

// ==== other libs ====

const request = require("request-promise");
const chalk = require('chalk');
const line = require('@line/bot-sdk');

const channelId = '1655196638';
const channelSecret = 'b20c850a5e5c190c0475c77339e1aa0f';
const channelAccessToken = 'Unw6fo+VLyL+fJm7EA91bzpAKwLnfizWI5v03aRAx49tDz6hybYvoyovgrc02zFgUCDjSKju8bCqkWHK0bC8TItfdJJYbUMth64pqWAu17uvKXZmmuM8LxuFaSnytlbzneUzVOv8szHS51YBwY1fgAdB04t89/1O/w1cDnyilFU=';
const notifyToken = 'lgBzFsbK9W9pmZPVcpOmWDwSsGFY5FweCEWtnO3dTS7';

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey("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");

const UUID = require("uuid-v4");
const projectId = "line-collect";

// === express ===

const users = require('./user');
exports.users = builderFunction.onRequest(users.users);

// const events = require('./event');
// exports.events = builderFunction.onRequest(events.events);

// const dashboard = require('./dashboard');
// exports.dashboard = builderFunction.onRequest(dashboard.dashboard);

// const lineandcom = require('./lineandcom');
// exports.lineandcom = builderFunction.onRequest(lineandcom.lineandcom);

// === LINE functionalities ===
const fn = require('./line');
const client = new line.Client({
  channelAccessToken,
  channelSecret
});

// const LINE_CONTENT_API = 'https://api-data.line.me/v2/bot/message'
const LINE_MESSAGING_API_BROADCAST = 'https://api.line.me/v2/bot/message/broadcast';
const LINE_MESSAGING_API_NOTIFY = "https://notify-api.line.me/api/notify";
const LINE_MESSAGING_API_REPLY = "https://api.line.me/v2/bot/message/reply";
const LINE_MESSAGING_API_PUSH = "https://api.line.me/v2/bot/message/push";
const LINE_MESSAGING_API_CONTENT = "https://api.line.me/v2/bot/message/{messageId}/content";
const LINE_MESSAGING_API = "https://api.line.me/v2/bot/message";
const LINE_AUTH_REVOKE = "https://api.line.me/oauth2/v2.1/revoke";
const LINE_HEADER = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${channelAccessToken}`
};

exports.LineBotReply = builderFunction.onRequest(async (req, res) => {
  console.log(fn.sum(1, 2));
  if (req.body.destination) {
    console.log("Destination User ID: " + req.body.destination);
  }

  // req.body.events should be an array of events
  if (!Array.isArray(req.body.events)) {
    return res.status(500).end();
  }

  // handle events separately
  Promise.all(req.body.events.map(fn.handleEvent))
    .then(() => res.end())
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });

  // if (req.method === "POST" && req.body.events[0].replyToken !== "00000000000000000000000000000000") {
  //     return res.status(200).send(`Reply success`);
  // } else {
  //     return res.status(200).send(`Verify success`);
  // }
});

exports.LineBotPush = builderFunction.onRequest((req, res) => {

  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', '*');

  let userId = req.query.user_id;
  let message = req.query.message;

  push(userId, message);
  return res.status(200).send(`Push success`);
});

exports.LineBotPushFlexCustom = builderFunction.onRequest((req, res) => {

  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', '*');

  let userId = req.body.user_id;
  let msgObj = req.body.message;

  pushFlexCustom(userId, msgObj);
  return res.status(200).send(`Push flex custom success`);
});

exports.LineBotNotify = builderFunction.onRequest(async (req, res) => {
  let msg = req.query.text;
  return await notify(res, msg);
});

exports.LineBotBroadcast = builderFunction.onRequest((req, res) => {
  let msg = req.query.text;

  broadcast(res, msg);
  return res.status(200).send(`Broadcast success`);
});

exports.LineRevoke = builderFunction.onRequest(async (req, res) => {
  let user_access_token = req.query.access_token;
  let data = revoke(user_access_token);
  res.status(200).json(data);

  // curl -X POST "https://api.line.me/oauth2/v2.1/revoke" \
  // -H "Content-Type:application/x-www-form-urlencoded" \
  // -d "client_id=1654302068&client_secret=46033a00e60324f83577e02725247b92&access_token=hndXhxtnad2mzFVqU1URmzogvv4jGiA1YTKKHeQv6fq5biQiNwvl9U+DZ5FcNxkFFpP8nz59/ERBbeHXZdqwD/3L6CMNXQHAhyhTFQH2aG7LzPZfjP82XZehqEVgXo88rl1+n4oXpjrRQna73WwEbgdB04t89/1O/w1cDnyilFU="
});

// exports.profile = functions.https.onRequest(async (req, res) => {

//   res.set('Access-Control-Allow-Origin', '*');
//   res.set('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
//   res.set('Access-Control-Allow-Headers', '*');

//   let peaId = "";
//   if (req.method === "POST") {
//     peaId = req.body.peaId;
//   } else if (req.method === "GET") {
//     peaId = req.query.peaId;
//   }

//   await users.getPEAProfile(res, peaId);
// });

// exports.login = functions.https.onRequest(async (req, res) => {

//   res.set('Access-Control-Allow-Origin', '*');
//   res.set('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
//   res.set('Access-Control-Allow-Headers', '*');

//   let username = "";
//   let password = "";

//   if (req.method === "POST") {
//     username = req.body.username;
//     password = req.body.password;
//   }

//   await users.getPEALogin(res, username, password);
// });

const revoke = async (user_access_token) => {
  return await request({
    method: `POST`,
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    uri: LINE_AUTH_REVOKE,
    form: {
      "client_id": channelId,
      "client_secret": channelSecret,
      "access_token": user_access_token
    }
  }).then((data) => {
    return data;
  });
}

const push = (userId, text) => {
  let message = {
    type: 'text',
    text: text,
    "sender": {
      "name": "Alert",
      "iconUrl": "https://stickershop.line-scdn.net/stickershop/v1/sticker/52002749/iPhone/sticker_key@2x.png"
    }
  };

  client.pushMessage(userId, message)
    .then(() => {
      log("success");
    })
    .catch((err) => {
      // error handling
      log(err);
    });
}

const pushFlex = (userId, messageJson) => {
  let message = {
    "type": "flex",
    "altText": "flex",
    "contents": messageJson
  };

  client.pushMessage(userId, message)
    .then((data) => {
      console.log(data);
    })
    .catch((err) => {
      console.log(err);
      // error handling
    });
}

const pushFlexCustom = (userId, messageJson) => {
  let message = messageJson;

  client.pushMessage(userId, message)
    .then((data) => {
      console.log(data);
    })
    .catch((err) => {
      console.log(err);
      // error handling
    });
}

const notify = async (theRes, text) => {

  let headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': 'Bearer ' + notifyToken
  }

  let data = "message=" + text;

  await request({
    method: `POST`,
    headers: headers,
    uri: LINE_MESSAGING_API_NOTIFY,
    body: data
  }).then((res) => {
    console.log(data);
    theRes.status(200).json(data);
  });
}

const broadcast = async (theRes, text) => {

  let headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + channelAccessToken
  }

  let data = {
    "messages": [{
      "type": "text",
      "text": text
    }]
  };

  await request({
    method: `POST`,
    headers: headers,
    uri: LINE_MESSAGING_API_BROADCAST,
    body: JSON.stringify(data)
  }).then((res) => {
    console.log(data);
    theRes.status(200).json(data);
  });
}

const axios = require('axios');

exports.generateQr = builderFunction.onRequest(async (req,res)=>{

  let username = req.params.username;
  let qrcode = `https://chart.googleapis.com/chart?cht=qr&chs=200x200&chld=Q|1&chl=https%3A%2F%2Fliff.line.me%2F1655196636-nvdWB6xz%3Faction%3Dscan%26username%3D${username}`;
  let base64 = await getBase64(qrcode);

  var base64Data = base64.replace(/^data:image\/png;base64,/, '');
  console.log(base64Data)

  var img = Buffer.from(base64Data, 'base64');

  res.writeHead(200, {
     'Content-Type': 'image/png',
     'Content-Length': img.length
   });
   res.end(img);

})

let getBase64 = async (url) => {
  return await axios
    .get(url, {
      responseType: 'arraybuffer'
    })
    .then(response => Buffer.from(response.data, 'binary').toString('base64'))
}

const log = (json) => {
  console.log(JSON.stringify(json, null, 2));
}

//const { Storage } = require('@google-cloud/storage');
//const storage = new Storage();
//let publicUrl = "";
//({
//   projectId: fbId,
//   keyFilename: fbKeyFile
// });
//const bucket = storage.bucket(`${fbId}.appspot.com`);

var db = admin.database();
const bucket = admin.storage().bucket();
//var storage = admin.storage();
//var storageRef = storage.ref();
var ref = db.ref("accounts");
const saveLineMessage = async (bodyResponse) => {
  console.log(JSON.stringify(bodyResponse, null, 2));
  var postsRef;
  if (bodyResponse.events[0].source.type === "user") {
    postsRef = ref.child("" + bodyResponse.events[0].source.userId);
  } else if (bodyResponse.events[0].source.type === "room" || bodyResponse.events[0].source.type === "join") {
    postsRef = ref.child("" + bodyResponse.events[0].source.roomId);
  } else if (bodyResponse.events[0].source.type === "group") {
    postsRef = ref.child("" + bodyResponse.events[0].source.groupId);
  }

  var newPostRef = postsRef.push();
  log(newPostRef);
  //bodyResponse.events[0];
  newPostRef.set(bodyResponse.events[0]);

  //return res.status(200).send(`Saved`);
  return newPostRef;
}

exports.sendMail = builderFunction.onRequest((req, res) => {

  // getting dest email by query string
  const dest = req.query.dest;

  const msg = {
    to: dest,
    from: 'korr@aq1.co',
    subject: 'Sending with Twilio SendGrid is Fun',
    text: 'and easy to do anywhere, even with Node.js',
    html: '<strong>and easy to do anywhere, even with Node.js</strong>',
  };

  sgMail
    .send(msg)
    .then((data) => {
      res.status(200).json({ "data": data });
    }, error => {
      console.error(error);

      if (error.response) {
        console.error(error.response.body)
        res.status(200).json({ "data": error.response.body });
      }
    });
});

exports.fireMail = builderFunction.onRequest((req, res) => {
  firestore.collection('mail').add({
    to: 'iamnotkorr@gmail.com',
    message: {
      subject: 'Hello from Firebase!',
      text: 'This is the plaintext section of the email body.',
      html: 'This is the <code>HTML</code> section of the email body.',
    }
  }).then((data) => res.status(200).json({ "data": data }));
})





// exports.scheduled = functions.pubsub.schedule('every 1 second').onRun((context) => {
//     console.log('This will be run every 1 second!');
// })

// const { PubSub } = require('@google-cloud/pubsub');
// const pubsub = new PubSub();

// exports.pubsubWriter = functions.https.onRequest(async (req, res) => {
//     console.log("Pubsub Emulator:", process.env.PUBSUB_EMULATOR_HOST);

//     const msg = await pubsub.topic('test-topic').publishJSON({
//         foo: 'bar',
//         date: new Date()
//     }, { attr1: 'value' });

//     res.json({
//         published: msg
//     })
// });

const fizzBuzz = (x) => {
  return {
    'falsetrue': 'Fizz',
    'truefalse': 'Buzz',
    'falsefalse': 'FizzBuzz',
    'truetrue': x,
  } [`${!!(x%3)}${!!(x%5)}`]
}

String.prototype.sprintf = function() {
  var counter = 0;
  var args = arguments;

  return this.replace(/%s/g, function() {
    return args[counter++];
  });
};

const { Parser } = require('json2csv');
const _ = require('lodash');
const { google } = require('googleapis');
const sheets = google.sheets('v4')

const spreadsheetId = '1aowp6T-uMZAJ7El-Uz0qL3c0TubloXqX5msyfpJ3DlY'

const jwtClient = new google.auth.JWT({
  email: serviceAccount.client_email,
  key: serviceAccount.private_key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'], // read and write sheets
})
const jwtAuthPromise = jwtClient.authorize()

exports.copyToSheet = functions.region('asia-east2').database.ref('/events/1aowp6T-uMZAJ7El-Uz0qL3c0TubloXqX5msyfpJ3DlY').onUpdate(async events => {
  const data = events.after.val();
  console.log("data");
  console.log(data)

  let returnData = [];
  // Sort the scores.  scores is an array of arrays each containing name and score.
  // const actions = _.map(data.events, (value, key) => {
  //   if (value) {
  //     action = [
  //       value.id,
  //       value.user1,
  //       value.user1_name,
  //       value.user1_avatar,
  //       value.action,
  //       value.user2,
  //       value.user2_name,
  //       value.user2_avatar,
  //       value.timestamp
  //     ];
  //     returnData.push(action);
  //     return action;
  //   } else {
  //     return;
  //   }
  // })

  for (var key in data) {
    if (data.hasOwnProperty(key)) {
      console.log(key + " -> " + data[key]);
      let value = data[key];
      action = [
        value.id,
        value.user1,
        value.user1_name,
        value.user1_avatar,
        value.action,
        value.user2,
        value.user2_name,
        value.user2_avatar,
        value.timestamp
      ];
      returnData.push(action);
    }
  }

  console.log("actions");
  console.log(returnData);
  // scores.sort((a,b) => { return b[1] - a[1] })
  // [id  user1  user1_name  user1_avatar  action  user2  user2_name  user2_avatar  timestamp]
  // ["Uxxxxxx","korr  https://yes.png  share  Uxxxxxx  pom  https://no.png  111111111111"]



  await jwtAuthPromise
  await sheets.spreadsheets.values.update({
    auth: jwtClient,
    spreadsheetId: spreadsheetId,
    range: 'events!A2:I30', // update this range of cells
    valueInputOption: 'RAW',
    requestBody: { values: returnData }
  }, {})
})

// const OPENWEATHER_APPID = "47f8380e1059b8129811e18df7ce3744"

// exports.scheduledFunction = functions.region('asia-east2').pubsub.schedule("* * * * *").timeZone('Asia/Bangkok').onRun((context) => {
//   return request({
//     method: "GET",
//     uri: `https://api.openweathermap.org/data/2.5/weather?appid=${OPENWEATHER_APPID}&units=metric&type=accurate&zip=10330,th`,
//     json: true
//   }).then(response => {
//     const message = `City: ${response.name}\nTemperature: ${response.main.temp} by Korr`;
//     return request({
//       method: "GET",
//       uri: `https://us-central1-pea-datalab.cloudfunctions.net/LineBotNotify?text=${message}`,
//     }).then(() => {
//       return console.info("Done");
//     }).catch(error => {
//       return Promise.reject(error);
//     });
//   }).then(() => {
//     return console.info("Done");
//   }).catch(error => {
//     return Promise.reject(error);
//   });
// })