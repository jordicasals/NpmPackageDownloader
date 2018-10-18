"use strict";

let winston = require('winston'),
    Zip = require('node-7z'),
	path = require('path');

module.exports = function (location) {
    winston.info('7Ziping your files, Please wait...');

    let zip = new Zip();

    return zip.add(path.join(location, 'npm-personalNumber.7z'), location)
            .then(() => winston.info(`Finished ziping!\n7Zip is wating for you in ${location}`))
};
