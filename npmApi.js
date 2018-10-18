'use strict';

let Promise = require('bluebird'),
    _ = require('lodash'),
    Download = require('download'),
    downloadStatus = require('download-status'),
    util = require('util'),
    winston = require('winston'),
    validUrl = require('valid-url'),
    got = require('got'),
    nameUtils = require('./nameUtils'),
	path = require('path');

module.exports = {
    getVersionsOf (name) {
        return new Promise(resolve => {
            getJson(buildUrl(name))
                .then(data => {
                    resolve([name, _.keys(data.versions)]);
                });
        });
    },

    getDependenciesOf (npmPackage) {
        if (!npmPackage.version) {
            return this.getDependenciesOfLatest(npmPackage);
        } else {
            return new Promise(resolve => {
                getJson(buildUrl(npmPackage.name))
                    .then(data => {
                        resolve(data.versions[npmPackage.version].dependencies);
                    })
            });
        }
    },

    getDevDependenciesOf (npmPackage) {
        if (!npmPackage.version) {
            return this.getDevDependenciesOfLatest(npmPackage);
        } else {
            return new Promise(resolve => {
                getJson(buildUrl(npmPackage.name))
                    .then(data => {
                        resolve(data.versions[npmPackage.version].devDependencies);
                    })
            });
        }
    },

    getDependenciesOfLatest (name) {
        return new Promise(resolve => {
            this.getLatestOf(name)
                .then(data => {
                    resolve(data.dependencies || data.peerDependencies);
                })
        });
    },
    getDevDependenciesOfLatest (name) {
        return new Promise(resolve => {
            this.getLatestOf(name)

                .then(data => {
                    resolve(data.devDependencies);
                })
        });
    },

    getLatestOf (name) {
        // Npm site is does not allow /latest for scoped packages (WTF)
        if (nameUtils.isScoped(name)){
            return new Promise(resolve => {
                getJson(`http://registry.npmjs.org/${name}`)
                    .then((data => resolve(data.versions[data['dist-tags'].latest])));
            })
        }
        return getJson(`${buildUrl(name)}latest`);
    },

    getLatestVersionOf: function (name) {
        return new Promise(resolve => {
            this.getLatestOf(name)
                .then(data => resolve(data.version))
        })
    },

    downloadTarBallOf (name, versions, downloadDir) {
        let download = Promise.promisifyAll(new Download({retries: 10}));

        versions.forEach(version => {
            let url = buildUrl(name, version);
            winston.info('Downloading ', url);
            download.get(url);
        });

        return download
            .use(downloadStatus())
            .dest(path.join(downloadDir, name, '-'))
            .runAsync();
    }
};

function buildUrl(name, version) {
    if (validUrl.isUri(version)) {
        return version;
    }
    else if (version){
        return util.format("https://registry.npmjs.org/%s/-/%s-%s.tgz", name.replace('%2f', '/'), nameUtils.unscopeName(name), version);
    }

    return util.format("https://registry.npmjs.org/%s/", name.replace('/', '%2f'));
}

function getJson(url) {
    return new Promise((resolve) => {
        got(url, {json: true})
            .then(data => resolve(data.body))
            .catch((err) => {
                winston.error(`${err.toString()} : ${err.host + err.path} -> Was unable to find package: ${err.path.slice(1)}` );
                resolve({});
            });
    })
}
