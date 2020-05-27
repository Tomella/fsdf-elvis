let config = require("./config");
let Token = require("../lib/token");

(async function() {

    let token = new Token(config.fmeToken);
    let tok = await token.getToken();
    console.log(tok);

})();
