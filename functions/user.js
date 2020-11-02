const functions = require('firebase-functions');
const runtimeOptions = {
  timeoutSeconds: 4,
  memory: "2GB"
};
const builderFunction = functions.region('asia-east2').runWith(runtimeOptions).https;

// const admin = require('firebase-admin');
// const rtdb = admin.database();

const axios = require('axios');
const express = require('express');
const request = require("request-promise");
const xml2js = require('xml2js');
//const seq = require('sequelize');

const appUser = express();
var cors = require('cors')
appUser.use(cors());

const Pool = require('pg').Pool
const pool = new Pool({
  user: 'postgres',
  password: 'rcsquare',
  host: '167.71.213.91',
  database: 'rc2_pea',
  port: 5432,
})

// var PGPubsub = require('pg-pubsub');
// var pubsubInstance = new PGPubsub('postgres://postgres:rcsquare@167.71.213.91/rc2_pea');

// pubsubInstance.addChannel('notify_channel', function(channelPayload) {
//   console.log("addChannel", channelPayload)
//   // Process the payload – if it was JSON that JSON has been parsed into an object for you
// });

// pubsubInstance.once('notify_channel', function(channelPayload) {
//   console.log("once", channelPayload)
//   // Process the payload
//   let notiText = JSON.stringify(channelPayload);
//   let noti = "https://rc2-data.aq1.co/pea-datalab/us-central1/LineBotNotify?text=" + notiText;
//   return axios.get(noti).then(function(response) {
//     console.log("Notified to LINE")
//   })
// });

var db = require('./models');
let User = db.lineapi_profile;

// appUser.get('/', function(req, res) {
//   var ref = rtdb.ref("users");
//   ref.once("value", function(snapshot) {
//     res.contentType('application/json');
//     res.send(JSON.stringify(snapshot.val()));
//   });
//   return res;
// })

// appUser.get('/profile/seq', async function(req, res) {
//   let json = '{"hello":"world"}';
//   User.query(`NOTIFY 'notify_channel', '${json}'`).spread(function(results, metadata) {
//     // Results will be an empty array and metadata will contain the number of affected rows.
//     console.log("result", JSON.stringify(metadata))
//     console.log("result", JSON.stringify(results))
//     res.status(200).json(results);
//   })
// })

appUser.get('/profile/line/:lineId/register', async function(req, res) {

  deCORS(req, res);

  let lineId = req.params.lineId;
  let isRegistered = await isMember(lineId);
  let theResult = { "line_id": lineId, "isRegistered": isRegistered };

  //pubsubInstance.publish('notify_channel', theResult);
  return res.status(200).json(theResult);
})

appUser.get('/profile/all', function(req, res) {

  deCORS(req, res);

  let userId = req.params.userId;
  User.findAll()
    .then(function(result) {
      if (result)
        res.status(200).json(result);
    });
})

// const checkExistingProfile = async (line_id) => {

//   return await User.findAll({
//       where: {
//         line_id: line_id
//       }
//     })
//     .then((result) => {
//       if (result)
//         return true;
//       else
//         return false;
//     });
// }

function isIdUnique(line_id) {
  return User.count({ where: { line_id: line_id } })
    .then(count => {
      if (count != 0) {
        return false;
      }
      return true;
    });
}

appUser.post('/profile/create', async function(req, res) {

  deCORS(req, res);

  let theUser = req.body;
  console.log(theUser.line_id);

  isIdUnique(theUser.line_id).then(isUnique => {
    if (!isUnique) {
      User.update(theUser, {
          where: { "line_id": theUser.line_id },
          returning: true
        })
        .then(function(result) {
          if (result) {
            //pubsubInstance.publish('notify_channel', result);
            res.status(200).json(result);
          }
        })
        .catch(function(err) {
          console.error(err);
          res.status(500).json({ "error": err });
        })
    } else {
      User.create(theUser)
        .then(function(result) {
          if (result) {
            //pubsubInstance.publish('notify_channel', result);
            res.status(200).json(result);
          }
        })
        .catch(function(err) {
          console.error(err);
          res.status(500).json({ "error": err });
        });
    }
  });

})

appUser.get('/profile/:userId', function(req, res) {

  deCORS(req, res);

  let userId = req.params.userId;
  User.findAll({
      where: {
        username: userId
      }
    })
    .then(function(result) {
      if (result)
        res.status(200).json(result);
    });
})

appUser.get('/profile/line/:lineId', function(req, res) {

  deCORS(req, res);

  let lineId = req.params.lineId;
  User.findAll({
      where: {
        line_id: lineId
      }
    })
    .then(function(result) {
      if (result)
        res.status(200).json(result);
    });
})

appUser.post('/profile/line/:lineId/update', function(req, res) {

  deCORS(req, res);

  let updateObj = req.body;
  let lineId = req.params.lineId;
  User.update(updateObj, {
      where: { "line_id": lineId }
    })
    .then(function(result) {
      if (result) {
        //pubsubInstance.publish('notify_channel', result);
        res.status(200).json(result);
      }
    });
})

appUser.post('/profile/:userId/update', function(req, res) {

  deCORS(req, res);

  let updateObj = req.body;
  let userId = req.params.userId;
  User.update(updateObj, {
      where: { "pea_id": userId }
    })
    .then(function(result) {
      if (result) {
        //pubsubInstance.publish('notify_channel', result);
        res.status(200).json(result);
      }
    });
})

let deCORS = (req, res) => {
  if (req.method === 'OPTIONS') {
    res.end();
  }

  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', '*');
}

appUser.post('/profile/:userId/delete', function(req, res) {

})

let isMember = async (lineId) => {
  return await User.findAll({
      where: {
        line_id: lineId
      }
    })
    .then(function(result) {
      if (result[0])
        return true;
      else
        return false;
    });
}

exports.users = builderFunction.onRequest(appUser);