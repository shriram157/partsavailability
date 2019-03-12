/*eslint new-cap: 0, no-console: 0, no-shadow: 0, no-unused-vars: 0*/
/*eslint-env es6, node*/

"use strict";

var xsenv = require('@sap/xsenv');

module.exports = {
	getAccessToken: function(req) {
		var accessToken = null;
		if (req.headers.authorization && req.headers.authorization.split(" ")[0] === "Bearer") {
		   accessToken =  req.headers.authorization.split(" ")[1];
		}
		return accessToken;
		
	}
};