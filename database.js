var mysql = require('promise-mysql'),
    isHex = require('util').isHex;
var isInteger = Number.isInteger;

const PRODUCTION_DB = 'coiot',
      TEST_DB = 'coiot';

const SELECT_USER = 'SELECT * FROM `users` WHERE `username` = ? AND `password` = ?';
const SELECT_USER_BY_USERNAME = 'SELECT * FROM `users` WHERE `username` = ?';
const SELECT_IDLE_USERS =
'SELECT u.id, u.username \
 FROM `users` u \
 LEFT JOIN `worker_ownership` o ON o.user_id = u.id \
 WHERE o.worker_id IS NULL';
const SELECT_DEVICE = 'SELECT * FROM `devices` WHERE `device` = ? AND `key` = ?';
const SELECT_DEVICE_BY_NAME = 'SELECT * FROM `devices` WHERE `device` = ?';
const SELECT_DEVICE_BY_USERNAME =
'SELECT o.device_id, d.device, d.key, o.user_id, u.username \
 FROM `devices` d \
 JOIN `device_ownership` o ON o.device_id = d.id \
 JOIN `users` u ON u.id = o.user_id \
 WHERE u.username = ? AND d.device = ? AND d.key = ?';
const SELECT_WORKER = 'SELECT * FROM `workers` WHERE `name` = ? AND `key` = ?';
const SELECT_WORKERS = 'SELECT * FROM `workers`';
const SELECT_DEVICES =
'SELECT d.id, d.device, d.key \
 FROM `devices` d \
 JOIN `device_ownership` o ON o.device_id = d.id \
 WHERE o.user_id = ?';
const SELECT_DEVICE_STAT = 
'SELECT s.id, s.type, s.value, s.date \
 FROM `statistics` s\
 JOIN `device_ownership` o ON o.device_id = s.device_id \
 WHERE o.user_id = ? AND s.device_id = ?';
const SELECT_DEVICE_STAT_BY_NAME =
'SELECT d.id, d.device, s.type, s.value, s.date \
 FROM `statistics` s \
 JOIN `devices` d ON d.id = s.device_id \
 WHERE d.device = ?';
const SELECT_MIN_CONN_WORKER =
'SELECT w.id, w.name, w.ip \
 FROM `workers` w \
 LEFT JOIN (SELECT worker_id, count(id) AS cnt FROM worker_ownership GROUP BY worker_id) s ON s.worker_id = w.id \
 ORDER BY s.cnt LIMIT 1';

const INSERT_USER =
'INSERT INTO `users` (`username`, `password`) VALUES (?, ?)'
const INSERT_DEVICE =
'INSERT INTO `devices` (`device`, `key`) VALUES (?, ?)'
const INSERT_DEVICE_OWNERSHIP =
'INSERT INTO `device_ownership` (`user_id`, `device_id`) VALUES (?, ?)'
const INSERT_WORKER_OWNERSHIP =
'INSERT INTO `worker_ownership` (`user_id`, `worker_id`) VALUES (?, ?)'

const DELETE_WORKER = 'DELETE FROM `workers` WHERE `id` = ?'
    
function wrappQuery(query, done) {
    if (done === undefined) {
        return query;
    }
    query.then((rows)=>{done(null, rows)}).catch((err)=>done(err));
}

function raiseError(msg, done) {
    if (done === undefined) {
        throw new Error(msg);
    }
    return done(new Error(msg));
}

class Database {
    constructor() {
        this.__host = "localhost";
        this.__user = "root";
        this.__pass = "";
        this.__database = TEST_DB;
        this.__connLimit = 32;
        this.__connWait = true;
        this.__acqLimit = 8000;
        this.__queueLimit = 0;
        this.__transaction = {
            connectionLimit: 1
        }
        this.__pool = undefined;
        this.__multstates = false;
    }

    configure(config) {
        this.__host = config.host         || this.__host;
        this.__user = config.username     || this.__user;
        this.__pass = config.password     || this.__pass;
        this.__multstates = config.multstates     || this.__multstates;
        if (config.prod === true || config.test === false) {
            this.__database = PRODUCTION_DB;
        } else {
            this.__database = TEST_DB;
        }
    }

    connect() {
        if (this.__pool) {
            this.disconnect();
        }
        this.__pool = mysql.createPool({
            host               : this.__host,
            user               : this.__user,
            password           : this.__pass,
            database           : this.__database,
            connectionLimit    : this.__connLimit,
            waitForConnections : this.__connWait,
            acquireTimeout     : this.__acqLimit,
            queueLimit         : this.__queueLimit,
            useTransaction     : this.__transaction,
            useCursor          : this.__cursor,
            multipleStatements : this.__multstates
        })
    }

