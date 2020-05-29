let request = require("request");


class ElvisService {
   constructor(template, tokenService) {
      this.template = template;
      this.tokenService = tokenService;
   }

   async execute(data) {
      let workingString = this.template;

      Object.keys(data).forEach(key => {
         workingString = workingString.replace("${" + key + "}", encodeURIComponent(data[key]));
      });
      console.log("ELVIS: " + JSON.stringify(data, null, 3) + "\n\n" + workingString);

      let token = await this.tokenService.getToken();

      console.log(token);

      return new Promise(function(resolve, reject) {
         request({
            headers: {
              'Authorization': "fmetoken token=" + token
            },
            uri: workingString,
            method: 'GET'
          }, function (error, response, body) {
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
   }
}

module.exports = ElvisService;