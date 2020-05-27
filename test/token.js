let config = require("./config");
let Token = require("../lib/token");

(async function() {

    let token = new Token(config.fmeToken);
    let value = await token.value;
    console.log(value);

})();