    async disconnect() {
        if (this.__pool) {
            await this.__pool.end();
        }
        this.__pool = undefined;
    }

    query(q, args, done) {
        if (!this.__pool) {
            return raiseError('Missing database connection.', done);
        }
        let query = this.__pool.query(q, args);
        return wrappQuery(query, done);
    }

    selectUser(usr, psw, done) {
        if (!this.__pool) {
            return raiseError('Missing database connection.', done);
        }
        let query = this.__pool.query(SELECT_USER, [usr, psw]);
        return wrappQuery(query, done);
    }

    selectIdleUsers(done) {
        if (!this.__pool) {
            return raiseError('Missing database connection.', done);
        }
        let query = this.__pool.query(SELECT_IDLE_USERS);
        return wrappQuery(query, done);
    }

    selectUserByUsername(usr, done) {
        if (!this.__pool) {
            return raiseError('Missing database connection.', done);
        }
        let query = this.__pool.query(SELECT_USER_BY_USERNAME, [usr]);
        return wrappQuery(query, done);
    }

    selectDevice(dev, key, done) {
        if (!this.__pool) {
            return raiseError('Missing database connection.', done);
        }
        let query = this.__pool.query(SELECT_DEVICE, [dev, key]);
        return wrappQuery(query, done);
    }

    selectDeviceByUsername(usr, dev, key, done) {
        if (!this.__pool) {
            return raiseError('Missing database connection.', done);
        }
        let query = this.__pool.query(SELECT_DEVICE_BY_USERNAME, [usr, dev, key]);
        return wrappQuery(query, done);
    }

    selectDeviceByName(dev, done) {
        if (!this.__pool) {
            return raiseError('Missing database connection.', done);
        }
        let query = this.__pool.query(SELECT_DEVICE_BY_NAME, [dev]);
        return wrappQuery(query, done);
    }

    selectWorker(name, key, done) {
        if (!this.__pool) {
            return raiseError('Missing database connection.', done);
        }
        let query = this.__pool.query(SELECT_WORKER, [name, key]);
        return wrappQuery(query, done);
    }

    selectWorkers(done) {
        if (!this.__pool) {
            return raiseError('Missing database connection.', done);
        }
        let query = this.__pool.query(SELECT_WORKERS);
        return wrappQuery(query, done);
    }

    selectDevices(usr_id, done) {
        if (!this.__pool) {
            return raiseError('Missing database connection.', done);
        }
        let query = this.__pool.query(SELECT_DEVICES, [usr_id]);
        return wrappQuery(query, done);
    }

    selectDeviceStat(usr_id, dev_id, done) {
        if (!this.__pool) {
            return raiseError('Missing database connection.', done);
        }
        let query = this.__pool.query(SELECT_DEVICE_STAT, [usr_id, dev_id]);
        return wrappQuery(query, done);
    }

    selectMinConnWorker(done) {
        if (!this.__pool) {
            return raiseError('Missing database connection.', done);
        }
        let query = this.__pool.query(SELECT_MIN_CONN_WORKER);
        return wrappQuery(query, done);
    }

    insertUser(usr, psw, done) {
        if (!this.__pool) {
            return raiseError('Missing database connection.', done);
        }
        let query = this.__pool.query(INSERT_USER, [usr, psw]);
        return wrappQuery(query, done);
    }

    insertDevice(dev, key, done) {
        if (!this.__pool) {
            return raiseError('Missing database connection.', done);
        }
        let query = this.__pool.query(INSERT_DEVICE, [dev, key]);
        return wrappQuery(query, done);
    }

    insertDeviceOwnership(usr_id, dev_id, done) {
        if (!this.__pool) {
            return raiseError('Missing database connection.', done);
        }
        let query = this.__pool.query(INSERT_DEVICE_OWNERSHIP, [usr_id, dev_id]);
        return wrappQuery(query, done);
    }

    insertWorkerOwnership(usr_id, wrk_id, done) {
        if (!this.__pool) {
            return raiseError('Missing database connection.', done);
        }
        let query = this.__pool.query(INSERT_WORKER_OWNERSHIP, [usr_id, wrk_id]);
        return wrappQuery(query, done);
    }

    deleteWorker(id, done) {
        if (!this.__pool) {
            return raiseError('Missing database connection.', done);
        }
        let query = this.__pool.query(DELETE_WORKER, [id]);
        return wrappQuery(query, done);
    }
}

module.exports = {
    Database: Database
}
