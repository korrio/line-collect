const request = require("request-promise");
const axios = require('axios');

const Pool = require('pg').Pool
const pool = new Pool({
  user: 'postgres',
  password: 'rcsquare',
  host: '167.71.213.91',
  database: 'rc2_pea',
  port: 5432,
})

const getAIfn = async (params) => {
  let predict_api = "http://rc2-ml.aq1.co/api/predict";
  return axios.post(predict_api, params)
    .then((response) => {
      // handle success
      if (response.data) {
        return response.data.prediction
      } else {
        return -1;
      }

    })
    .catch(function(error) {
      // handle error
      console.log(error);
    })
    .finally(async () => {

    });
  //return 1;
}

module.exports = {
  getAI: async (event_id) => {
    let query = `SELECT e.*,ca.id,ca.cause_name,e.lat as lat, e.lon as lon,station.lat as station_lat, station.lon as station_lon, station.subname as "Staion"
    FROM lineapi_lineevent e, 
    lineapi_cause ca, 
    "apiSAIFI_peastation" station, 
    "apiSAIFI_peacode" peacode
     WHERE e.event_id = '${event_id}' 
     AND e.peacode = station.subcode
     AND e.area = LPAD(peacode."Br_code", 7, '0') 
     AND ca."cause_id" = e.maincause  
     GROUP BY e.peacode,e.id,station.subcode,peacode."Br_code",ca.id`;
    console.log(query);
    let queryResult = await pool.query(query);
    console.log(queryResult.rows);
    let eventObj = queryResult.rows[0];
    let v = eventObj;

    console.log("STATE:" + eventObj.state);

    let root_cause = [
      "🌳 ต้นไม้",
      "⚙️ อุปกรณ์",
      "พนักงานกฟภ.",
      "บุคคลภายนอก",
      "🐿️ สัตว์",
      "ยานพาหนะ",
      "🛠️ วัสดุแปลกปลอม",
      "🍃 สภาพแวดล้อม",
      "⛈️ ภัยธรรมชาติ",
      "สงครามจราจล",
      "จ่ายเกินพิกัด",
      "อื่นๆ"
    ];

    let timehappen = (eventObj.timehappen).split(":");
    let hour = parseInt(timehappen[0]);
    let minute = parseInt(timehappen[1]);

    let subhappenareaCode = (eventObj.subhappenarea).substring(4, 5);
    let PEALv = subhappenareaCode == 1 ? 1 : 2;
    let Weather = 1;

    // WC01 อากาศปกติ
    // WC02 อากาศชื้น,หมอก
    // WC03 ลมแรง
    // WC04 ฝนตก
    // WC05 ฝนตก ลมแรง
    // WC06 ฝนตก ฟ้าคะนอง

    let datehappen = new Date((eventObj.datehappen).toString());

    let month = datehappen.getMonth() + 1;
    let day = datehappen.getDate();
    let weekday = (datehappen.getDay()) + 1;

    let equipcode = eventObj.equipcode;
    let EquipWork_B, EquipWork_F, EquipWork_R = 0;

    if (equipcode.includes("B")) {
      EquipWork_B = 1;
      EquipWork_F = 0;
      EquipWork_R = 0;
    } else if (equipcode.includes("F")) {
      EquipWork_B = 0;
      EquipWork_F = 1;
      EquipWork_R = 0;
    } else {
      EquipWork_B = 0;
      EquipWork_F = 0;
      EquipWork_R = 1;
    }

    let params = {
      "hour": hour,
      "minute": minute,
      "PEALv": PEALv,
      "Weather": Weather,
      "day": day,
      "month": month,
      "Date": weekday,
      "EquipWork_B": EquipWork_B,
      "EquipWork_F": EquipWork_F,
      "EquipWork_R": EquipWork_R
    };
    console.log(params);
    let predict = await getAIfn(params);
    let random_ai = root_cause[predict - 1];
    return { predict: predict, predict_desc: random_ai };
  },
  getShare: async (event_id) => {
    let flex = require("./rich/shareEventWaitProcessFlex.json");
    let flexString = JSON.stringify(flex);

    let query = `SELECT e.*,ca.id,ca.cause_name,e.lat as lat, e.lon as lon,station.lat as station_lat, station.lon as station_lon, station.subname as "Staion"
    FROM lineapi_lineevent e, 
    lineapi_cause ca, 
    "apiSAIFI_peastation" station, 
    "apiSAIFI_peacode" peacode
     WHERE e.event_id = '${event_id}' 
     AND e.peacode = station.subcode
     AND e.area = LPAD(peacode."Br_code", 7, '0') 
     AND ca."cause_id" = e.maincause  
     GROUP BY e.peacode,e.id,station.subcode,peacode."Br_code",ca.id`;
    console.log(query);
    let queryResult = await pool.query(query);
    console.log(queryResult.rows);
    let eventObj = queryResult.rows[0];
    let v = eventObj;

    console.log("STATE:" + eventObj.state);

    let status = [
      "https://firebasestorage.googleapis.com/v0/b/pea-datalab.appspot.com/o/photos%2FU092c564a64d482c176129cd4bc0b1bac%2F1592890877769.jpg?alt=media&token=33252c3b-9f0a-4ffb-acd2-b5bd2686a083", // รอดำเนินการ
      "https://firebasestorage.googleapis.com/v0/b/pea-datalab.appspot.com/o/photos%2FU8223ae525409711570cc3121d9d63821%2F1593494720774.jpg?alt=media&token=91c0279f-5fa7-434c-b55f-83ae658daef5", // รอยืนยัน // ค้นหาสาเหตุแล้ว
      "https://firebasestorage.googleapis.com/v0/b/pea-datalab.appspot.com/o/photos%2FU8223ae525409711570cc3121d9d63821%2F1593494750017.jpg?alt=media&token=e604fca6-9ee0-481c-a7d6-6d928bf1f29b", // เรียบร้อยแล้ว // จ่ายไฟแล้ว
    ];

    if (eventObj.state == 0) {

      flex = require("./rich/shareEventWaitProcessFlex.json");
      flexString = JSON.stringify(flex);

      let t = Math.floor(Date.now() / 1000);

      let share_url = `https://liff.line.me/1654302066-56bnGA8b?event_id=${eventObj.event_id}&v=${t}`;
      let technical_url = `https://rc2.aq1.co/admin/technical.html?event_id=${eventObj.event_id}&v=${t}`

      let root_cause = [
        "🌳 ต้นไม้",
        "⚙️ อุปกรณ์",
        "พนักงานกฟภ.",
        "บุคคลภายนอก",
        "🐿️ สัตว์",
        "ยานพาหนะ",
        "🛠️ วัสดุแปลกปลอม",
        "🍃 สภาพแวดล้อม",
        "⛈️ ภัยธรรมชาติ",
        "สงครามจราจล",
        "จ่ายเกินพิกัด",
        "อื่นๆ"
      ];
      //let random_cause = ["🌳 ต้นไม้", "⚙️ อุปกรณ์", "🐿️ สัตว์", "🛠️ วัสดุแปลกปลอม", "🍃 สภาพแวดล้อม", "⛈️ ภัยธรรมชาติ"];

      //let random_ai = random_cause[Math.floor(Math.random() * random_cause.length)];

      let timehappen = (eventObj.timehappen).split(":");
      let hour = parseInt(timehappen[0]);
      let minute = parseInt(timehappen[1]);

      let subhappenareaCode = (eventObj.subhappenarea).substring(4, 5);
      let PEALv = subhappenareaCode == 1 ? 1 : 2;
      let Weather = 1;

      // WC01 อากาศปกติ
      // WC02 อากาศชื้น,หมอก
      // WC03 ลมแรง
      // WC04 ฝนตก
      // WC05 ฝนตก ลมแรง
      // WC06 ฝนตก ฟ้าคะนอง

      let datehappen = new Date((eventObj.datehappen).toString());

      let month = datehappen.getMonth() + 1;
      let day = datehappen.getDate();
      let weekday = (datehappen.getDay()) + 1;

      let equipcode = eventObj.equipcode;
      let EquipWork_B, EquipWork_F, EquipWork_R = 0;

      if (equipcode.includes("B")) {
        EquipWork_B = 1;
        EquipWork_F = 0;
        EquipWork_R = 0;
      } else if (equipcode.includes("F")) {
        EquipWork_B = 0;
        EquipWork_F = 1;
        EquipWork_R = 0;
      } else {
        EquipWork_B = 0;
        EquipWork_F = 0;
        EquipWork_R = 1;
      }

      // let hour = 19,
      //   minute = 0,
      //   PEALv = 1,
      //   Weather = 6,
      //   day = 16,
      //   month = 4,
      //   theDate = 3,
      //   EquipWork_B = 0,
      //   EquipWork_F = 1,
      //   EquipWork_R = 0;

      // let str = 'stackabuse';
      // let substr = 'stack';
      // str.includes(substr);

      let params = {
        "hour": hour,
        "minute": minute,
        "PEALv": PEALv,
        "Weather": Weather,
        "day": day,
        "month": month,
        "Date": weekday,
        "EquipWork_B": EquipWork_B,
        "EquipWork_F": EquipWork_F,
        "EquipWork_R": EquipWork_R
      };
      console.log(params);
      let predict = await getAIfn(params);
      let random_ai = root_cause[predict - 1];

      let relayArr = [];
      relayArr["0"] = "ไม่ระบุ";
      relayArr["50"] = "Overcurrent Relay";
      relayArr["87B"] = "Bus Differential Relay";
      relayArr["87T"] = "Transformer Differential";
      relayArr["21"] = "Distance Relay";

      let relay = relayArr[eventObj.relay];
      let load_show = "-";
      let phase_show = "-";

      phase_show = getPhaseShow(v);
      load_show = getLoadShow(v);

      let theDateHappen = new Date(eventObj.datehappen).toISOString().slice(0, 10);
      let theDateCreated = new Date(eventObj.createdAt).toISOString().slice(0, 10)

      flexString = flexString.replace("{{equipcode}}", eventObj.equipcode)
        .replace("{{status}}", status[eventObj.state])

        .replace("{{datecreated}}", theDateCreated)
        .replace("{{datehappen}}", theDateHappen)
        .replace("{{timehappen}}", (eventObj.timehappen).toString().substring(0, 5))
        .replace("{{station}}", eventObj.Staion)

        .replace("{{relay}}", relay)
        .replace("{{fedderwork}}", eventObj.fedderwork)
        .replace("{{phase}}", load_show)
        .replace("{{phase_show}}", phase_show)

        .replace("{{weather}}", eventObj.weather)
        .replace("{{detail}}", eventObj.detail ? eventObj.detail : "-")
        .replace("{{ai}}", random_ai)
        .replace("{{ai_confident}}", "66%")

        .replace("{{share}}", share_url)
        .replace("{{technical}}", technical_url)

        .replace("{{event_id}}", eventObj.event_id);
    } else if (eventObj.state == 1) {
      flex = require("./rich/shareEventWaitConfirmFlex.json");
      flexString = JSON.stringify(flex);

      let now = Math.floor(Date.now() / 1000);

      let share_url = `https://liff.line.me/1654302066-56bnGA8b?event_id=${eventObj.event_id}&v=${now}`;
      let technical_url = `https://rc2.aq1.co/admin/technical.html?event_id=${eventObj.event_id}&v=${now}`

      let theDateHappen = new Date(eventObj.datehappen).toISOString().slice(0, 10);
      let theDateCreated = new Date(eventObj.createdAt).toISOString().slice(0, 10);
      let theDateRestore = new Date(eventObj.daterestore).toISOString().slice(0, 10)
      flexString = flexString.replace("{{equipcode}}", eventObj.equipcode)
        .replace("{{datehappen}}", theDateHappen)
        .replace("{{timehappen}}", (eventObj.timehappen).toString().substring(0, 5))
        .replace("{{daterestore}}", theDateRestore)
        .replace("{{timerestore}}", (eventObj.timerestore).toString().substring(0, 5))
        .replace("{{timerestore}}", (eventObj.timerestore).toString().substring(0, 5))
        .replace("{{weather}}", eventObj.weather)
        .replace("{{event_id}}", eventObj.event_id)
        .replace("{{cause_name}}", eventObj.cause_name)
        .replace("{{station}}", eventObj.Staion)

        .replace("{{share}}", share_url)
        .replace("{{technical}}", technical_url)

        .replace("{{detail}}", eventObj.detail ? eventObj.detail : "-");

      let imagesFromUpload = await request.get({
        uri: `https://aq1.co/the-uploader/files/?event_id=${event_id}`,
      });

      let fileObj = JSON.parse(imagesFromUpload)

      let placeholder_url = "https://firebasestorage.googleapis.com/v0/b/rcsquare-peathailand.appspot.com/o/rc2-img-thumb(1).png?alt=media&token=1dcddadf-9b96-41ef-8b34-dbf7415daaf9";

      let count = 0;
      fileObj.files.forEach(function(entry) {
        count++;
        let imageEndpointUrl = `https://aq1.co/the-uploader/files/${event_id}/${entry}`;
        console.log(imageEndpointUrl);
        flexString = flexString.replace("{{image}}", imageEndpointUrl);
        flexString = flexString.replace("{{image_share}}", imageEndpointUrl);
      });

      flexString = flexString.replace("{{image}}", placeholder_url);
      flexString = flexString.replace("{{image}}", placeholder_url);
      flexString = flexString.replace("{{image}}", placeholder_url);

      flexString = flexString.replace("{{image_share}}", placeholder_url);
      flexString = flexString.replace("{{image_share}}", placeholder_url);
      flexString = flexString.replace("{{image_share}}", placeholder_url);

      let relayArr = [];
      relayArr["0"] = "ไม่ระบุ";
      relayArr["50"] = "Overcurrent Relay";
      relayArr["87B"] = "Bus Differential Relay";
      relayArr["87T"] = "Transformer Differential";
      relayArr["21"] = "Distance Relay";

      let relay = relayArr[eventObj.relay];
      let load_show = "-";
      let phase_show = "-";

      phase_show = getPhaseShow(v);
      load_show = getLoadShow(v);

      flexString = flexString.replace("{{equipcode}}", eventObj.equipcode)
        .replace("{{status}}", status[eventObj.state])

        .replace("{{datecreated}}", theDateCreated)
        .replace("{{datehappen}}", theDateHappen)
        .replace("{{timehappen}}", (eventObj.timehappen).toString().substring(0, 5))
        .replace("{{station}}", eventObj.Staion)

        .replace("{{relay}}", relay)
        .replace("{{fedderwork}}", eventObj.fedderwork)
        .replace("{{phase}}", load_show)
        .replace("{{phase_show}}", phase_show)

        .replace("{{weather}}", eventObj.weather)
        .replace("{{detail}}", eventObj.detail ? eventObj.detail : "-")
        .replace("{{share}}", share_url)
        .replace("{{technical}}", technical_url)

        .replace("{{event_id}}", eventObj.event_id);

      //LBB-0023
    } else if (eventObj.state == 2) {
      
      //let dateHappen = (eventObj.datehappen).substring(0, 10) + " " + (eventObj.timehappen);
      //let dateRestore = (eventObj.daterestore).substring(0, 10) + " " + (eventObj.timerestore);
      let dt1 = new Date(eventObj.datehappen);
      let dt2 = new Date(eventObj.daterestore);

      let duration = diff_minutes(dt2, dt1);

      duration += duration + " นาที"

      flex = require("./rich/shareEventCompleteFlex.json");
      flexString = JSON.stringify(flex);
      let now = Math.floor(Date.now() / 1000);

      let share_url = `https://liff.line.me/1654302066-56bnGA8b?event_id=${eventObj.event_id}&v=${now}`;
      let technical_url = `https://rc2.aq1.co/admin/technical.html?event_id=${eventObj.event_id}&v=${now}`

      let theDateRestore = new Date(eventObj.daterestore).toISOString().slice(0, 10)
      flexString = flexString.replace("{{equipcode}}", eventObj.equipcode)
        .replace("{{status}}", status[eventObj.state])
        .replace("{{datehappen}}", (eventObj.datehappen).toString().substring(0, 10))
        .replace("{{timehappen}}", (eventObj.timehappen).toString().substring(0, 5))
        .replace("{{daterestore}}", theDateRestore)
        .replace("{{timerestore}}", (eventObj.timerestore).toString().substring(0, 5))
        .replace("{{timerestore}}", (eventObj.timerestore).toString().substring(0, 5))
        .replace("{{weather}}", eventObj.weather)
        .replace("{{event_id}}", eventObj.event_id)
        .replace("{{cause_name}}", eventObj.cause_name)
        .replace("{{station}}", eventObj.Staion)

        .replace("{{share}}", share_url)
        .replace("{{technical}}", technical_url)
        .replace("{{duration}}", duration)

        .replace("{{detail}}", eventObj.detail ? eventObj.detail : "-");

      let imagesFromUpload = await request.get({
        uri: `https://aq1.co/the-uploader/files/?event_id=${event_id}`,
      });

      let fileObj = JSON.parse(imagesFromUpload)

      let placeholder_url = "https://firebasestorage.googleapis.com/v0/b/rcsquare-peathailand.appspot.com/o/rc2-img-thumb(1).png?alt=media&token=1dcddadf-9b96-41ef-8b34-dbf7415daaf9";

      let count = 0;
      if (fileObj.files)
        fileObj.files.forEach(function(entry) {
          count++;
          let imageEndpointUrl = `https://aq1.co/the-uploader/files/${event_id}/${entry}`;
          console.log(imageEndpointUrl);
          flexString = flexString.replace("{{image}}", imageEndpointUrl);
          flexString = flexString.replace("{{image_share}}", imageEndpointUrl);
        });

      flexString = flexString.replace("{{image}}", placeholder_url);
      flexString = flexString.replace("{{image}}", placeholder_url);
      flexString = flexString.replace("{{image}}", placeholder_url);

      flexString = flexString.replace("{{image_share}}", placeholder_url);
      flexString = flexString.replace("{{image_share}}", placeholder_url);
      flexString = flexString.replace("{{image_share}}", placeholder_url);
    }
    flex = JSON.parse(flexString);
    return flex;
  },
  getEvent: async (event_id) => {
    let flex = require("./rich/shareEventCompleteFlex.json");
    let flexString = JSON.stringify(flex);

    let query = `SELECT *,ca.id,e.lat as lat, e.lon as lon,c.lat as station_lat, c.lon as station_lon FROM lineapi_lineevent e, lineapi_cause ca, "apiSAIFI_peasubcode" c, "apiSAIFI_peastation" s WHERE e.event_id = '${event_id}' AND e.peacode = c.subcode AND e.area = s."CauseCode" AND ca."cause_id" = e.maincause  GROUP BY e.peacode,e.id,c.subcode,s.id,ca.id`;
    console.log(query);
    let queryResult = await pool.query(query);
    console.log(queryResult.rows);
    let eventObj = queryResult.rows[0];

    let images = ["https://aq1.co/the-uploader/files/ABC-1234/0325c28156da1d504183888e24112beb.png",
      "https://aq1.co/the-uploader/files/ABC-1234/0325c28156da1d504183888e24112beb.png",
      "https://aq1.co/the-uploader/files/ABC-1234/0325c28156da1d504183888e24112beb.png"
    ];

    flexString = flexString.replace("{{equipcode}}", eventObj.equipcode)
      .replace("{{datehappen}}", (eventObj.datehappen).toString().substring(0, 10))
      .replace("{{timehappen}}", (eventObj.timehappen).toString().substring(0, 5))
      .replace("{{daterestore}}", (eventObj.daterestore).toString().substring(0, 10))
      .replace("{{timerestore}}", (eventObj.timerestore).toString().substring(0, 5))
      .replace("{{timerestore}}", (eventObj.timerestore).toString().substring(0, 5))
      .replace("{{weather}}", eventObj.weather)
      .replace("{{event_id}}", eventObj.event_id)
      .replace("{{image1}}", images[0])
      .replace("{{image2}}", images[1])
      .replace("{{image3}}", images[2])
      .replace("{{cause_name}}", eventObj.cause_name)
      .replace("{{station}}", eventObj.Staion)
      .replace("{{detail}}", eventObj.detail ? eventObj.detail : "-");

    //get images
    // https://aq1.co/the-uploader/files/?event_id=ABC-1234
    //image path
    // https://aq1.co/the-uploader/files/ABC-1234/0325c28156da1d504183888e24112beb.png

    flex = JSON.parse(flexString);
    return flex;
  },
  getProfileFromPEA: async (peaUserId) => {
    return await User.findAll({
        where: {
          pea_id: peaUserId
        }
      })
      .then(function(result) {
        if (result)
          return peaUserId;
        else
          return "กรุณากดปุ่ม Profile เพื่อลงทะเบียน";
      })
      .catch(function(err) {
        return JSON.stringify(err);
      });
    //return peaUserId;
  },
  getRegister: () => {
    let flexObj = require("./rich/registerFlex.json");
    return flexObj;
  },
  getProfile: async (userId) => {
    let flexObj = require("./rich/profileFlex.json");
    var db = require('../models');
    let User = db.lineapi_profile;
    let theFlexObj = await User.findAll({
        where: {
          line_id: userId
        }
      })
      .then(function(result) {
        console.log(result);
        let userObj = result[0];
        if (userObj) {

          console.log(userObj.email);
          flexObj.hero.url = userObj.avatar;
          flexObj.body.contents[0].contents[0].contents[1].text = userObj.first_name + " " + userObj.last_name;
          flexObj.body.contents[0].contents[1].contents[1].text = userObj.pea_id;
          flexObj.body.contents[0].contents[2].contents[1].text = userObj.title;
          flexObj.body.contents[0].contents[3].contents[1].text = userObj.department;
          flexObj.body.contents[0].contents[4].contents[1].text = userObj.email;

          let roleText = "";
          if (userObj.role == "role1")
            roleText = "EO";
          else if (userObj.role == "role2")
            roleText = "ช่างซ่อมไฟ";
          else if (userObj.role == "role3")
            roleText = "นักวิเคราะห์";
          else if (userObj.role == "role4")
            roleText = "ผู้บริหาร";

          flexObj.body.contents[0].contents[4].contents[1].text = roleText;
        } else {
          flexObj = require("./rich/registerFlex.json");
        }

        return flexObj;
      });
    return theFlexObj;
  }
}

