/*!
 * 构建入口模块
 * @author ydr.me
 * @create 2014-10-23 19:44
 */


"use strict";

var path = require('path');
var fs = require('fs-extra');
var log = require('../libs/log.js');
var sign = require('../libs/sign.js');
var dato = require('ydr-utils').dato;
var pathURI = require("../libs/path-uri.js");
var encryption = require('ydr-utils').encryption;
var Increase = require('../libs/Increase.js');
var buildModule = require('./build-module.js');


module.exports = function (mainFile, callback) {
    var bufferList = [];
    // 入口模块名称
    var mainName = path.basename(mainFile);
    // 自增对象
    var increase = new Increase();
    // 模块绝对路径 <=> ID 对应表
    var depIdsMap = {};
    // 记录已经构建的列表
    var depsCache = {};
    var depsLength = 1;
    var depsRelationship = {};
    var md5List = '';
    var deepDeps = [];

    var _deepBuld = function (name, type, file) {
        buildModule(name, type, file, increase, depIdsMap, function (err, meta) {
            if (err) {
                log("build", pathURI.toSystemPath(file), "error");
                log('build', err.message, 'error');
                process.exit(1);
            }

            var code = meta.code;
            var depList = meta.depList;
            var output;

            // 采用内容 MD5
            md5List += encryption.md5(code);
            depsCache[mainFile] = true;
            bufferList.push(new Buffer("\n" + code, "utf8"));
            depsRelationship[file] = {};

            if (depList.length) {
                depList.forEach(function (dep, index) {
                    var depId = dep.id;

                    depsRelationship[file][depId] = true;

                    if (deepDeps.indexOf(depId) === -1) {
                        deepDeps.push(depId);
                    }

                    if (depsRelationship[depId] && depsRelationship[depId][file]) {
                        log('depend cycle', pathURI.toSystemPath(file) + '\n' + pathURI.toSystemPath(depId), 'error');
                        process.exit(1);
                    }

                    if (!depsCache[depId]) {
                        depsCache[depId] = true;
                        //log("require", pathURI.toSystemPath(depId));
                        _deepBuld(dep.name, dep.type, depId);
                        depsLength++;
                    }
                });
            }

            if (depsLength === bufferList.length) {
                output = sign('js');
                output += Buffer.concat(bufferList).toString();
                callback(null, output, md5List, deepDeps);
            }
        });
    };

    // 第一个 define 模块为入口模块，不必指定其 name
    depIdsMap[mainFile] = '0';
    log("√", pathURI.toSystemPath(mainFile), "success");
    _deepBuld(mainName, 'js', mainFile);
};
