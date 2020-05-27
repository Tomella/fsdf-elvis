let config = require("./config");
let Token = require("../lib/token");

(async function() {

    let token = new Token(config.fmeToken);
    token.value.then(val => {
        console.log(value);
    });

})();
