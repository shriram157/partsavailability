/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0, quotes: 0, no-use-before-define: 0, new-cap:0 */
"use strict";

module.exports = function () {

	var async = require('async');
	var express = require('express');
	var request = require('request');
	var xsenv = require("@sap/xsenv");

	var auth64;

	var app = express.Router();
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

	auth64 = 'Basic ' + new Buffer(uname + ':' + pwd).toString('base64');

	var reqHeader = {
		"Authorization": auth64,
		"Content-Type": "application/json",
		"APIKey": APIKey,
		"x-csrf-token": "Fetch"
	};

	app.use(function (req, res, next) {
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		next();
	});

	// session information. 
	app.get('/sessioninfo', function (req, res) {
		res.writeHead(200, {
			'Content-Type': 'application/json'
		});
		res.end(JSON.stringify({
			userEncoded: encodeURI(JSON.stringify(req.user))
		}));

	});

	// user Information to UI.
	//Security Attributes received via UserAttributes via Passport
	
	
	// app.get('/attributes/:id', function(req, res) {
 //      res.send('user' + req.params.id);    
 //     });

	
	app.get('/attributes/forPartsOrder', (req, res) => {
			console.log("Parts Availability Aplication is being called from Parts Ordering with Dealer code", req.params.DealerCode)
				//	res.type("application/json").status(200).send(JSON.stringify(req.authInfo.userAttributes));
			var receivedData = {};

			var sendToUi = {
				"attributes": [],
				"samlAttributes": [],
				legacyDealer: "",
				legacyDealerName: ""

				// userType   = req.authInfo.userAttributes.UserType[0],
				// DealerCode = req.authInfo.userAttributes.DealerCode[0],
				// Language   =  req.authInfo.userAttributes.Language[0]
			};

			console.log(req.authInfo.userAttributes);
			var parsedData = JSON.stringify(req.authInfo.userAttributes);
			console.log('After Json Stringify', parsedData);

			var obj = JSON.stringify(req.authInfo.userAttributes);
			var obj_parsed = JSON.parse(obj);
			sendToUi.samlAttributes.push(obj_parsed);
			var csrfToken;
			var samlData = parsedData;

			console.log(samlData);

			console.log('send to ui data', sendToUi);
			
			
			// ===================only for local testing - remove next deploy
						var obj_temp =
				{ Language: [ 'English', 'English' ],
				  UserType: [ 'Dealer', 'Dealer' ],
                DealerCode: [ '42120', '42120' ] };
			// console.log(req.authInfo.userAttributes);
			 var parsedData = JSON.stringify(obj_temp);
	//		 console.log('After Json Stringify', parsedData);

			
// =========================================
			var obj_data = JSON.parse(parsedData);
			console.log('identify provider data received', obj_data);
           // var userType = obj_data.UserType[0];
          
   //         if (userType == 'Dealer' ) {
			// var legacyDealer = obj_data.DealerCode[0];
   //         }
			 
		//	if (req.params.DealerCode) {
		        var  userType = 'Dealer';  //make it a dealer type
		          var legacyDealer = obj_data.DealerCode[0];	
				
		//	}

			console.log('Dealer Number logged in and accessed parts Availability App', legacyDealer);

			// var legacyDealer = '01050'; // local testing
			// var userType = 'Dealer'

		//	if  usertype eq dealer then just get the details for that dealer,  otherwise get everything else

			if (userType == 'Dealer') {

			var url1 = "/API_BUSINESS_PARTNER/A_BusinessPartner/?$format=json&$filter=SearchTerm2 eq'"+ legacyDealer +"'&$expand=to_Customer&$format=json&?sap-client=" + client ;			 

			} else {

        	var url1 = "/API_BUSINESS_PARTNER/A_BusinessPartner/?$format=json&$expand=to_Customer&?sap-client=" + client + "&$filter=BusinessPartnerType eq 'Z001' or BusinessPartnerType eq 'Z004' or BusinessPartnerType eq 'Z005'  &$orderby=BusinessPartner asc"	;		

			 }
			console.log('Final url being fetched', url + url1);
			request({
					url: url + url1,
					headers: reqHeader

				}, function (error, response, body) {
					
					var attributeFromSAP;
					if (!error && response.statusCode == 200) {
						csrfToken = response.headers['x-csrf-token'];

						var json = JSON.parse(body);
						// console.log(json);  // // TODO: delete it Guna
				
				
				
				for (var i = 0; i < json.d.results.length; i++) {

					receivedData = {};

					var BpLength = json.d.results[i].BusinessPartner.length;
					receivedData.BusinessPartnerName  = json.d.results[i].OrganizationBPName1;
					receivedData.BusinessPartnerKey   = json.d.results[i].BusinessPartner;
					receivedData.BusinessPartner      = json.d.results[i].BusinessPartner.substring(5, BpLength);
					receivedData.BusinessPartnerType  = json.d.results[i].BusinessPartnerType;

					let attributeFromSAP;
					try {
						attributeFromSAP = json.d.results[i].to_Customer.Attribute1;
					} catch (e) {
						console.log("The Data is sent without Attribute value for the BP", json.d.results[i].BusinessPartner)
							// return;
					}

				
					switch (attributeFromSAP) {
					case "01":
						receivedData.Division = "10";
						receivedData.Attribute = "01"
						break;
					case "02":
						receivedData.Division = "20";
						receivedData.Attribute = "02"
						break;
					case "03":
						receivedData.Division = "Dual";
						receivedData.Attribute = "03"
						break;
					case "04":
						receivedData.Division = "10";
						receivedData.Attribute = "04"
						break;
					case "05":
						receivedData.Division = "Dual";
						receivedData.Attribute = "05"
						break;
					default:
						receivedData.Division = "10";  //  lets put that as a toyota dealer
						receivedData.Attribute = "01"
						
					}
			

					if ((receivedData.BusinessPartner == legacyDealer) && (userType == 'Dealer')) {
						sendToUi.legacyDealer = receivedData.BusinessPartner,
							sendToUi.legacyDealerName = receivedData.BusinessPartnerName
						sendToUi.attributes.push(receivedData);
						break;
					}

					if (userType == 'Dealer') {
						continue;
					} else {
						sendToUi.attributes.push(receivedData);
					}
				}
		
					res.type("application/json").status(200).send(sendToUi);
					console.log('Results sent successfully');
				} else {

					var result = JSON.stringify(body);
					res.type('application/json').status(400).send(result);
				}
			});

	});

return app;
};