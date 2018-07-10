var HttpStatus = require('http-status-codes');
const EPS = 0.000001;

function isHex(h) {
    var a = parseInt(h,16);
    return (a.toString(16) === h.toLowerCase())
}

function isNormalInteger(str) {
    var n = Math.floor(Number(str));
    return n !== Infinity && String(n) === str && n >= 0;
}

function trimNonAlpha(str) {
    return str.replace(/\W+/g, '');
}

function asciiFilter (req, file, cb) {
    for (let i in file) {
        if (file[i] > 127) {
            cb(null, false);
        }
    }
    cb(null, true);
}

function prepareReqUser(req) {
    req.user = {
        id: null,
        usr: null,
        psw: null
    }
}

function fillReqUser(req, row) {
    if (row.length == 0) {
        return
    }
    req.user.id = row[0].id;
    req.user.usr = row[0].username;
    req.user.psw = row[0].password;
}

function constructError(code, msg) {
    return { success: false, error: code, message: msg }
}

function sendErrorMsg(res, code, msg, http_code) {
    if (http_code === undefined) {
        http_code = HttpStatus.BAD_REQUEST;
    }
    res.status(http_code).json(constructError(code, msg));
}

function sendError(res, code, err, http_code) {
    if (err.resolved === true) {
        return;
    } 
    sendErrorMsg(res, code, err.message, http_code);
}

function sendInternalServerError(res, err) {
    console.log(err);
    sendErrorMsg(res, HttpStatus.INTERNAL_SERVER_ERROR, 'Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
}

function sendNotFoundError(res, msg) {
    sendErrorMsg(res, HttpStatus.NOT_FOUND, msg, HttpStatus.NOT_FOUND);
}

function sendInvalidTokenError(res) {
    sendErrorMsg(res, HttpStatus.UNAUTHORIZED, 'Invalid token', HttpStatus.UNAUTHORIZED);
}

function sendUserNotApprovedError(res) {
    sendErrorMsg(res, HttpStatus.FORBIDDEN, 'User not approved', HttpStatus.FORBIDDEN);
}

function sendInvalidDataError(res) {
    sendErrorMsg(res, HttpStatus.BAD_REQUEST, 'Invalid data');
}

function sendDublicateError(res) {
    sendErrorMsg(res, HttpStatus.BAD_REQUEST, 'Dublicate data');
}

function rethrowResolved(err) {
    err.resolved = true;
    throw err;
}

function exitResolved() {
    var err = new Error('Resolved');
    err.resolved = true;
    throw err;
}

function handleInternalError(res, err) {
    if (err.resolved === true) {
        return;
    }
    return res.sendInternalServerError();
}

function wrapper(req, res, next) {
    /* USER CONSTUCTION */ 
    req.prepareUser = function()   { prepareReqUser(this);      };
    req.fillUser    = function(row){ fillReqUser(this, row);    };
    /* ERROR HANDLING */
    res.handleInternalError     = function(err){ handleInternalError(this, err); };
    res.sendError = function(code, err, http_code){ sendError(this, code, err, http_code); };
    res.sendErrorMsg = function(code, msg, http_code){ sendErrorMsg(this, code, msg, http_code); };
    res.sendInternalServerError = function(err){ sendInternalServerError(this, err); };
    res.sendNotFoundError       = function(msg){ sendNotFoundError(this, msg); };
    res.sendInvalidDataError    = function()   { sendInvalidDataError(this); };
    res.sendDublicateError      = function()   { sendDublicateError(this); };
    res.sendInvalidTokenError    = function()  { sendInvalidTokenError(this); };
    res.sendUserNotApprovedError = function()   { sendUserNotApprovedError(this); };
    next();
}

module.exports = {
    EPS: EPS,
    socketUserCheck: function (client) {
        //if ()
    },
    /* USER CONSTUCTION */ 
    prepareReqUser:     prepareReqUser,
    fillReqUser:        fillReqUser,
    /* ERROR HANDLING */
    constructError:             constructError,
    handleInternalError:        handleInternalError,
    sendInternalServerError:    sendInternalServerError,
    sendNotFoundError:          sendNotFoundError,
    sendInvalidTokenError:      sendInvalidTokenError,
    sendUserNotApprovedError:   sendUserNotApprovedError,
    sendInvalidDataError:       sendInvalidDataError,
    sendDublicateError:         sendDublicateError,
    rethrowResolved:            rethrowResolved,
    exitResolved:               exitResolved,
    /* OTHER */
    isHex:              isHex,
    isNormalInteger:    isNormalInteger,
    trimNonAlpha:       trimNonAlpha,
    asciiFilter:        asciiFilter,
    wrapper: wrapper
};
