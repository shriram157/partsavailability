/*eslint no-console: 0, no-unused-vars: 0, no-undef:0*/
/*eslint-env node, es6 */
//  ===================  Parts Availability Node Server============================= //
'use strict';
var https = require('https');
var port = process.env.PORT || 3000;
var xsenv = require('@sap/xsenv');
var server = require('http').createServer();
// https.globalAgent.options.ca = xsenv.loadCertificates();
global.__base = __dirname + '/';

//Initialize Express App for XSA UAA and HDBEXT Middleware
var passport = require('passport');
// var xssec = require('@sap/xssec');
var xsHDBConn = require('@sap/hdbext');
var express = require('express');

//logging
var logging = require('@sap/logging');
var appContext = logging.createAppContext();


//Initialize Express App for XS UAA and HDBEXT Middleware
var app = express();
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";  // TODO: 
// passport.use('JWT', new xssec.JWTStrategy(xsenv.getServices({
// 	uaa: {
// 		tag: 'xsuaa'
// 	}
// }).uaa));
app.use(logging.expressMiddleware(appContext));
// app.use(passport.initialize());
// var hanaOptions = `node server.js`.getServices({
// 	hana: {
// 		tag: 'hana'
// 	}
// });
//hanaOptions.hana.rowsWithMetadata = true;
// app.use('/jobactivity',
// 			xsHDBConn.middleware(hanaOptions.hana));
// app.use('/',
// 	passport.authenticate('JWT', {
// 		session: false
// 	}),
// 	xsHDBConn.middleware(hanaOptions.hana)
// );

// =======================================For Authorizations and JWT use======================= BEGIN

// Libraries that you require to set up authorization.
 
 
var JWTStrategy = require('@sap/xssec').JWTStrategy;

var services = xsenv.getServices({ uaa: { tag: "xsuaa" } });
passport.use(new JWTStrategy(services.uaa));
app.use(passport.initialize());
app.use(passport.authenticate('JWT', { session: false }));



// =======================================For Authorizations and JWT use=======================END


//Setup Routes
var router = require('./router')(app, server);

//Start the Server
server.on('request', app);
server.listen(port, function() {
	console.info(`HTTP Server: ${server.address().port}`);
});
