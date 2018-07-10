console.log('[*] Loading modules')
var config      = require('./config.json'),
    express     = require('express'),
    bodyParser  = require('body-parser'),
    u           = require('./util'),
    Database    = require('./database').Database,
    mosca       = require('mosca');

/* METHODS LOAD */
var auth = require('./API/auth');
var iot = require('./API/iot');
/*---*/

/* CREATE MODULES */
console.log('[*] Initializing modules')
var http     = express();
var mqtt    = new mosca.Server(config.mosca);
var db      = new Database();
/*---*/

/* EXPRESS CONFIGURE */
console.log('[*] Configuring express')
http.set('db', db);
http.use(bodyParser.urlencoded({ extended: false }));
http.use(bodyParser.json());
http.use(u.wrapper);
http.use(function (req, res, next) {
    req.prepareUser();
    var usr = req.query.usr, psw = req.query.psw;
    if (usr === undefined || psw === undefined) {
        return next();
    } else if (usr !== u.trimNonAlpha(usr)) {
        res.sendInvalidDataError();
        u.exitResolved();
    }
    var db = req.app.get('db');
    db.selectUser(req.query.usr, req.query.psw).then((row) => {
        req.fillUser(row);
        if (req.user.id === null) {
            next();
            u.exitResolved();
        }
        next();
    }).catch((err)=>{
        return res.handleInternalError(err);
    });
});
http.use(auth.uri, auth.router);
http.use(iot.uri, iot.router);
/*---*/

/* MQTT CONFIGURE */
console.log('[*] Configuring MOSCA')
/*mqtt.on('clientConnected', function(client) {
    console.log('[MOSCA] client connected', client.id);
});*/
mqtt.on('ready', function() {
    mqtt.authenticate = auth.mqtt.authenticate(db);
    mqtt.authorizePublish = auth.mqtt.authorizePublish(db);
    mqtt.authorizeSubscribe = auth.mqtt.authorizeSubscribe(db);
});
/*---*/

/* DB CONFIGURE */
console.log('[*] Configuring database')
db.configure(config.database);
/*---*/

/* TURN ON ENGINE AND FLY AWAY! */
console.log('[*] Deploying...')
db.connect();
http.listen(config.port);
iot.balance(db, mqtt, 5000)
/*---*/
