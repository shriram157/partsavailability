sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sap/ui/core/routing/History",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/m/MessageToast",
	"sap/ui/core/Fragment",
	"partsAvailability/model/formatter",
	"partsAvailability/model/models"

], function (Controller, MessageBox, History, JSONModel, Filter, MessageToast, Fragment, formatter, models) {
	"use strict";

	return Controller.extend("partsAvailability.controller.searchMaterialandDisplay", {
		formatter: formatter,
		onInit: function () {

			// instantiate the display model

			// I made this comment in codeREadyForDevDeploy and wanted to merge to codeReadyforQASDeploy without affecting the 
			// mta.yaml file. This is staged and Committed in the codeREadyForDevDeploy Branch. 


			this.getView().setModel(new sap.ui.model.json.JSONModel(), "materialDisplayModel");

			var oI18nModel = new sap.ui.model.resource.ResourceModel({
				bundleUrl: "i18n/i18n.properties"
			});
			this.getView().setModel(oI18nModel, "i18n");

			//  get the locale to determine the language. 
			var isLocaleSent = window.location.search.match(/language=([^&]*)/i);
			if (isLocaleSent) {
				var sSelectedLocale = window.location.search.match(/language=([^&]*)/i)[1];
			} else {
				var sSelectedLocale = "EN"; // default is english 
			}

			//selected language. 
			// if (window.location.search == "?language=fr") {
			if (sSelectedLocale == "fr") {
				var i18nModel = new sap.ui.model.resource.ResourceModel({
					bundleUrl: "i18n/i18n.properties",
					bundleLocale: ("fr")

				});
				this.getView().setModel(i18nModel, "i18n");
				this.sCurrentLocale = 'FR';
				// set the right image for logo	 - french		
				/*				var currentImageSource = this.getView().byId("idLexusLogo");
								currentImageSource.setProperty("src", "images/Lexus_FR.png");*/

			} else {
				var i18nModel = new sap.ui.model.resource.ResourceModel({
					bundleUrl: "i18n/i18n.properties",
					bundleLocale: ("en")

				});
				this.getView().setModel(i18nModel, "i18n");
				this.sCurrentLocale = 'EN';
				// set the right image for logo			
				/*				var currentImageSource = this.getView().byId("idLexusLogo");
								currentImageSource.setProperty("src", "images/Lexus_EN.png");*/

			}

			// receive the Division also from the URL 
			// var isDivisionSent = window.location.search.match(/Division=([^&]*)/i);
			// if (isDivisionSent) {
			// 	this.sDivision = window.location.search.match(/Division=([^&]*)/i)[1];

			// 	if (this.sDivision == "20") {
			// 		// if the current division is Lexus and Locale is english,  then english language. 
			// 		if (this.sCurrentLocale == "EN") {
			// 			var currentImageSource = this.getView().byId("idLexusLogo");
			// 			currentImageSource.setProperty("src", "images/i_lexus_black_full.png");
			// 		} else {
			// 			var currentImageSource = this.getView().byId("idLexusLogo");
			// 			currentImageSource.setProperty("src", "images/i_lexus_black_full.png");

			// 		}
			// 	} else {
			// 		var currentImageSource = this.getView().byId("idLexusLogo");
			// 		currentImageSource.setProperty("src", "images/toyota_logo_colour.png");
			// 	}

			// } else {
			// 	this.sDivision = "10"; //if division is blank lets run default for toyota. 
			// 	var currentImageSource = this.getView().byId("idLexusLogo");
			// 	currentImageSource.setProperty("src", "images/toyota_logo_colour.png");
			// }

			var oModeli18n = this.getView().getModel("i18n");
			this._oResourceBundle = oModeli18n.getResourceBundle();

			this._oViewModel = new sap.ui.model.json.JSONModel({
				busy: false,
				delay: 0,
				enableMaterialEntered: false,
				afterMaterialFound: false,
				materialFormError: false

			});

			this.getView().setModel(this._oViewModel, "detailView");

			// initialize the models needed to display the records. 

			this._materialDisplayModel = new JSONModel();
			this.getView().setModel(this._materialDisplayModel, "materialDisplayModel");
			//  model for suggestion

			var oMaterialData = this.getOwnerComponent().getModel("oMaterialData");
			this.getView().setModel(oMaterialData, "oMaterialData");

			// materialSuggestionModel
			this._materialSuggestionModel = new JSONModel();
			this.getView().setModel(this._materialSuggestionModel, "materialSuggestionModel");

			// selectedDealerModel
			this._selectedDealerModel = new JSONModel();
			this.getView().setModel(this._selectedDealerModel, "selectedDealerModel");

			// model instantiation for Supersession
			this._superSessionModel = new sap.ui.model.json.JSONModel();
			this._materialInventory = new sap.ui.model.json.JSONModel();

			var that = this;
			// this.sDivision;
			// this.nodeJsUrl = "https://tcipn1sap01.tci.internal.toyota.ca:51130";
			
			
			     var sLocation = window.location.host;
      var sLocation_conf = sLocation.search("webide");
    
      if (sLocation_conf == 0) {
        this.sPrefix = "/partsAvailability_node";
      } else {
        this.sPrefix = "";
        
     }
      
      this.nodeJsUrl = this.sPrefix + "/node";
			
			

			$.ajax({
				url:  this.sPrefix + "/userDetails/attributes",
				type: "GET",
				dataType: "json",

				success: function (oData) {
					var BpDealer = [];
					var userAttributes = [];
					// this.DealerCode = oData.legacyDealer;
					// this.legacyDealerName = oData.legacyDealerName;
					// this.userType         = oData.userType; 

					$.each(oData.attributes, function (i, item) {
						var BpLength = item.BusinessPartner.length;

						BpDealer.push({
							"BusinessPartnerKey": item.BusinessPartnerKey,
							"BusinessPartner": item.BusinessPartner, //.substring(5, BpLength),
							"BusinessPartnerName": item.BusinessPartnerName, //item.OrganizationBPName1 //item.BusinessPartnerFullName
							"Division": item.Division
						});

					});
					that.getView().setModel(new sap.ui.model.json.JSONModel(BpDealer), "BpDealerModel");
					// read the saml attachments the same way 
					$.each(oData.samlAttributes, function (i, item) {
						//this.DealerCode = item.DealerCode[0];
						//this.userType  = item.userType[0];
						//this.Language = item.Language[0];

						userAttributes.push({
							"UserType": item.UserType[0],
							"DealerCode": item.DealerCode[0],
							"Language": item.Language[0]
						});

					});

					that.getView().setModel(new sap.ui.model.json.JSONModel(userAttributes), "userAttributesModel");
					that._readTheAttributes();

					//	that._getTheUserAttributes();

				}.bind(this),
				error: function (response) {
	          	sap.ui.core.BusyIndicator.hide();
				}
			});
		},

		// _getTheUserAttributes: function () {

		// 	// call the nodeJS Attribute details. 
		// 	//  read the SAML attributes to get the Dealer Code, Language, and userType. 
		// 	// https://partsavailability.cfapps.us10.hana.ondemand.com/userDetails/attributes
		// 	var that = this;
		// 	$.ajax({
		// 		url: "/userDetails/attributes",

		// 		type: "GET",
		// 		dataType: "json",

		// 		success: function (oData) {
		// 			var userAttributes = [];

		// 			userAttributes.push({
		// 				"UserType": oData.UserType[0],
		// 				"DealerCode": oData.DealerCode[0],
		// 				"Language": oData.Language[0]
		// 			});

		// 			that.getView().setModel(new sap.ui.model.json.JSONModel(userAttributes), "userAttributesModel");
		// 			that._readTheAttributes();
		// 		},
		// 		error: function (response) {

		// 		}
		// 	});

		// },

		_readTheAttributes: function () {

			//if the userAttributes has toyota user then we have to continue with 
			var oModel = this.getView().getModel("userAttributesModel");
			var userDetails = oModel.getData();
			var oViewModel = this.getView().getModel("detailView");

			var oModelBP = this.getView().getModel("BpDealerModel");
			var aDataBP = oModelBP.getData();

			// the user type from SAML is blank so it could be internal user

			if (!userDetails[0].DealerCode) {
				// he is a not dealer

				if (!this.sDivision) {
					var currentImageSource = this.getView().byId("idLexusLogo");
					currentImageSource.setProperty("src", "images/toyotoLexus.png");
				}
				oViewModel.setProperty("/editAllowed", true);
			} else {
				//he is  a dealer.

				for (var i = 0; i < aDataBP.length; i++) {
					if (aDataBP[i].BusinessPartner == userDetails[0].DealerCode) {
						this.getView().byId("dealerID").setSelectedKey(aDataBP[i].BusinessPartnerKey);

						//selectedDealerModel>/Dealer_Name
						this.sSelectedDealer = aDataBP[i].BusinessPartnerKey;
						this._selectedDealerModel.setProperty("/Dealer_No", aDataBP[i].BusinessPartnerKey);
						this._selectedDealerModel.setProperty("/Dealer_Name", aDataBP[i].BusinessPartnerName);

						oViewModel.setProperty("/editAllowed", false);

						break;
					}
				}
			}

			// end for Userdetails usertype check
			//  set the locale from SAML Language.       
			if (!this.sCurrentLocale) {
				if (userDetails[0].Language == "English") {
					// english language. 
					this.sCurrentLocale = 'EN';
					var i18nModel = new sap.ui.model.resource.ResourceModel({
						bundleUrl: "i18n/i18n.properties",
						bundleLocale: ("en")
					});
					this.getView().setModel(i18nModel, "i18n");
				} else {
					// french language
					var i18nModel = new sap.ui.model.resource.ResourceModel({
						bundleUrl: "i18n/i18n.properties",
						bundleLocale: ("fr")
					});
					this.getView().setModel(i18nModel, "i18n");

					this.sCurrentLocale = 'FR';
				}

			}
			//  check the Division -  if the URL has division  check with material division for Dealers if it matches then allow it otherwise throw an error message, 
			//for internal usersdo not do the check
			if (userDetails[0].UserType == 'Dealer') {

				var isDivisionSent = window.location.search.match(/Division=([^&]*)/i);
				if (isDivisionSent) {
					this.sDivision = window.location.search.match(/Division=([^&]*)/i)[1];

					if (this.sDivision == aDataBP[0].Division) {

						this.getView().byId("messageStripError").setProperty("visible", false);

						if (this.sDivision == '10') // set the toyoto logo
						{
							var currentImageSource = this.getView().byId("idLexusLogo");
							currentImageSource.setProperty("src", "images/toyota_logo_colour.png");

						} else { // set the lexus logo
							var currentImageSource = this.getView().byId("idLexusLogo");
							currentImageSource.setProperty("src", "images/i_lexus_black_full.png");

						}

					} else {
						// throw an error message and disable the search button. 
						if (aDataBP[0].Division !== "Dual" ) {
						var errorMessage = this._oResourceBundle.getText("divisionsDoNotMatch"); //Divisoin does not match

						this.getView().byId("messageStripError").setProperty("visible", true);
						this.getView().byId("messageStripError").setText(errorMessage);
						this.getView().byId("messageStripError").setType("Error");
						
						
						// set the search button to greyout
						
					     oViewModel.setProperty("/enableMaterialEntered", false);
				          oViewModel.setProperty("/afterMaterialFound", false);

				    	} 
					}

				} else {

					this.sDivision = aDataBP[0].Division;
					
					if (this.sDivision == '10') // set the toyoto logo
					{
						var currentImageSource = this.getView().byId("idLexusLogo");
						currentImageSource.setProperty("src", "images/toyota_logo_colour.png");

					} else { // set the lexus logo
						var currentImageSource = this.getView().byId("idLexusLogo");
						currentImageSource.setProperty("src", "images/i_lexus_black_full.png");

					}
	

				}

			} else { // end for usertype == dealer check,
				//not a dealer but a zone user or internal user
				var isDivisionSent = window.location.search.match(/Division=([^&]*)/i);
				if (isDivisionSent) {
					this.sDivision = window.location.search.match(/Division=([^&]*)/i)[1];

					if (this.sDivision == '10') // set the toyoto logo
					{
						var currentImageSource = this.getView().byId("idLexusLogo");
						currentImageSource.setProperty("src", "images/toyota_logo_colour.png");

					} else { // set the lexus logo
						var currentImageSource = this.getView().byId("idLexusLogo");
						currentImageSource.setProperty("src", "images/i_lexus_black_full.png");

					}

				} else {
					// just set a both logo
					var currentImageSource = this.getView().byId("idLexusLogo");
					currentImageSource.setProperty("src", "images/toyotoLexus.png");

				}

			}

		},

		handleRouteMatched: function (oEvent) {

		},

		liveChangeDataEntered: function (oEvent) {

			//	var matnrEntered = this.getView().byId("material_id").getValue();
			var oViewModel = this.getView().getModel("detailView");

			var materialFromScreen = this.getView().byId("material_id").getValue();
			var selectedCustomerT = this.getView().byId("dealerID").getValue();

			if (!materialFromScreen || !selectedCustomerT) {
				//mandatory parameters not made
				oViewModel.setProperty("/enableMaterialEntered", false);
				oViewModel.setProperty("/afterMaterialFound", false);
			} else {
				oViewModel.setProperty("/enableMaterialEntered", true);
				// 	   	oViewModel.setProperty("/afterMaterialFound", true);
			}

		},

		handlePartSearch: function (oEvent) {
			this.userClickedSuperSession = false;
			// var sCurrentLocale = sap.ui.getCore().getConfiguration().getLanguage();
			// initialize the material display model also . 

			// this._materialDisplayModel = new JSONModel();
			// this.getView().setModel(this._materialDisplayModel, "materialDisplayModel");		
			// reset the data. 
			this._materialDisplayModel.setProperty("/MatnrSuper", "");
			this._materialDisplayModel.setProperty("/Dealernet", "");
			this._materialDisplayModel.setProperty("/Msrp", "");
			this._materialDisplayModel.setProperty("/Roundingprofile", "");
			this._materialDisplayModel.setProperty("/Partreturnable", "");
			this._materialDisplayModel.setProperty("/Partstocked", "");
			this._materialDisplayModel.setProperty("/Shippedvia", "");
			this._materialDisplayModel.setProperty("/Plantdesc", "");

			var sCurrentLocale = this.sCurrentLocale;

			var that = this;
			this.dealerSearchError = false;
			var materialFromScreen = this.getView().byId("material_id").getValue();
			// convert to upper case. 

			var upperCaseMaterial = materialFromScreen.toUpperCase();
			materialFromScreen = upperCaseMaterial;

			var toUpperCase = this.getView().byId("material_id").setValue(materialFromScreen);

			var selectedCustomerT = this.getView().byId("dealerID").getValue();

			var oViewModel = this.getView().getModel("detailView");

			if (!materialFromScreen || !selectedCustomerT) {
				//mandatory parameters not made
				oViewModel.setProperty("/enableMaterialEntered", false);
				oViewModel.setProperty("/afterMaterialFound", false);

			} else {
				oViewModel.setProperty("/enableMaterialEntered", true);
				//  	oViewModel.setProperty("/afterMaterialFound", true);
			}

			sap.ui.core.BusyIndicator.show();
			// I_MaterialText(Material='" + (material) + "',Language='" + (langu) + "')?$format=json

			//	https://tcipn1sap01.tci.internal.toyota.ca:51036/MD_PRODUCT_FS_SRV/I_MaterialText?Material=4&Language=EN

			$.ajax({
				url: this.nodeJsUrl + "/MD_PRODUCT_FS_SRV/I_MaterialText?Material=" + (materialFromScreen) +
					"&Language=" + (sCurrentLocale) + "",
				type: "GET",
				dataType: "json",
				// 				beforeSend: function(request) {
				// 	request.setRequestHeader("Access-Control-Allow-Origin", "*");
				// },

				success: function (oData) {
					that.dealerSearchError = false;
					that._materialDisplayModel.setProperty("/MaterialText", oData.d.MaterialName);
					// material found put the screen for display. 
					that._oViewModel.setProperty("/afterMaterialFound", true);
			
					that.getView().byId("messageStripError").setProperty("visible", false);
					//  lets make one more call to get the Division. 
					that._getTheDivision(oData.d.Material);

				},
				error: function () {
					sap.ui.core.BusyIndicator.hide();
					that.dealerSearchError = true;

					//  MessageBox.error(that._oResourceBundle.getText("materialNotFound"));
					//				MessageBox.error(that._oResourceBundle.getText("materialNotFound"));
					that._oViewModel.setProperty("/afterMaterialFound", false);

					var errorMessage = that._oResourceBundle.getText("materialNotFound"); //systemErrorOccured

					that.getView().byId("messageStripError").setProperty("visible", true);
					that.getView().byId("messageStripError").setText(errorMessage);
					that.getView().byId("messageStripError").setType("Error");

				}
			});

			if (this.dealerSearchError === true) {

				// to be used for a message strip. 

			}

		}, // end of handlepart search

		_getTheDivision: function (Material) {

			// var sUrl = "/MD_PRODUCT_FS_SRV/C_Product_Fs('" + (material) + "')?$format=json";	

			// division. 
			//get the division from the URL					
			//window.location.search.match(/Division=([^&]*)/i)[1]    === to get the Division. 

			//	this.sDivision = "20" ; // Lexus

			this._callSupplyingPlant();

			// $.ajax({                                                        
			// url: this.nodeJsUrl+"/MD_PRODUCT_FS_SRV/C_Product_Fs?Material=" + (Material) +"",
			// type: "GET",
			// dataType: "json",
			// success: function(oData) {

			// 	// division. 
			// 	this.sDivision = oData.d.Division;
			// 			this._callSupplyingPlant();

			// }.bind(this),
			// 	error: function() {

			// 	}
			// });
		},

		_callSupplyingPlant: function () {

			// var selectedCustomerT = this.getView().byId("dealerID").getValue();
			// var selectedCustomer = "24000" + selectedCustomerT;
			var selectedMaterial = this.getView().byId("material_id").getValue();
			var selectedCustomer = this.sSelectedDealer;

			//	discusssion with Sheshu on 25/09/208 at 5.48 in SAP 0 Meeting along with ray and Selwyn
			// if (this.sDivision == "00"){
			// 	this.sDivision = "10";

			// }  
			// this.sDivision

			// call to get the supplying plant. 
			// var url = "https://fioridev1.dev.toyota.ca:44300";
			// var sUrlforSupplyingPlant = "/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_Customer(Customer=" + "'" + (selectedCustomer) + "'" +
			// 	")/to_CustomerSalesArea?sap-client=200&$format=json&$filter=SalesOrganization" + " eq'" + "7000" + "'" + "and DistributionChannel" +
			// 	" eq'" + "10" + "'" + "and (Division" + " eq'" + "10" + "'" + "or Division" + " eq'" + "20" + "'" + ")&$select=SupplyingPlant";

			//  https://fioridev1.dev.toyota.ca:44300/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_Customer(Customer='2400001003')/to_CustomerSalesArea?sap-client=200&$format=json&$filter=SalesOrganization eq '7000' and DistributionChannel eq '10' and (Division eq '10' or Division eq '20')&$select=SupplyingPlant

			// get the supplying plant      ============================Begin=======================================   /MD_PRODUCT_FS_SRV/A_Customer

			var that = this;

			// $.response.headers.set("Access-Control-Allow-Origin", "*");
			// $.response.status = $.net.http.OK;

			var sUrlforSupplyingPlant = this.nodeJsUrl + "/MD_PRODUCT_FS_SRV/A_Customer?customer=" + (selectedCustomer) +
				"&division=" + (this.sDivision) + "";
 
			var that = this;
			$.ajax({
				url: sUrlforSupplyingPlant,
				type: "GET",
				dataType: "json",
				success: function (oData) {
					// SupplyingPlant
					// if supplying plant is blank add a warning message   ---oData.d.results.length
					// if (oData.d.results.length == 0) {
					//   var errorMessage = that._oResourceBundle.getText("supplyingPlantIsBlank");  // 

					// that.getView().byId("messageStripError").setProperty("visible", true);
					// that.getView().byId("messageStripError").setText(errorMessage);
					// that.getView().byId("messageStripError").setType("Warning");

					// 					that.getView().byId("messageStripError").setProperty("visible", true);

					// } else {
					that.getView().byId("messageStripError").setProperty("visible", false);
					// }
 
					// sheshu request on 25/09 @5.47Pm
					if (oData.d.results.length !== 0) {
						that._materialDisplayModel.setProperty("/SupplyingPlant", oData.d.results["0"].SupplyingPlant);
						that.supplyingPlant = oData.d.results["0"].SupplyingPlant;
						that._call_the_priceSetService(oData.d.results["0"].SupplyingPlant);
					} else {
						var supplyingPlant = "  "; // just a dummy entry Price set needs this

						that._call_the_priceSetService(supplyingPlant);

						//   	    var errorMessage = that._oResourceBundle.getText("supplyingPlantIsBlank");  

						// that.getView().byId("messageStripError").setProperty("visible", true);
						// that.getView().byId("messageStripError").setText(errorMessage);
						// that.getView().byId("messageStripError").setType("Warning");

						// that.getView().byId("messageStripError").setProperty("visible", true);	

					}

				},
				error: function () {
					sap.ui.core.BusyIndicator.hide();

					var errorMessage = that._oResourceBundle.getText("systemErrorOccured");

					that.getView().byId("messageStripError").setProperty("visible", true);
					that.getView().byId("messageStripError").setText(errorMessage);
					that.getView().byId("messageStripError").setType("Error");

				}
			});

			// get the supplying plant      ============================End =======================================     

		},

		_call_the_priceSetService: function (supplyingPlant) {

			//	var sCurrentLocale = sap.ui.getCore().getConfiguration().getLanguage();
			var sCurrentLocale = this.sCurrentLocale;
			// this.sCurrentLocale = "EN";
			// var selectedCustomerT = this.getView().byId("dealerID").getValue();
			// var selectedCustomer = "24000" + selectedCustomerT;
			var selectedCustomer = this.sSelectedDealer;
			var selectedMaterial = this.getView().byId("material_id").getValue();

			var sUrlforPricingDetails = this.nodeJsUrl + "/ZMD_PRODUCT_FS_SRV/zc_PriceSet?Customer=" + (
					selectedCustomer) + "&Matnr=" + (selectedMaterial) + "&LanguageKey=" + (sCurrentLocale) + "&Plant=" + (supplyingPlant) +
				"&division=" + (this.sDivision);

			//  this call is through the odata gateway.  - Begin
			var that = this;

			$.ajax({
				url: sUrlforPricingDetails,
				type: "GET",
				dataType: "json",

				success: function (oData) {
					 
					that._materialDisplayModel.setProperty("/Dealernet", oData.d.Item.Dealernet);
					that._materialDisplayModel.setProperty("/Msrp", oData.d.Item.Msrp);
					that._materialDisplayModel.setProperty("/Roundingprofile", oData.d.Item.Roundingprofile);
					that._materialDisplayModel.setProperty("/Partreturnable", oData.d.Item.Partreturnable);
					that._materialDisplayModel.setProperty("/Partstocked", oData.d.Item.Partstocked);
					that._materialDisplayModel.setProperty("/Shippedvia", oData.d.Item.Shippedvia);
					that._materialDisplayModel.setProperty("/Plantdesc", oData.d.Item.Plantdesc);
					// stop sales flag 
					that._materialDisplayModel.setProperty("/stopSalesFlag", oData.d.Item.Stopsalesdesc);
					that._materialDisplayModel.setProperty("/Qtybackorder", oData.d.Item.Qtybackorder);
					that._materialDisplayModel.setProperty("/Z3plqtyavail", oData.d.Item.Z3plqtyavail);

					//	that.stopSalesFlag = oData.d.Item.Stopsalesdesc;
					that._materialDisplayModel.setProperty("/invQtyReceived", oData.d.Item.Qtyavail);
					that._materialDisplayModel.setProperty("/Parttypedesc", oData.d.Item.Parttypedesc);
					that._materialDisplayModel.setProperty("/plantReceived", supplyingPlant);
					that._materialDisplayModel.setProperty("/z3plPlantReceived", oData.d.Item.Z3plplant);
					that._materialDisplayModel.setProperty("/Obsolete", oData.d.Item.Obsolete);

					/// if the stop sales Flag = Yes then populate the warning message. 

					if (oData.d.Item.Stopsalesdesc == "Yes" || oData.d.Item.Stopsalesdesc == "Oui") {

						var warningMessage = that._oResourceBundle.getText("ParthasStopSales"); //Part Number has Stop Sales Flag as Yes
						that.getView().byId("messageStripError").setProperty("visible", true);
						that.getView().byId("messageStripError").setText(warningMessage);
						that.getView().byId("messageStripError").setType("Warning");
					} else {
						that.getView().byId("messageStripError").setProperty("visible", false);

					}

					that._callTheBackward_Supersession_(supplyingPlant);

					//		that._callTheInventory_service(supplyingPlant);   -- commenting this out as we are getting the quantity from the main screen

					that._callTheQuanity_service(selectedMaterial);
				},
				error: function () {
					sap.ui.core.BusyIndicator.hide();

					var errorMessage = that._oResourceBundle.getText("systemErrorOccured");

					that.getView().byId("messageStripError").setProperty("visible", true);
					that.getView().byId("messageStripError").setText(errorMessage);
					that.getView().byId("messageStripError").setType("Error");

				}
			});

		},

		_callTheBackward_Supersession_: function (supplyingPlant) {

			// var sCurrentLocale = sap.ui.getCore().getConfiguration().getLanguage();
			// sCurrentLocale = "EN";
			var sCurrentLocale = this.sCurrentLocale;
			var selectedCustomerT = this.getView().byId("dealerID").getValue();
			var selectedMaterial = this.getView().byId("material_id").getValue();
			var selectedCustomer = this.sSelectedDealer;

			// var selectedCustomer = "24000" + selectedCustomerT;
			var selectedMaterial = this.getView().byId("material_id").getValue();

			var sUrlforBackSuperSet = this.nodeJsUrl + "/ZMD_PRODUCT_FS_SRV/zc_BackSuperSet2?Customer=" + (
					selectedCustomer) + "&Matnr=" + (selectedMaterial) + "&LanguageKey=" + (sCurrentLocale) + "&Plant=" + (supplyingPlant) +
				"&Division=" + (this.sDivision);

		
			var that = this;
			$.ajax({
				url: sUrlforBackSuperSet, //url + sUrlforForwardSuppression,
				type: "GET",
				dataType: "json",
				success: function (oData) {
				
					if (oData.d.BackPartsSuper.MatnrSuper) {

						this._materialDisplayModel.setProperty("/MatnrSuper", oData.d.BackPartsSuper.MatnrSuper);
					} else {
						if (this.userClickedSuperSession == true) {
							var sMaterial = this.getView().getModel("materialDisplayModel").getProperty("/Material");
							this._materialDisplayModel.setProperty("/MatnrSuper", sMaterial);
						} else {
							this.userClickedSuperSession = false;
						}
					}

					var superSession = [];
					this._superSessionModel.setProperty("/items", superSession); // instatiate here to avoid screen refresh issues. 
					this.getView().setModel(this._superSessionModel, "superSessionModel");
					$.each(oData.d.toForwSuper.results, function (i, item) {

						if (item.ValidFrom == null) {
							item.ValidFrom = "";

							localDate = "";
						} else {
							var tempVar = item.ValidFrom;
							var utcTime = parseInt(tempVar.substr(6));
							var localDate = new Date(utcTime); //.toUTCString();

						}

						superSession.push({
							"MatnrSuper": item.MatnrSuper,
							"PartDesc": item.PartDesc,
							"DealerNet": item.DealerNet,
							"QtyReqd": item.QtyReqd,
							"QtyAvail": item.QtyAvail,
							"HasForwSuper": item.HasForwSuper,
							"LastUpdDate": localDate

						});
					});

					if (superSession.length == 0) {
						this._oViewModel.setProperty("/nosuperSessionDisplay", false);

					} else {
						this._oViewModel.setProperty("/nosuperSessionDisplay", true);
					}

					this._superSessionModel.setProperty("/items", superSession);
					this.getView().setModel(this._superSessionModel, "superSessionModel");
					// var oModelSuperSession = this.getView().getModel("superSessionModel");
					// oModelSuperSession.refresh();
					this.getView().byId("messageStripError").setProperty("visible", false);
				}.bind(this),
				error: function () {
					sap.ui.core.BusyIndicator.hide();

					var errorMessage = this._oResourceBundle.getText("systemErrorOccured");

					this.getView().byId("messageStripError").setProperty("visible", true);
					this.getView().byId("messageStripError").setText(errorMessage);
					this.getView().byId("messageStripError").setType("Error");

				}.bind(this)
			});

		},

		_callTheQuanity_service: function (selectedMaterial) {

			//			that._materialDisplayModel.setProperty("/stopSalesFlag", oData.d.Item.Stopsalesdesc)

			/*			var url = "https://fioridev1.dev.toyota.ca:44300/sap/opu/odata/sap";
						var sUrlforQuantity = "/ZMD_PRODUCT_FS_SRV/zc_QuantitySet?$filter=Matnr eq" + "'" + (selectedMaterial) + "'" +
							"&$format=json";*/

			var sUrlforQuantitySet = this.nodeJsUrl + "/ZMD_PRODUCT_FS_SRV/zc_QuantitySet?Matnr=" + (
				selectedMaterial);

			var sStopSaleFlag = this.getView().getModel("materialDisplayModel").getProperty("/stopSalesFlag"),
				sinvQtyReceived = this.getView().getModel("materialDisplayModel").getProperty("/invQtyReceived"),
				splantReceived = this.getView().getModel("materialDisplayModel").getProperty("/plantReceived"),
				sqtyBackOrdered = this.getView().getModel("materialDisplayModel").getProperty("/Qtybackorder"),
				sZ3plqtyavail = this.getView().getModel("materialDisplayModel").getProperty("/Z3plqtyavail"),
				z3plPlant = this.getView().getModel("materialDisplayModel").getProperty("/z3plPlantReceived"),
				sPlantDesc = this.getView().getModel("materialDisplayModel").getProperty("/Plantdesc");
			if (z3plPlant) {
				// show the ide id3Plqty
				this.getView().byId("id3Plqty").setVisible(true);
				this._oViewModel.setProperty("/visibleZ3plqty", true);

				//	this.getView().byId("id3PlValue").setVisible(true);
				// this.getView().byId("id3PlqtyValue").setVisible(true);

			} else {
				this.getView().byId("id3Plqty").setVisible(false);
				this._oViewModel.setProperty("/visibleZ3plqty", false);
				//		this.getView().byId("id3PlValue").setVisible(false);
				// this.getView().byId("id3PlqtyValue").setVisible(false);
				// turn of the id 
			}
			// reset the inventory model before loading the data.  

			var materialInventory = []; // instantiate here everytime
			this._materialInventory.setProperty("/items", materialInventory);
			this.getView().setModel(this._materialInventory, "inventoryModel");

			materialInventory.push({
				"Plant": splantReceived,
				"PlantDesc": sPlantDesc,
				"MatlWrhsStkQtyInMatlBaseUnit": sinvQtyReceived,
				"Qtybackorder": sqtyBackOrdered, // commenting based on request on 10-10-2018
				"stopSalesFlag": sStopSaleFlag,
				"Z3plqtyavail": sZ3plqtyavail
			});
	 
			$.ajax({
				url: sUrlforQuantitySet, //url + sUrlforQuantity,
				type: "GET",
				dataType: "json",
				success: function (oData) {
				 	sap.ui.core.BusyIndicator.hide();   //  this is where I end the busy indicator
					$.each(oData.d.results, function (i, item) {
						if ((item.Location == "A") || (item.Location == "O")) {
							item.Location = "California";
						} else if (item.Location == "T") {
							item.Location = "Kentuncky";
						} else {
							item.Location = item.Location;
						}

						materialInventory.push({
							"PlantDesc": item.Location,
							"MatlWrhsStkQtyInMatlBaseUnit": item.QtyAvailable
								// "Qtybackorder": item.QtyBackorder
						});

					});

					this._materialInventory.setProperty("/items", materialInventory);
					this.getView().setModel(this._materialInventory, "inventoryModel");
					var oModelSuperSession = this.getView().getModel("inventoryModel");
					oModelSuperSession.refresh();
					this.getView().byId("messageStripError").setProperty("visible", false);

				}.bind(this),
				error: function () {
					sap.ui.core.BusyIndicator.hide();

					var errorMessage = this._oResourceBundle.getText("systemErrorOccured");

					this.getView().byId("messageStripError").setProperty("visible", true);
					this.getView().byId("messageStripError").setText(errorMessage);
					this.getView().byId("messageStripError").setType("Error");

				}.bind(this)

			});
		},
		handleMatnrSuperPress: function (oEvent) {

			this.userClickedSuperSession = true;
			var clickedMaterial = oEvent.oSource.mProperties.text;

			if (!clickedMaterial) {
				var clickedMaterial = oEvent.oSource.mProperties.title;
			}

			// initialize the models needed to display the records. 

			this._materialDisplayModel = new JSONModel();
			this.getView().setModel(this._materialDisplayModel, "materialDisplayModel");
			//  model for suggestion

			var oMaterialData = this.getOwnerComponent().getModel("oMaterialData");
			this.getView().setModel(oMaterialData, "oMaterialData");

			// model instantiation for Supersession
			this._superSessionModel = new sap.ui.model.json.JSONModel();
			this._materialInventory = new sap.ui.model.json.JSONModel();

			var materialFromScreen = this.getView().byId("material_id").setValue(clickedMaterial);

			// clicked the other material, lets instantiate the models to the initial state. 

			// then call the handle part search. 

			this.handlePartSearch();

		},

		onBusinessPartnerSelected: function (oEvent) {

			//  validate only to check the business partners from the screen.  do not allow anything else. 
			var oViewModel = this.getView().getModel("detailView");
			if (oEvent.getParameter("\selectedItem") == null) {
				this.getView().byId("dealerID").setValueState("Error");
				oEvent.getSource().setValue("");
				oViewModel.setProperty("/enableMaterialEntered", false);
				oViewModel.setProperty("/afterMaterialFound", false);

				return;

			} else {
				this.getView().byId("dealerID").setValueState("None");
			}

			oViewModel.setProperty("/afterMaterialFound", false);

			var materialFromScreen = this.getView().byId("material_id").getValue();
			var selectedCustomerT = this.getView().byId("dealerID").getValue();

			if (!materialFromScreen || !selectedCustomerT) {
				//mandatory parameters not made
				oViewModel.setProperty("/enableMaterialEntered", false);
				oViewModel.setProperty("/afterMaterialFound", false);
			} else {
				oViewModel.setProperty("/enableMaterialEntered", true);
				// 	   	oViewModel.setProperty("/afterMaterialFound", true);
			}

			var sSelectedDealer = oEvent.getParameter("\selectedItem").getProperty("key");
			var sSelectedDealerText = oEvent.getParameter("\selectedItem").getProperty("additionalText");

			// selwyn will provide a service pass the text field to this service  // TODO: Guna will revisit
			var sSelectedText = oEvent.getParameter("\selectedItem").getProperty("text");

			this.sSelectedDealer = sSelectedDealer;
			this._selectedDealerModel.setProperty("/Dealer_No", sSelectedDealer);
			this._selectedDealerModel.setProperty("/Dealer_Name", sSelectedDealerText);
			// turn off any error or warning messages. 	
			this.getView().byId("messageStripError").setProperty("visible", false);
// set the logo and use the division from dealer
           	
           	var oModelBP = this.getView().getModel("BpDealerModel");
			var aDataBP = oModelBP.getData();
			
				for (var i = 0; i < aDataBP.length; i++) {
					if (aDataBP[i].BusinessPartner == sSelectedText) {
// set the Division  				    
                         this.sDivision = aDataBP[i].Division;
                    
                    if (this.sDivision == '10') // set the toyoto logo
					{
						var currentImageSource = this.getView().byId("idLexusLogo");
						currentImageSource.setProperty("src", "images/toyota_logo_colour.png");

					} else { // set the lexus logo
						var currentImageSource = this.getView().byId("idLexusLogo");
						currentImageSource.setProperty("src", "images/i_lexus_black_full.png");

					}

						break;
					}
				}			

		},
		handleSuggest: function (oEvent) {

			//  everytime lets start with a fresh suggestion modeul,  this is causing the issues otherwise. 
			var Matsuggestions = [];
			this._materialSuggestionModel.setProperty("/Matsuggestions", Matsuggestions);
			this.getView().setModel(this._materialSuggestionModel, "materialSuggestionModel");

			var oViewModel = this.getView().getModel("detailView");
			oViewModel.setProperty("/enableMaterialEntered", false);
			oViewModel.setProperty("/afterMaterialFound", false);

			var oSource = oEvent.getSource();
			var sTerm = oEvent.getParameter("suggestValue");

			this._forhandleSuggestCallData(sTerm);

			var sTerm = oEvent.getParameter("suggestValue");
			var aFilters = [];

			if (sTerm) {

				aFilters.push(new Filter("Material", sap.ui.model.FilterOperator.StartsWith, sTerm));

			}

			oEvent.getSource().getBinding("suggestionItems").filter(aFilters);

		},

		_forhandleSuggestCallData: function (matnrEntered) {
			var oViewModel = this.getView().getModel("detailView");
			///sap/opu/odata/sap/MD_PRODUCT_FS_SRV/I_MaterialText?$filter=startswith(Material,'335')

			//	var url = "https://fioridev1.dev.toyota.ca:44300/sap/opu/odata/sap";
			// var sCurrentLocale = sap.ui.getCore().getConfiguration().getLanguage();
			// sCurrentLocale = "EN"; // TODO: Temporary
			var sCurrentLocale = this.sCurrentLocale;
			var that = this;
			this.dealerSearchError = false;
			var sTerm = matnrEntered;
			sap.ui.core.BusyIndicator.show();
			//            http://fioridev1.dev.toyota.ca:8000/sap/opu/odata/sap/MD_PRODUCT_FS_SRV/I_MaterialText?$filter=startswith(Material,'157')

			var sUrlforSuggestionSet = this.nodeJsUrl + "/MD_PRODUCT_FS_SRV/I_MaterialSuggest?Material=" + (
				sTerm);

			$.ajax({
				url: sUrlforSuggestionSet,
				type: "GET",
				dataType: "json",
				success: function (oData) {
					sap.ui.core.BusyIndicator.hide();

					if (oData.d.results.length <= 0) {

						that.getView().getModel("detailView").setProperty("/enableMaterialEntered", false);
						that.getView().getModel("detailView").setProperty("/afterMaterialFound", false);
						var errorMessage = that._oResourceBundle.getText("materialNotFound");
						that.getView().byId("messageStripError").setProperty("visible", true);
						that.getView().byId("messageStripError").setText(errorMessage);
						that.getView().byId("messageStripError").setType("Error");

					} else {
						that.getView().byId("messageStripError").setProperty("visible", false);
						that.getView().getModel("detailView").setProperty("/enableMaterialEntered", true);
						//	 that.getView().getModel("detailView").setProperty("/afterMaterialFound", true);

					}

					var Matsuggestions = [];
					//set the model materialSuggestionModel

					$.each(oData.d.results, function (i, item) {
						if (item.Language == sCurrentLocale) {
							Matsuggestions.push({
								"Material": item.Material,
								"MaterialName": item.MaterialName
							});
						}
					});

					this._materialSuggestionModel.setProperty("/Matsuggestions", Matsuggestions);
					this.getView().setModel(this._materialSuggestionModel, "materialSuggestionModel");

					var oModelSuggestion = this.getView().getModel("materialSuggestionModel");
					oModelSuggestion.refresh();
				}.bind(this),
				error: function () {
					sap.ui.core.BusyIndicator.hide();
					that.dealerSearchError = true;

					//  MessageBox.error(that._oResourceBundle.getText("materialNotFound"));
					MessageBox.error(that._oResourceBundle.getText("materialNotFound"));
					that._oViewModel.setProperty("/afterMaterialFound", false);

				}
			});

		}

	});
});