function diff_minutes(dt2, dt1) {

  var diff = (dt2.getTime() - dt1.getTime()) / 1000;
  diff /= 60;
  return Math.abs(Math.round(diff));

}

function getPhaseShow(v) {
  let load_A = "NONE";
  let phase_show = "-";
  if (v.load_A == 1) {
    load_A = "TIME";
    phase_show = load_A;
  } else if (v.load_A == 2) {
    load_A = "INS";
    phase_show = load_A;
  }

  let load_B = "NONE";
  if (v.load_B == 1) {
    load_B = "TIME";
    phase_show = load_B;
  } else if (v.load_B == 2) {
    load_B = "INS";
    phase_show = load_B;
  }

  let load_C = "NONE";
  if (v.load_C == 1) {
    load_C = "TIME";
    phase_show = load_C;
  } else if (v.load_C == 2) {
    load_C = "INS";
    phase_show = load_C;
  }

  let load_G = "NONE";
  if (v.load_G == 1) {
    load_G = "TIME";
    phase_show = load_G;
  } else if (v.load_G == 2) {
    load_G = "INS";
    phase_show = load_G;
  }
  return phase_show;
}

function getLoadShow(v) {
  let load_show = "";
  if (v.load_A != 0)
    load_show += "A";
  if (v.load_B != 0)
    load_show += "B";
  if (v.load_C != 0)
    load_show += "C";
  if (v.load_G != 0)
    load_show += "G";

  return load_show;
}

function randomConfident(min, max) { // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}