const request = require("request-promise");
const UUID = require("uuid-v4");
const admin = require("firebase-admin");

const { searchAddressByDistrict } = require('thai-address-database');

var fs = require('fs');

var BusinessCardParser = require("./reader/BusinessCardParser.js");
var ContactInfo = require("./reader/ContactInfo.js");
var parser, info

module.exports = {
  pushFlex: (userId, messageJson) => {
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
  },
  sum: (a, b) => { return a + b },
  multiply: (a, b) => { return a * b },
  handleEvent: (event) => {
    if (event.replyToken && event.replyToken.match(/^(.)\1*$/)) {
      return console.log("Test hook recieved: " + JSON.stringify(event.message));
    }

    switch (event.type) {
      case 'message':
        const message = event.message;
        switch (message.type) {
          case 'text':
            return handleText(message, event.replyToken, event.source);
          case 'image':
            return handleImage(message, event.replyToken, event);
            // case 'video':
            //   return handleVideo(message, event.replyToken);
            // case 'audio':
            //   return handleAudio(message, event.replyToken);
            // case 'location':
            //   return handleLocation(message, event.replyToken);
            // case 'sticker':
            //   return handleSticker(message, event.replyToken);
          default:
            throw new Error(`Unknown message: ${JSON.stringify(message)}`);
        }

      case 'follow':
        // check user isRegistered 
        // push register flex if isRegistered is true.
        return replyText(event.replyToken, 'Got followed event');

      case 'unfollow':
        return console.log(`Unfollowed this bot: ${JSON.stringify(event)}`);

      case 'join':
        return replyText(event.replyToken, `Joined ${event.source.type}`);

      case 'leave':
        return console.log(`Left: ${JSON.stringify(event)}`);

      case 'postback':
        let data = event.postback.data;
        if (data === 'DATE' || data === 'TIME' || data === 'DATETIME') {
          data += `(${JSON.stringify(event.postback.params)})`;
        }
        return replyText(event.replyToken, `Got postback: ${data}`);

      case 'beacon':
        return replyText(event.replyToken, `Got beacon: ${event.beacon.hwid}`);

      default:
        throw new Error(`Unknown event: ${JSON.stringify(event)}`);
    }
  },

}

const channelId = '1655196638';
const channelSecret = 'b20c850a5e5c190c0475c77339e1aa0f';
const channelAccessToken = 'Unw6fo+VLyL+fJm7EA91bzpAKwLnfizWI5v03aRAx49tDz6hybYvoyovgrc02zFgUCDjSKju8bCqkWHK0bC8TItfdJJYbUMth64pqWAu17uvKXZmmuM8LxuFaSnytlbzneUzVOv8szHS51YBwY1fgAdB04t89/1O/w1cDnyilFU=';
const notifyToken = 'lgBzFsbK9W9pmZPVcpOmWDwSsGFY5FweCEWtnO3dTS7';

const line = require('@line/bot-sdk');
const client = new line.Client({
  channelAccessToken,
  channelSecret
});

const menuJson = require("./rich/menu.json");
const bubble = require("./rich/bubble.json");
const bubblePea = require("./rich/bubblePea.json");
const eventFlex = require("./rich/eventFlex.json");
const eventShareFlex = require("./rich/eventShareFlex.json");
const reportFlex = require("./rich/reportFlex.json");

var share = require('./share');

const pureFlex = require("./rich/pureFlex.json");
const sampleFlex = require("./rich/sampleFlex.json");

function extractEmails(text) {
  return text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi);
}

