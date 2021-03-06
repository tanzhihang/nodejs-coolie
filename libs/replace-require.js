/*!
 * 替换 require 字符串
 * @author ydr.me
 * @create 2014-10-23 20:50
 */


"use strict";

var string = require('ydr-utils').string;
var dato = require('ydr-utils').dato;
var log = require("./log.js");
var pathURI = require("./path-uri.js");
var REG_DEFINE = /\bdefine\b\s*?\b\(\s*?function\b[^(]*\(([^,)]*)/;


/**
 * 替换 require
 * @param file {String} 文件路径
 * @param code {String} 代码
 * @param depNameList {Array} 依赖数组
 * @param depName2IdMap {Object} 依赖对应表
 */
module.exports = function (file, code, depNameList, depName2IdMap) {
    var requireVar = _getRequireVar(code);

    //console.log('\n================');
    //console.log(requireVar);
    //console.log(depNameList);
    //console.log(depName2IdMap);


    if (!requireVar && depNameList.length) {
        log('replace require', 'can not found `require` variable, but used', 'error');
        process.exit(1);
    }

    depNameList.forEach(function (depName) {
        var reg = _buildReg(requireVar, depName);
        var id = depName2IdMap[depName];

        if (!id) {
            log("replace require", pathURI.toSystemPath(file), "error");
            log("replace require", "can not found `" + depName + "` map", "error");
            process.exit(1);
        }

        code = code.replace(reg, requireVar + "(\"" + depName2IdMap[depName] + "\")");
    });

    return code;
};


/**
 * 提取 define 里的 require 变量
 * define("index.js",["1"],function(s,e,i){"use strict";s("../libs/all.js");console.log("app/index.js")});
 * @private
 */
function _getRequireVar(str) {
    return (str.match(REG_DEFINE) || ["", ""])[1].trim();
}


/**
 * 生成正则
 * @param requireVar
 * @param dep
 * @returns {RegExp}
 * @private
 */
function _buildReg(requireVar, dep) {
    dep = string.escapeRegExp(dep);

    // require("...");
    // require("some!...");
    // require("...", "...");
    return new RegExp("\\b" + string.escapeRegExp(requireVar) + "\\(['\"](?:[^'\"]*!)?" + dep + "['\"]" +
        "(?:\\s*?,\\s*?['\"][^'\"]*?['\"])?\\)", 'g');
}
