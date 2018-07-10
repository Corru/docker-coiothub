var config      = require('./config.json'),
    fs          = require('fs'),
    u           = require('./util'),
    Database    = require('./database').Database;
console.log('[*] Preparing database')
var db      = new Database();
config.multstates = true
db.configure(config.database);
console.log('[*] Connecting to database')
db.connect();

console.log('[*] Checking database tables')
db.query('SELECT table_name FROM information_schema.tables WHERE table_name = \'users\';')
  .then((res) => {
    if (res.length) {
        return
    }
    console.log('[*] Building database')
    data = fs.readFileSync(config.dbsql).toString();
    return db.query(data);
}).then((res) => {
    console.log('[*] Checking root')
    return db.query('SELECT * FROM users WHERE username = \'root\'');
}).then((res) => {
    if (res.length) {
        u.exitResolved();
    }
    console.log('[*] Creating root')
    return db.query('INSERT INTO users (username, password) VALUES (\'root\', ?)', [config.rootpassword]);
}).then((res) => {
    db.disconnect();
    console.log('[.] Done')
}).catch((err)=>{
    db.disconnect();
    if (err.resolved === true) {
        console.log('[.] Done')
        return;
    }
    console.log('[!] Error occured:')
    console.log(err);
    throw err;
});