const handleText = async (message, replyToken, source) => {
  let baseURL = "http://line-hack.web.app";
  const buttonsImageURL = `${baseURL}/static/buttons/1040.jpg`;
  let theText = message.text;
  let str = message.text;

  parser = new BusinessCardParser("m", str)
  info = parser.getContactInfo(parser.document);

  console.log("Name: " + info.getName());
  console.log("Phone: " + info.getPhoneNumber());
  console.log("Email: " + info.getEmailAddress());

  let returnStr = "Name: " + info.getName() + "\n";
  returnStr += "Phone: " + info.getPhoneNumber() + "\n";
  returnStr += "Email: " + info.getEmailAddress() + "\n";
  //return replyText(replyToken, returnStr);

  let name = info.getName();
  let email = info.getEmailAddress();
  let phone = info.getPhoneNumber();

  let length = str.split(/\r\n|\r|\n/).length;

  if(length>1) {
     let returnedRegisterCard = await share.getRegister(name,email,phone);
    return replyFlex(replyToken, returnedRegisterCard);
  }


 

  switch (message.text) {
    case 'Save': 
    case 'save': 
    case 'collect': 
    case 'Collect':
      return replyText(replyToken, "Saved to LINE Collect");
      // let returnedRegisterCard = await share.getRegister();
      // return replyFlex(replyToken, returnedRegisterCard);

      // case (str.match(/(\d{6})/) || {}).input:
      //   //let returnedProfileText = await share.getProfileFromPEA(source.userId);
      //   return replyText(replyToken, source.userId);

    case (str.match(/([A-Z]{3})-(\d{4})/) || {}).input:
      let arr = str.match(/([A-Z]{3})-(\d{4})/);
      console.log(arr[0]);
      return replyFlex(replyToken, await share.getShare(arr[0]));

      // case 'share':
      //   return replyFlex(replyToken, await share.getShare("LBA-0034"));
      // case 'event':
      //   return replyFlex(replyToken, await share.getEvent("LBA-0034"));

    case 'menu':
      return replyFlex(replyToken, bubblePea);

    case 'profile':
      if (source.userId) {
        return client.getProfile(source.userId)
          .then((profile) => replyText(
            replyToken,
            [
              `Display name: ${profile.displayName}`,
              `Status message: ${profile.statusMessage}`,
              `User ID: ${profile.userId}`
            ]
          ));
      } else {
        return replyText(replyToken, 'Bot can\'t use profile API without user ID');
      }
    case 'buttons':
      return client.replyMessage(
        replyToken, {
          type: 'template',
          altText: 'Buttons alt text',
          template: {
            type: 'buttons',
            thumbnailImageUrl: buttonsImageURL,
            title: 'My button sample',
            text: 'Hello, my button',
            actions: [
              { label: 'Go to line.me', type: 'uri', uri: 'https://line.me' },
              { label: 'Say hello1', type: 'postback', data: 'hello こんにちは' },
              { label: '言 hello2', type: 'postback', data: 'hello こんにちは', text: 'hello こんにちは' },
              { label: 'Say message', type: 'message', text: 'Rice=米' },
            ],
          },
        }
      );
    case 'confirm':
      return client.replyMessage(
        replyToken, {
          type: 'template',
          altText: 'Confirm alt text',
          template: {
            type: 'confirm',
            text: 'Do it?',
            actions: [
              { label: 'Yes', type: 'message', text: 'Yes!' },
              { label: 'No', type: 'message', text: 'No!' },
            ],
          },
        }
      )
    case 'carousel':
      return client.replyMessage(
        replyToken, {
          type: 'template',
          altText: 'Carousel alt text',
          template: {
            type: 'carousel',
            columns: [{
                thumbnailImageUrl: buttonsImageURL,
                title: 'hoge',
                text: 'fuga',
                actions: [
                  { label: 'Go to line.me', type: 'uri', uri: 'https://line.me' },
                  { label: 'Say hello1', type: 'postback', data: 'hello こんにちは' },
                ],
              },
              {
                thumbnailImageUrl: buttonsImageURL,
                title: 'hoge',
                text: 'fuga',
                actions: [
                  { label: '言 hello2', type: 'postback', data: 'hello こんにちは', text: 'hello こんにちは' },
                  { label: 'Say message', type: 'message', text: 'Rice=米' },
                ],
              },
            ],
          },
        }
      );
    case 'image carousel':
      return client.replyMessage(
        replyToken, {
          type: 'template',
          altText: 'Image carousel alt text',
          template: {
            type: 'image_carousel',
            columns: [{
                imageUrl: buttonsImageURL,
                action: { label: 'Go to LINE', type: 'uri', uri: 'https://line.me' },
              },
              {
                imageUrl: buttonsImageURL,
                action: { label: 'Say hello1', type: 'postback', data: 'hello こんにちは' },
              },
              {
                imageUrl: buttonsImageURL,
                action: { label: 'Say message', type: 'message', text: 'Rice=米' },
              },
              {
                imageUrl: buttonsImageURL,
                action: {
                  label: 'datetime',
                  type: 'datetimepicker',
                  data: 'DATETIME',
                  mode: 'datetime',
                },
              },
            ]
          },
        }
      );
    case 'datetime':
      return client.replyMessage(
        replyToken, {
          type: 'template',
          altText: 'Datetime pickers alt text',
          template: {
            type: 'buttons',
            text: 'Select date / time !',
            actions: [
              { type: 'datetimepicker', label: 'date', data: 'DATE', mode: 'date' },
              { type: 'datetimepicker', label: 'time', data: 'TIME', mode: 'time' },
              { type: 'datetimepicker', label: 'datetime', data: 'DATETIME', mode: 'datetime' },
            ],
          },
        }
      );
    case 'imagemap':
      return client.replyMessage(
        replyToken, {
          type: 'imagemap',
          baseUrl: `${baseURL}/static/rich`,
          altText: 'Imagemap alt text',
          baseSize: { width: 1040, height: 1040 },
          actions: [
            { area: { x: 0, y: 0, width: 520, height: 520 }, type: 'uri', linkUri: 'https://store.line.me/family/manga/en' },
            { area: { x: 520, y: 0, width: 520, height: 520 }, type: 'uri', linkUri: 'https://store.line.me/family/music/en' },
            { area: { x: 0, y: 520, width: 520, height: 520 }, type: 'uri', linkUri: 'https://store.line.me/family/play/en' },
            { area: { x: 520, y: 520, width: 520, height: 520 }, type: 'message', text: 'URANAI!' },
          ],
          video: {
            originalContentUrl: `${baseURL}/static/imagemap/video.mp4`,
            previewImageUrl: `${baseURL}/static/imagemap/preview.jpg`,
            area: {
              x: 280,
              y: 385,
              width: 480,
              height: 270,
            },
            externalLink: {
              linkUri: 'https://line.me',
              label: 'LINE'
            }
          },
        }
      );
    case 'bye':
      switch (source.type) {
        case 'user':
          return replyText(replyToken, 'Bot can\'t leave from 1:1 chat');
        case 'group':
          return replyText(replyToken, 'Leaving group')
            .then(() => client.leaveGroup(source.groupId));
        case 'room':
          return replyText(replyToken, 'Leaving room')
            .then(() => client.leaveRoom(source.roomId));
      }
    default:
      console.log(`Echo message to ${replyToken}: ${message.text}`);
      return replyText(replyToken, message.text);
  }
}

