var express     = require('express'),
    u           = require('../util.js'),
    HttpStatus  = require('http-status-codes'),
    crypto      = require('crypto');

var router  = express.Router();

function wrappArgs(func, aargs) {
    return function () {
        var args = Array.from(arguments); 
        args.unshift.apply(args, aargs);
        return func.apply(this, args);
    }
}

var method = {
    uri: '/auth',
    open: true,
    params: {
        limit: {
            value: 100,
            require: false
        }
    },
    router: router,
    mqtt: {
        authenticate: function(db) { return wrappArgs(authenticate, [db]); },
        authorizePublish: function(db) { return wrappArgs(authorizePublish, [db]); },
        authorizeSubscribe: function(db) { return wrappArgs(authorizeSubscribe, [db]); }
    }
}

function authenticate(db, client, username, password, done) {
    if (!username || !password) {
        return done(null, false);
    }
    var author = username.split('-');
    if (author.length < 2) {
        return done(null, false);
    }
    client.type = author[0];
    username = author[1];
    if(client.type === 'usr') {
        username = author[1];
        return authenticateUser(db, client, username, password, done);
    } else if(client.type === 'dev') {
        username = author.slice(1);
        return authenticateDevice(db, client, username, password, done);
    } else if(client.type === 'wrk') {
        username = author[1];
        return authenticateWorker(db, client, username, password, done);
    } else {
        return done(null, false);
    }
}

function authenticateUser(db, client, username, password, done) {
    db.selectUser(username, password).then((row) => {
        if (row.length) {
            client.username = row[0]['username'];
            client.user_id = row[0]['user_id'];
        }
        done(null, row.length !== 0);
    });
}

function authenticateDevice(db, client, author, key, done) {
    db.selectDeviceByUsername(author[0], author[1], key).then((row) => {
        if (row.length) {
            client.username = row[0]['username'];
            client.user_id = row[0]['user_id'];
            client.device_id = row[0]['device_id'];
            client.device = row[0]['device'];
        }
        done(null, row.length !== 0);
    });
}

function authenticateWorker(db, client, worker, key, done) {
    db.selectWorker(worker, key).then((row) => {
        if (row.length) {
            client.worker_id = row[0]['id'];
            client.name = row[0]['name'];
            client.ip = row[0]['ip'];
        }
        done(null, row.length !== 0);
    });
}

function authorizePublish(db, client, topic, payload, done) {
    topic = topic.split('/');
    if (topic.length < 2 || topic[0] != 'coiot') {
        return done(null, false);
    }
    if(client.type === 'usr' && topic.length > 2) {
        return done(null, topic[1] === 'users' && topic[2] === client.username);
    } else if(client.type === 'dev' && topic.length > 4) {
        console.log(topic[1] === 'users' && topic[2] === client.username &&
                          topic[3] === 'devices' && topic[4] === client.device)
        return done(null, topic[1] === 'users' && topic[2] === client.username &&
                          topic[3] === 'devices' && topic[4] === client.device);
    } else if(client.type === 'wrk') {
        return done(null, true);
    } else {
        return done(null, false);
    }
}

function authorizeSubscribe(db, client, topic, done) {
    topic = topic.split('/');
    if (topic.length < 2 || topic[0] != 'coiot') {
        return done(null, false);
    }
    if(client.type === 'usr' && topic.length > 2) {
        return done(null, topic[1] === 'users' && topic[2] === client.username);
    } else if(client.type === 'dev' && topic.length > 4) {
        return done(null, topic[1] === 'users' && topic[2] === client.username &&
                          topic[3] === 'devices' && topic[4] === client.device);
    } else if(client.type === 'wrk') {
        return done(null, true);
    } else {
        return done(null, false);
    }
}

router.get('/check', (req, res) => {
    if (req.user.id === null) {
        return res.json({'error':'bad login'});
    }
    res.json({'everything':'ok'});
});

router.get('/signup', (req, res) => {
    if (req.query.token === undefined || req.query.token === '') {
        return res.sendInvalidTokenError();
    }
    var db = req.app.get('db');
    var usr = req.query.usr, psw = req.query.psw;
    var token = req.query.token;
    if (usr !== u.trimNonAlpha(usr) || !u.isHex(token)) {
        res.sendInvalidDataError();
        return
    }
    db.selectUserByUsername('root').then((row) => {
        var key = row[0].password;
        var hash = crypto.createHmac('sha256', key).update(usr).digest('hex');
        if (hash != token) {
            res.sendInvalidTokenError();
            u.exitResolved();
        }
        return db.selectUserByUsername(usr);
    }).then((row) => {
        if (row.length) {
            res.sendError(4, {'message':'user already exists'});
            u.exitResolved();
        }
        return db.insertUser(usr, psw);
    }).then((row) => {
        res.json({success: true})
    }).catch((err)=>{
        return res.handleInternalError(err);
    })
});

module.exports = method;
