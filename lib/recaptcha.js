const request = require('request');
const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

class ReCaptcha {
   constructor(secret) {
      this.secret = secret;
   }

   verify(remoteAddr, code, callback) {
      return request.post({
         url: VERIFY_URL,
         form: {
            secret: this.secret,
            response: code,
            remoteip: remoteAddr
         }
      }, callback);
   }
}

module.exports = ReCaptcha;