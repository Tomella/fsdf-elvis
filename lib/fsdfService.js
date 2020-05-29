let request = require("request");

class FsdfService {
   constructor(template, tokenService) {
      this.template = template;
      this.tokenService = tokenService;
   }

   async execute(data) {
      console.log("FSDF: " + JSON.stringify(data, null, 3) + "\n" + this.template);
      let template = this.template;

      let token = await this.tokenService.getToken();

      console.log(token);

      return new Promise(function(resolve, reject) {
         request({uri: template, method: 'post', json: true, body: data, headers: {'Authorization': "fmetoken token=" + token}}, function (error, response, body) {
            let message = null;
            let statusCode = response && response.statusCode;
            console.log(statusCode)
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
            // console.log("FSDF MESSAGE:", JSON.stringify(message, null, 3))
            // We always resolve
            resolve(message);
         });
      });
   }
}

module.exports = FsdfService;