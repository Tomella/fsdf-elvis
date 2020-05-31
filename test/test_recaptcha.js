var config = require("./config");

let Secrets = require("../lib/secrets");

(async () => {
    let secrets = new Secrets(config.secrets);
    let key = "";

    console.log("Start");
    try {
            key = await secrets.recaptchaPrivateKey().then((key) => {
                console.log("What the ", key);
            });
    } catch (e) {
        console.log(e)
    }
    console.log("KEY =", key);
})()
