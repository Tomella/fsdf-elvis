let request = require("request");

class ElvisService {
   constructor(template) {
      this.template = template;
   }

   execute(data) {
      let workingString = this.template;

      Object.keys(data).forEach(key => {
         workingString = workingString.replace("${" + key + "}", encodeURIComponent(data[key]));
      });
      console.log("ELVIS: " + JSON.stringify(data, null, 3) + "\n\n" + workingString);

      let promise =  new Promise(function(resolve, reject) {
         request(workingString, function (error, response, body) {
            let message = null;
            let statusCode = response && response.statusCode;
            if(error || statusCode !== 200) {
               message = {
                  status: "error",
                  message: "Sorry but the service failed to respond. Try again later.",
                  error,
                  data,
                  body,
                  statusCode
               };
            } else {
               message = {
                  status: "success",
                  message: "Your job has been submitted.",
                  data
               };
            }

            console.log("ELVIS MESSAGE:", body);
            // We always resolve
            resolve(message);
         });
      });
      return promise;
   }
}

module.exports = ElvisService;