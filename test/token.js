let config = require("./config");
let Token = require("../lib/token");

(async function() {

    let token = new Token(config.token);
    let value = await token.value;
    console.log(value);

})();