const handleImage = async (message, replyToken, event) => {
  // เรียกฟังก์ชัน upload เมื่อเข้าเงื่อนไข
  let urls = await upload(event)

  // reply ตัว URL ที่ได้กลับไปยังห้องแชท
  await reply(event.replyToken, { type: "text", text: urls.original })
};

const replyText = (replyToken, texts) => {
  texts = Array.isArray(texts) ? texts : [texts];
  return client.replyMessage(
    replyToken,
    texts.map((text) => ({ type: 'text', text }))
  )
}

const replyCarousel = (replyToken, messageJson) => {
  let message = {
    "type": "template",
    "altText": "menu carousel",
    "template": messageJson
  };
  console.log(JSON.stringify(message));
  client.replyMessage(replyToken, message)
    .then((data) => {
      console.log(data);
    })
    .catch((err) => {
      console.log(err);
    });
}

const replyFlex = (replyToken, messageJson) => {
  let message = {
    "type": "flex",
    "altText": "flex",
    "contents": messageJson
  };
  client.replyMessage(replyToken, message)
    .then((data) => {
      console.log(data);
    })
    .catch((err) => {
      console.log(err);
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

const replyFlexCustom = (replyToken, messageJson) => {
  client.replyMessage(replyToken, messageJson)
    .then((data) => {
      console.log(data);
    })
    .catch((err) => {
      console.log(err);
    });
}

const upload = async (event) => {
  const path = require('path');
  const os = require('os');
  const fs = require('fs');

  let LINE_CONTENT_API = 'https://api-data.line.me/v2/bot/message'
  let channelAccessToken = 'J5C9WZWRRgDvXgCZrdiQ/awKytSxqdtuwH26KXmvHbps/CHFYjWzib+lUBay7VWcFpP8nz59/ERBbeHXZdqwD/3L6CMNXQHAhyhTFQH2aG5zYXbdwG4J+eXi/fjgukVkHBvDR4q8grLY2DvQvgi6GgdB04t89/1O/w1cDnyilFU=';

  let LINE_HEADER = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${channelAccessToken}`
  };
  let url = `${LINE_CONTENT_API}/${event.message.id}/content`
  let buffer = await request.get({
    headers: LINE_HEADER,
    uri: url,
    encoding: null
  })

  let filename = `${event.timestamp}.jpg`
  let tempLocalFile = path.join(os.tmpdir(), filename)
  await fs.writeFileSync(tempLocalFile, buffer)

  let uuid = UUID()
  let bucket = admin.storage().bucket()
  let file = await bucket.upload(tempLocalFile, {
    destination: `photos/${event.source.userId}/${filename}`,
    metadata: {
      cacheControl: 'no-cache',
      metadata: {
        firebaseStorageDownloadTokens: uuid
      }
    }
  })
  fs.unlinkSync(tempLocalFile)

  let prefix = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o`
  let suffix = `alt=media&token=${uuid}`
  return {
    original: `${prefix}/${encodeURIComponent(file[0].name)}?${suffix}`,
    thumb: `${prefix}/photos${encodeURIComponent(`/${event.source.userId}/thumbs/${event.timestamp}_200x200.jpg`)}?${suffix}`
  }
}

const reply = (replyToken, payload) => {
  console.log(payload);
  let LINE_MESSAGING_API = "https://api.line.me/v2/bot";
  let LINE_HEADER = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${channelAccessToken}`
  };
  request.post({
    uri: `${LINE_MESSAGING_API}/message/reply`,
    headers: LINE_HEADER,
    body: JSON.stringify({
      replyToken: replyToken,
      messages: [payload]
    })
  })
}

const getAI = (payload) => {
  request.get({
    uri: `${LINE_MESSAGING_API}/message/reply`,
    body: JSON.stringify(payload)
  })
}

const getFollowers = () => {
  //   curl -v -X GET https://api.line.me/v2/bot/followers/ids\?start\=\{continuationToken\} \
  // -H 'Authorization: Bearer {channel access token}'
}