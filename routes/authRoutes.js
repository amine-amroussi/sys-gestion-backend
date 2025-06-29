const express = require('express');
const router = express.Router();

const {login} = require('../controller/authController');

router.route('/').post(login);

module.exports = router;