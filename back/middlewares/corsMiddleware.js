"use strict";

const cors = (req, res, next) => {
    res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL); // Use the environment variable for allowed domains
    res.header(
        'Access-Control-Allow-Headers',
        'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Access-Control-Allow-Request-Method'
    );
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS, PATCH');
    res.header('Allow', 'GET, PUT, POST, DELETE, OPTIONS');
    next();
};

module.exports = cors;
