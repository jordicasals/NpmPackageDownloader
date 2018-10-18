"use strict";

let winston = require('winston'),
	path = require('path');

module.exports = function(output){
    winston.add(winston.transports.File, {
        level:'error',
        filename: path.join(output, 'errorLog.log')
    });

    winston.cli();
};
