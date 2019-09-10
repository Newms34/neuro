var express = require('express');
var router = express.Router(),
    path = require('path'),
    https = require('https'),
    async = require('async');


router.get('/', function(req, res, next) {
    res.sendFile('./index.html', { root: './views' })
});
router.get('/remote', function(req, res, next) {
    res.sendFile('./remote.html', { root: './views' })
});
module.exports = router;
