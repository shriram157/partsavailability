/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0, new-cap: 0*/
/*eslint-env node, es6 */
'use strict';
var express = require('express');
var request = require('request');
var xsenv = require("@sap/xsenv");
var passport = require('passport');
var JWTStrategy = require('@sap/xssec').JWTStrategy;

var async = require('async');

module.exports = function () {
	var app = express.Router();
	//Hello Router
	app.get('/', (req, res) => {
		var output = '<a os Details</a> - Your Node Module is up and Running</br> ';
		// console.log(req);

		res.type('text/html').status(200).send(output);
	});

	var auth64;

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



	//  get business partner details 
	app.get('/API_BUSINESS_PARTNER', function (req, res) {

		var csrfToken;
		request({
			url: url +
				"/API_BUSINESS_PARTNER/A_BusinessPartner/?$format=json&$expand=to_Customer&?sap-client=" + client +
				"&$filter=BusinessPartnerType%20eq%20%27Z001%27&$orderby=BusinessPartner%20asc",
			headers: reqHeader

		}, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				csrfToken = response.headers['x-csrf-token'];
				// console.log(csrfToken);
				var json = JSON.parse(body);
				res.json(json);
			} else {

				var result = JSON.stringify(body);
				res.type('application/json').status(400).send(result);
			}
		});
	});

	// get material Text
	app.get('/MD_PRODUCT_FS_SRV/I_MaterialText', function (req, res) {

		var material = req.param('Material');
		var langu = req.param('Language');
		var sUrl = "/ZMD_PRODUCT_FS_SRV/I_MaterialText(Material='" + (material) + "',Language='" + (langu) + "')?$format=json&?sap-client=" +
			client;   //// TODO: To revisit and zmd to md

		var csrfToken;
		request({
			url: url + sUrl,
			headers: reqHeader

		}, function (error, response, body) {

			if (!error && response.statusCode == 200) {
				csrfToken = response.headers['x-csrf-token'];

				var json = JSON.parse(body);
				res.json(json);

			} else {

				var result = JSON.stringify(body);
				res.type('application/json').status(400).send(result);
			}
		});

	});

	// get product details. 	

	app.get('/MD_PRODUCT_FS_SRV/C_Product_fs', function (req, res) {
		var material = req.param('Material');
		var division = req.param('Division');

		var sUrl = "/ZMD_PRODUCT_FS_SRV/C_Product_Fs('" + (material) + "')?$format=json&?sap-client=" + client;
		var csrfToken;     //// TODO: To revisit and zmd to md

		request({
			url: url + sUrl,
			headers: reqHeader

		}, function (error, response, body) {

			if (!error && response.statusCode == 200) {
				csrfToken = response.headers['x-csrf-token'];
				var json = JSON.parse(body);
				res.json(json);

			} else {

				var result = JSON.stringify(body);
				res.type('application/json').status(400).send(result);
			}
		});

	});

	// get the Supplying plant

	app.get('/MD_PRODUCT_FS_SRV/A_Customer', function (req, res) {

		var selectedCustomer = req.param('customer');
		var division = req.param('division');
		var finalUrl = url + sUrlforSupplyingPlant;

		var sUrlforSupplyingPlant = "/API_BUSINESS_PARTNER/A_Customer(Customer=" + "'" +
			(selectedCustomer) + "'" + ")/to_CustomerSalesArea?sap-client=" + client + "&$format=json&$filter=SalesOrganization" + " eq'" +
			"7000" + "'" +
			"and DistributionChannel" +
			" eq'" + "10" + "'" + "&$select=SupplyingPlant";

		var csrfToken;
		console.log(url + sUrlforSupplyingPlant);

		request({
			url: url + sUrlforSupplyingPlant,
			headers: reqHeader

		}, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				csrfToken = response.headers['x-csrf-token'];
				var json = JSON.parse(body);
				res.json(json);
			} else {

				var result = JSON.stringify(body);
				res.type('application/json').status(400).send(result);
			}
		});

	});

	// get the pricing details - price set. 
	app.get('/ZMD_PRODUCT_FS_SRV/zc_PriceSet', function (req, res) {

		var csrfToken;

		var selectedMaterial = req.param('Matnr');
		var sCurrentLocale = req.param('LanguageKey');
		var supplyingPlant = req.param('Plant');
		var selectedCustomer = req.param('Customer');
		var division = req.param('division');

		var sUrlforPricingDetails = "/ZMD_PRODUCT_FS_SRV/zc_PriceSet(Customer=" + "'" + (selectedCustomer) + "'," +
			"DisChannel" + "='" + "10" + "'," + "Division" + "='" + (division) + "'," + "Matnr" + "='" + (selectedMaterial) + "'," +
			"SalesDocType" + "='" + "ZAF" + "'," + "SalesOrg" + "='" + "7000" + "'," + "AddlData" + "=" + true + "," + "LanguageKey" + "='" + (
				sCurrentLocale) + "'," + "Plant" + "='" + (supplyingPlant) + "')" + "?$format=json&?sap-client=" + client;

		console.log(url + sUrlforPricingDetails);

		request({
			url: url + sUrlforPricingDetails,  
			headers: reqHeader

		}, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				csrfToken = response.headers['x-csrf-token'];
				var json = JSON.parse(body);
				res.json(json);

			} else {
				var result = JSON.stringify(body);
					res.type('application/json').status(400).send(result);

			}
		});
	});
   
   // get the backsuper set service. 
   	app.get('/ZMD_PRODUCT_FS_SRV/zc_BackSuperSet2', function(req, res) {

		var csrfToken;

		var selectedMaterial = req.param('Matnr');
		var sCurrentLocale = req.param('LanguageKey');
		var supplyingPlant = req.param('Plant');
		var selectedCustomer = req.param('Customer');
		var division = req.param('Division');

		var sUrlForBackSuperSet = "/ZMD_PRODUCT_FS_SRV/zc_BackSuperSet(Customer=" + "'" + (selectedCustomer) +
			"'," + "DisChannel" + "='" + "10" + "'," + "Division" + "='" + (division) + "'," + "Matnr" + "='" + (selectedMaterial) + "'," +
			"SalesDocType" + "='" + "ZAF" + "'," + "SalesOrg" + "='" + "7000" + "'," + "LanguageKey" + "='" + (sCurrentLocale) + "'," +
			"Plant" + "='" + (supplyingPlant) + "')" + "?$format=json&$expand=toForwSuper&?sap-client=" + client; 

		request({
			url: url + sUrlForBackSuperSet, //url+sUrl+sUrlforPriceSet,
		    headers: reqHeader
		}, function(error, response, body) {
			if (!error && response.statusCode == 200) {
				csrfToken = response.headers['x-csrf-token'];
				var json = JSON.parse(body);
				res.json(json);
			} else {

				var result = JSON.stringify(body);
				res.type('application/json').status(400).send(result);
			}
		});
	});
   
	// quantity set service
	
		app.get('/ZMD_PRODUCT_FS_SRV/zc_QuantitySet', function(req, res) {

		var csrfToken;

		var selectedMaterial = req.param('Matnr');

		var sUrlforQuantity = "/ZMD_PRODUCT_FS_SRV/zc_QuantitySet?$filter=Matnr eq" + "'" + (selectedMaterial) + "'" +
			"&$format=json";

		request({
			url: url + sUrlforQuantity, //url+sUrl+sUrlforPriceSet,
			headers: reqHeader

		}, function(error, response, body) {
			if (!error && response.statusCode == 200) {
				csrfToken = response.headers['x-csrf-token'];
				var json = JSON.parse(body);
				res.json(json);
			} else {

				var result = JSON.stringify(body);
				res.type('application/json').status(400).send(result);
			}
		});
	});
	

	//  call the material service again for returning the suggestion list. 
	
		app.get('/MD_PRODUCT_FS_SRV/I_MaterialSuggest', function(req, res) {

		var sTerm = req.param('Material');
 
		var sUrl = "/ZMD_PRODUCT_FS_SRV/I_MaterialText?$filter=startswith(Material," + "'" + (sTerm) + "')&$format=json&?sap-client=" + client;
		var csrfToken;   // // TODO: zmd to md
  

		request({
			url: url + sUrl,
			headers:  reqHeader

		}, function(error, response, body) {
			if (!error && response.statusCode == 200) {
				csrfToken = response.headers['x-csrf-token'];
				var json = JSON.parse(body);
				res.json(json);
				} else {

				var result = JSON.stringify(body);
				res.type('application/json').status(400).send(result);
			}
		});
	});
	

	return app;
};