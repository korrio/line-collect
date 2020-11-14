const request = require("request-promise");
const axios = require('axios');

const Pool = require('pg').Pool
const pool = new Pool({
  user: 'postgres',
  password: 'rcsquare',
  host: '167.71.213.91',
  database: 'line_collect',
  port: 5432,
})

module.exports = {
  getRegister: (name,email,phone) => {
    let flex = require("./rich/registerFlex.json");
    let flexString = JSON.stringify(flex);

    flexString = flexString.replace("{{name}}", name)
      .replace("{{email}}", email)
      .replace("{{phone}}", phone);

    flexObj = JSON.parse(flexString);;
    return flexObj;
  },
  getShare: async (username) => {
    let flex = require("./rich/profileFlex.json");
    let flexString = JSON.stringify(flex);

    let query = `SELECT * FROM lineapi_profile WHERE username = '${username}'`;

    flexString = flexString.replace("{{equipcode}}", eventObj.equipcode)
      .replace("{{datehappen}}", (eventObj.datehappen).toString().substring(0, 10))
      .replace("{{timehappen}}", (eventObj.timehappen).toString().substring(0, 5))
      .replace("{{daterestore}}", (eventObj.daterestore).toString().substring(0, 10))

    flex = JSON.parse(flexString);
    return flex;
  },
  getMyProfile: async (username) => {
    return await User.findAll({
        where: {
          username: username
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
  getProfile: async (username) => {
    let flexObj = require("./rich/profileFlex.json");
    var db = require('../models');
    let User = db.lineapi_profile;
    let theFlexObj = await User.findAll({
        where: {
          username: username
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
            roleText = "A";
          else if (userObj.role == "role2")
            roleText = "B";
          else if (userObj.role == "role3")
            roleText = "C";
          else if (userObj.role == "role4")
            roleText = "D";

          flexObj.body.contents[0].contents[4].contents[1].text = roleText;
        }


        return flexObj;
      });
    return theFlexObj;
  }
}