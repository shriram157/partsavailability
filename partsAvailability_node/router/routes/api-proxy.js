/*eslint new-cap: 0, no-console: 0, no-shadow: 0, no-unused-vars: 0*/
/*eslint-env es6, node*/

"use strict";

var express = require('express');
var request = require('request');
var xsenv = require("@sap/xsenv");

// vehicle Locator Node Module. 
module.exports = function (appContext) {
	var app = express.Router();

	// SAP Calls Start from here
	var options = {};
	options = Object.assign(options, xsenv.getServices({
		api: {
			name: "PARTS_AVAILABILITY_APIM_CUPS"
		}
	}));

	var uname = options.api.user,
		pwd = options.api.password,
		url = options.api.host,
		APIKey = options.api.APIKey,
		client = options.api.client;
	console.log('The API Management URL', url);

	var auth64 = 'Basic ' + new Buffer(uname + ':' + pwd).toString('base64');

	var reqHeader = {
		"Authorization": auth64,
		"Content-Type": "application/json",
		"APIKey": APIKey,
		"x-csrf-token": "Fetch"
	};

	var csrfToken;
	// simple version of bridge call
	app.all('/*', function (req, res, next) {

		let headOptions = {};

		// prepare the magic reverse proxy header for odata service to work. 
		// let originalHost = req.hostname;
		// if (!!req.headers.host){
		//     headOptions.host = req.headers.host;
		// }

		//only support the basic auth
		headOptions.Authorization = auth64;

		let method = req.method;
		let xurl = url + req.url;
		console.log('Method', method);
		console.log('Incoming Url', xurl);

		//  if the method = post you need a csrf token.         

		let xRequest =
			request({
				method: method,
				url: xurl,
				headers: reqHeader
			});

		req.pipe(xRequest);

		xRequest.on('response', (response) => {
			// delete response.headers['set-cookie'];
			csrfToken = response.headers['x-csrf-token'];
			xRequest.pipe(res);
		}).on('error', (error) => {
			next(error);
		});
	});

	return app;
};