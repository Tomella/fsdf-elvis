let config = require("./config");
let Token = require("../lib/token");

(async function() {

    let token = new Token(config.fmeToken);
    token.getToken().then(tok => {
        console.log(tok);
    });

})();
