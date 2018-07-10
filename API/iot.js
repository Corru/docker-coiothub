var express     = require('express'),
    ping        = require('ping'),
    u           = require('../util.js'),
    config      = require('../config.json');

var router  = express.Router();

var method = {
    uri: '/iot',
    open: true,
    params: {
        limit: {
            value: 100,
            require: false
        },
        offset: {
            value: 0,
            require: false
        },
        fields: {
            value: "",
            require: false
        },
        authorId: {
            value: 100,
            require: false
        },
        type: {
            value: "md",
            require: false
        }
    },
    router: router,
    balance: balance
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function balance(db, mqtt, ms) {
    while(true) {
        row = await db.selectWorkers();
        for (var i in row) {
            row[i].prom = ping.promise.probe(row[i].ip, {timeout: 1})
                .then((ip)=>{ 
                    if (!ip.alive) return db.deleteWorker(row[i].id);
                });
        }
        for (var i in row) {
            await row[i].prom;
        }
        row = await db.selectIdleUsers();
        for (var i in row) {
            worker = await db.selectMinConnWorker();
            if (worker.length === 0) {
                break;
            }
            await db.insertWorkerOwnership(row[i].id, worker[0].id)
            mqtt.publish({topic:'coiot/workers/'+worker[0].name,payload:'subscribe',qos:1,retain:false}, null, ()=>{})
        }
        await timeout(ms);
    }
}

router.use((req, res, next) => {
    if (req.user.id === null) {
        return res.sendInvalidTokenError();
    }
    next();
});

router.get('/devices', (req, res) => {
    var db = req.app.get('db');
    db.selectDevices(req.user.id).then((row) => {
        res.json(row);
    }).catch((err)=>{
        return res.handleInternalError(err);
    });
});

router.get('/stat/:id', (req, res) => {
    let id = req.params.id;
    if (!u.isNormalInteger(id)) {
        return res.sendInvalidDataError();
    }
    let db = req.app.get('db');
    db.selectDeviceStat(req.user.id, id).then((row) => {
        res.json(row);
    }).catch((err)=>{
        return res.handleInternalError(err);
    });
});

router.get('/add', (req, res) => {
    if (req.query.dev === undefined || req.query.dev === '') {
        return res.sendInvalidDataError();
    } else if (req.query.key === undefined || req.query.key === '') {
        return res.sendInvalidDataError();
    } else if (req.query.dev !== u.trimNonAlpha(req.query.dev)) {
        return res.sendInvalidDataError();
    }
    var db = req.app.get('db');
    var dev = req.query.dev, key = req.query.key;
    db.selectDeviceByName(dev).then((row) => {
        if (row.length) {
            res.sendError(4, {'message':'device already exists'});
            u.exitResolved();
        }
        return db.insertDevice(dev, key);
    }).then((row) => {
        return db.insertDeviceOwnership(req.user.id, row.insertId);
    }).then((row) => {
        res.json({success: true})
    }).catch((err)=>{
        return res.handleInternalError(err);
    })
});

module.exports = method;
