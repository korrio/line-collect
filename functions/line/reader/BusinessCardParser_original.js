'use strict';

// Enable reading files
const fs = require('fs');

const ContactInfo = require('./ContactInfo.js');
const substrings = require('common-substrings');

// This class parses through the given text to extract name, phone number, and email
class BusinessCardParser{
   constructor(type, documentValue){
     if(type == 'f'){
       this.document = fs.readFileSync(documentValue, 'utf8').toString();
     }
     else if(type == 'm'){
       this.document = documentValue;
     }
   }

  // This function is where the parsing occurrs
  // Returns a ContactInfo object with the extracted information
  getContactInfo(document){
    var name = "";
    var phoneNumber = "";
    var email = "";
    var lines = document.split("\n");

    // Loop throught to find email and  phone number
    // going to loop through remaining lines and use email to determine which one is the name
    for (let i = 0; i < lines.length; i++){
      var line = lines[i];

      // Check if phone phone number
      if (!line.includes("Fax") && phoneNumber == ""){
        var chars = Array.from(line);
        for(var j = 0; j < chars.length; j++){
          if(chars[j] >= '0' && chars[j] <= '9'){
            phoneNumber = phoneNumber + chars[j];
          }
        }
        if (phoneNumber.length <= 11 && phoneNumber.length >= 10){
          lines.splice(i, 1);
          i -= 1;
        }
        else{
          phoneNumber = ""; // this wasn't actually a valid phone number
        }
      }
      // Check if email address
      else if (line.includes("@") && line.includes(".")){
        var splitLine = line.split(" ");
        for (var k = 0; k < splitLine.length; k++){
          if (splitLine[k].includes("@") && splitLine[k].includes(".")){
            email = splitLine[k];
          }
        }
        if (email[email.length-4] == "."){
          lines.splice(i, 1);
          i -= 1;
        }
        else{
          email = ""; // wasn't a valid email
        }
      }
    };
    // go through remaining lines to find name
    for(let line of lines){
      // determine that a line contains the name if it has a common substring
      // with the first part of the email address
      var commonSubstrings = substrings([line, email.split("@")[0]],{
        minOccurrence: 2,
        minLength: 3,
      })
      if(commonSubstrings.length > 0){
        name = line;
      }
    }
    return new ContactInfo(name, phoneNumber, email);
  }
}

module.exports = BusinessCardParser
