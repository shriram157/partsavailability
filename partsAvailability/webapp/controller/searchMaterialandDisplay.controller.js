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

			var sLocation = window.location.host;
			var sLocation_conf = sLocation.search("webide");

			if (sLocation_conf == 0) {
				this.sPrefix = "/partsAvailability_node_CLONING";
			} else {
				this.sPrefix = "";

			}

			this.nodeJsUrl = this.sPrefix + "/node";

			$.ajax({
				url: this.sPrefix + "/userDetails/attributes",
				type: "GET",
				dataType: "json",

				success: function (oData) {
					var BpDealer = [];
					var userAttributes = [];

					$.each(oData.attributes, function (i, item) {
						var BpLength = item.BusinessPartner.length;

						BpDealer.push({
							"BusinessPartnerKey": item.BusinessPartnerKey,
							"BusinessPartner": item.BusinessPartner, //.substring(5, BpLength),
							"BusinessPartnerName": item.BusinessPartnerName, //item.OrganizationBPName1 //item.BusinessPartnerFullName
							"Division": item.Division,
							"BusinessPartnerType": item.BusinessPartnerType,
							"searchTermReceivedDealerName":item.SearchTerm2
						});

					});
					that.getView().setModel(new sap.ui.model.json.JSONModel(BpDealer), "BpDealerModel");
					userAttributes.push({
						"UserType": oData.samlAttributes.UserType[0],
						"DealerCode": oData.samlAttributes.DealerCode ? oData.samlAttributes.DealerCode[0]: null,
						"Language": oData.samlAttributes.Language[0]
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

				//ets also set the division from the url here

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
				}

				for (var i = 0; i < aDataBP.length; i++) {
					if (aDataBP[i].BusinessPartner == userDetails[0].DealerCode || aDataBP[i].searchTermReceivedDealerName == userDetails[0].DealerCode ) {
						this.getView().byId("dealerID").setSelectedKey(aDataBP[i].BusinessPartnerKey);

						//selectedDealerModel>/Dealer_Name
						this.sSelectedDealer = aDataBP[i].BusinessPartnerKey;
						this._selectedDealerModel.setProperty("/Dealer_No", aDataBP[i].BusinessPartnerKey);
						this._selectedDealerModel.setProperty("/Dealer_Name", aDataBP[i].BusinessPartnerName);
						this._selectedDealerModel.setProperty("/Dealer_Type", aDataBP[i].BusinessPartnerType);

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
						if (aDataBP[0].Division !== "Dual") {
							var errorMessage = this._oResourceBundle.getText("divisionsDoNotMatch"); //Divisoin does not match

							this.getView().byId("messageStripError").setProperty("visible", true);
							this.getView().byId("messageStripError").setText(errorMessage);
							this.getView().byId("messageStripError").setType("Error");

							// set the search button to greyout

							oViewModel.setProperty("/enableMaterialEntered", false);
							oViewModel.setProperty("/afterMaterialFound", false);
							oViewModel.setProperty("/materialInputAllow", false);

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

			//  
			// check if the url has the division and material sent,  then call the forPartsOrdering and then turn off the display for material. // TODO: 

			var isPartNumberSent = window.location.search.match(/partNumber=([^&]*)/i);
			if (isPartNumberSent) {
				var materialFromUrl = window.location.search.match(/partNumber=([^&]*)/i)[1];
				var upperCaseMaterial = materialFromUrl.toUpperCase();
				materialFromUrl = upperCaseMaterial;
				this.getView().byId("material_id").setValue(materialFromUrl);
				this.handlePartSearch();

			}

		},

		handleRouteMatched: function (oEvent) {

		},

		liveChangeDataEntered: function (oEvent) {

			//	var matnrEntered = this.getView().byId("material_id").getValue();
			var oViewModel = this.getView().getModel("detailView");

			var materialFromScreen = this.getView().byId("material_id").getValue();
			var selectedCustomerT = this.getView().byId("dealerID").getValue();
			this.getView().byId("messageStripError").setProperty("visible", false);
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

			var oMaterialDisplayModel = this.getModel("materialDisplayModeloData");
			//	var oMaterialDisplayModel = [];
			var client = 200;

			// /MD_PRODUCT_FS_SRV/I_MaterialText(Material='4261A53341',Language='EN')?$select=MaterialName
			//this._oODataModel.read("/TReqHdrSet('" + AttReqno + "')/FileSet"
			//	oMaterialDisplayModel.read("/I_MaterialText(Material=" + materialFromScreen  + ",Language=" + sCurrentLocale + ")"){

			oMaterialDisplayModel.read("/I_MaterialText(Material='" + materialFromScreen + "',Language='" + sCurrentLocale + "')", {

				urlParameters: {
					// "$filter": "(Material='" + (materialFromScreen) + "',Language='" + (sCurrentLocale) + "')"

				},

				success: $.proxy(function (oData) {
					this.dealerSearchError = false;
					this._materialDisplayModel.setProperty("/MaterialText", oData.MaterialName);
					// material found put the screen for display. 
					this._oViewModel.setProperty("/afterMaterialFound", true);

					this.getView().byId("messageStripError").setProperty("visible", false);
					//  lets make one more call to get the Division. 
					this._getTheDivision(oData.Material);

				}, this),
				error: function () {
					sap.ui.core.BusyIndicator.hide();
					this.dealerSearchError = true;

					this._oViewModel.setProperty("/afterMaterialFound", false);

					var errorMessage = this._oResourceBundle.getText("materialNotFound"); //systemErrorOccured

					this.getView().byId("messageStripError").setProperty("visible", true);
					this.getView().byId("messageStripError").setText(errorMessage);
					this.getView().byId("messageStripError").setType("Error");
				}.bind(this)

			});

		}, // end of handlepart search

		_getTheDivision: function (Material) {

			// if he is a dual dealer and the url has no division it is gettin difficult for local testing.  so 
			// lets put a popup dialog. 

			if (this.sDivision == "Dual" || this.sDivision_old == "Dual") {
				sap.ui.core.BusyIndicator.hide();
				var that = this;

				this.sDivision_old = "Dual"; // TODO: will comment out before qc
				sap.m.MessageBox.confirm("Dealer Brand Selection for Dual Dealers", {
					title: "The selecte dealer is of type Dual",
					actions: ["Toyota", "Lexus"],
					icon: "",
					onClose: function (action) {
						if (action == "Toyota") {
							that.sDivision = "10";
							sap.ui.core.BusyIndicator.show();
							that._callSupplyingPlant();
						} else {

							that.sDivision = "20";
							sap.ui.core.BusyIndicator.show();
							that._callSupplyingPlant();
						}
					}
				});

			} else { // end of if for this.sDivision

				this._callSupplyingPlant();

			}

		},

		_callSupplyingPlant: function () {

			var selectedMaterial = this.getView().byId("material_id").getValue();
			var selectedCustomer = this.sSelectedDealer;

			var that = this;

			// var sUrlforSupplyingPlant = this.nodeJsUrl + "/MD_PRODUCT_FS_SRV/A_Customer?customer=" + (selectedCustomer) +
			// 	"&division=" + (this.sDivision) + "";

			// var that = this;
			var oApiBusinessPartner = this.getModel("aPiBusinessPartner");

			oApiBusinessPartner.read("/A_Customer('" + selectedCustomer + "')" + "/to_CustomerSalesArea(Customer='" + selectedCustomer +
				"',SalesOrganization='7000',DistributionChannel='10',Division='" + this.sDivision + "')", {
					urlParameters: {
						"$select": "SupplyingPlant"
					},

					success: $.proxy(function (oData) {
						this.getView().byId("messageStripError").setProperty("visible", false);

						// sheshu request on 25/09 @5.47Pm
						if (oData.length !== 0) {
							this._materialDisplayModel.setProperty("/SupplyingPlant", oData.SupplyingPlant);
							this.supplyingPlant = oData.SupplyingPlant;
							this._call_the_priceSetService(oData.SupplyingPlant);
						} else {
							var supplyingPlant = "  "; // just a dummy entry Price set needs this

							this._call_the_priceSetService(supplyingPlant);
						}

					}, this),
					error: function () {
						sap.ui.core.BusyIndicator.hide();
						this.dealerSearchError = true;

						this._oViewModel.setProperty("/afterMaterialFound", false);

						var errorMessage = that._oResourceBundle.getText("supplyingPlantNotFound"); //systemErrorOccured

						this.getView().byId("messageStripError").setProperty("visible", true);
						this.getView().byId("messageStripError").setText(errorMessage);
						this.getView().byId("messageStripError").setType("Error");
					}.bind(this)

				});

		},

		_call_the_priceSetService: function (supplyingPlant) {

			var sCurrentLocale = this.sCurrentLocale;
			var selectedCustomer = this.sSelectedDealer;
			var selectedMaterial = this.getView().byId("material_id").getValue();
			var client = 200;
			var ozMaterialDisplayModel = this.getModel("zMaterialDisplayModel");
			var priceSetUrl = "(Customer=" + "'" + (selectedCustomer) + "'," + "DisChannel" + "='" + "10" + "'," + "Division" + "='" + (this.sDivision) +
				"'," + "Matnr" + "='" + (selectedMaterial) + "'," + "SalesDocType" + "='" + "ZAF" + "'," + "SalesOrg" + "='" + "7000" + "'," +
				"AddlData" + "=" + true + "," + "LanguageKey" + "='" +
				(sCurrentLocale) + "'," + "Plant" + "='" + (supplyingPlant) + "')" + "?sap-client=" + client;

			var that = this;

			// pio indicator check . 
			// var oDealerType = this.getView().getModel("selectedDealerModel").getProperty("/Dealer_type");
			var dealerData = this.getView().getModel("selectedDealerModel").getData();
			var oDealerType = dealerData.Dealer_Type;

			//	this._selectedDealerModel.setProperty("/Dealer_type", aDataBP[i].BusinessPartnerType);

			ozMaterialDisplayModel.read("/zc_PriceSet" + priceSetUrl, {
				urlParameters: {

				},

				success: $.proxy(function (oData) {

					if (oData.Item.DoNotDisp !== "X" && !(oData.Item.PIOInd === '01' && oDealerType === 'Z001')) {
						this.doNotDisplayReceived = false;
						this.getView().byId("messageStripError").setProperty("visible", false); // if there are any old messages clear it. 
						this._materialDisplayModel.setProperty("/Msrp", oData.Item.Msrp);
						this._materialDisplayModel.setProperty("/Qtybackorder", oData.Item.Qtybackorder);
						this._materialDisplayModel.setProperty("/Z3plqtyavail", oData.Item.Z3plqtyavail);
						this._materialDisplayModel.setProperty("/invQtyReceived", oData.Item.Qtyavail);
						this._materialDisplayModel.setProperty("/Dealernet", oData.Item.Dealernet);
						this._materialDisplayModel.setProperty("/Roundingprofile", oData.Item.Roundingprofile);
					} else {
						this.doNotDisplayReceived = true;

						var warningMessage = this._oResourceBundle.getText("ParthasDoNotDisplay"); //Part Number has Do not display flag
						this.getView().byId("messageStripError").setProperty("visible", true);
						this.getView().byId("messageStripError").setText(warningMessage);
						this.getView().byId("messageStripError").setType("Warning");

						this._materialDisplayModel.setProperty("/Msrp", "");
						this._materialDisplayModel.setProperty("/Qtybackorder", "");
						this._materialDisplayModel.setProperty("/Z3plqtyavail", "");
						this._materialDisplayModel.setProperty("/invQtyReceived", "");
						this._materialDisplayModel.setProperty("/Dealernet", "");
						this._materialDisplayModel.setProperty("/Roundingprofile", "");
					}

					this._materialDisplayModel.setProperty("/Partreturnable", oData.Item.Partreturnable);
					this._materialDisplayModel.setProperty("/Partstocked", oData.Item.Partstocked);
					this._materialDisplayModel.setProperty("/Shippedvia", oData.Item.Shippedvia);
					this._materialDisplayModel.setProperty("/Plantdesc", oData.Item.Plantdesc);
					// stop sales flag 
					this._materialDisplayModel.setProperty("/stopSalesFlag", oData.Item.Stopsalesdesc);

					//	that.stopSalesFlag = oData.d.Item.Stopsalesdesc;
					//	this._materialDisplayModel.setProperty("/invQtyReceived", oData.Item.Qtyavail);
					this._materialDisplayModel.setProperty("/Parttypedesc", oData.Item.Parttypedesc);
					this._materialDisplayModel.setProperty("/plantReceived", supplyingPlant);
					this._materialDisplayModel.setProperty("/z3plPlantReceived", oData.Item.Z3plplant);
					this._materialDisplayModel.setProperty("/Obsolete", oData.Item.Obsolete);

					/// if the stop sales Flag = Yes then populate the warning message. 

					if ((oData.Item.Stopsalesdesc == "Yes" || oData.Item.Stopsalesdesc == "Oui") && !(this.doNotDisplayReceived == true)) {

						var warningMessage1 = this._oResourceBundle.getText("ParthasStopSales"); //Part Number has Stop Sales Flag as Yes
						this.getView().byId("messageStripError").setProperty("visible", true);
						this.getView().byId("messageStripError").setText(warningMessage1);
						this.getView().byId("messageStripError").setType("Warning");
					} else {
						// if (this.doNotDisplayReceived != true) {
						// 	this.getView().byId("messageStripError").setProperty("visible", false);
						// }

					}

					this._callTheBackward_Supersession_(supplyingPlant);

					//		that._callTheInventory_service(supplyingPlant);   -- commenting this out as we are getting the quantity from the main screen

					this._callTheQuanity_service(selectedMaterial);
					//      	} else {
					//      	//  get the pricing to not display 

					//      			sap.ui.core.BusyIndicator.hide();
					//      			// part number has do not display flag 

					//      	} // do not display check end. 
				}, this),

				error: function () {
					sap.ui.core.BusyIndicator.hide();

					var errorMessage = that._oResourceBundle.getText("systemErrorOccured");

					that.getView().byId("messageStripError").setProperty("visible", true);
					that.getView().byId("messageStripError").setText(errorMessage);
					that.getView().byId("messageStripError").setType("Error");

				}.bind(this)
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

			// var sUrlforBackSuperSet = this.nodeJsUrl + "/ZMD_PRODUCT_FS_SRV/zc_BackSuperSet2?Customer=" + (
			// 		selectedCustomer) + "&Matnr=" + (selectedMaterial) + "&LanguageKey=" + (sCurrentLocale) + "&Plant=" + (supplyingPlant) +
			// 	"&Division=" + (this.sDivision);

			// var sUrlForBackSuperSet = "/ZMD_PRODUCT_FS_SRV/zc_BackSuperSet(Customer=" + "'" + (selectedCustomer) +
			// 	"'," + "DisChannel" + "='" + "10" + "'," + "Division" + "='" + (division) + "'," + "Matnr" + "='" + (selectedMaterial) + "'," +
			// 	"SalesDocType" + "='" + "ZAF" + "'," + "SalesOrg" + "='" + "7000" + "'," + "LanguageKey" + "='" + (sCurrentLocale) + "'," +
			// 	"Plant" + "='" + (supplyingPlant) + "')" + "?$format=json&$expand=toForwSuper&?sap-client=" + client; 

			var oZMaterialDisplayModel = this.getModel("zMaterialDisplayModel");

			var client = 200;
			var urlForBackSuperSet = "(Customer=" + "'" + (selectedCustomer) + "'," + "DisChannel" + "='" + "10" + "'," + "Division" + "='" + (
					this.sDivision) +
				"'," + "Matnr" + "='" + (selectedMaterial) + "'," +
				"SalesDocType" + "='" + "ZAF" + "'," + "SalesOrg" + "='" + "7000" + "'," + "LanguageKey" + "='" + (sCurrentLocale) + "'," +
				"Plant" + "='" + (supplyingPlant) + "')" + "?sap-client=" + client;
			var that = this;
			oZMaterialDisplayModel.read("/zc_BackSuperSet" + urlForBackSuperSet, {
				urlParameters: {
					"$expand": "toForwSuper"
				},

				success: $.proxy(function (oData) {
					if (oData.BackPartsSuper.MatnrSuper) {

						this._materialDisplayModel.setProperty("/MatnrSuper", oData.BackPartsSuper.MatnrSuper);
					} else {
						if (this.userClickedSuperSession == true) {
							var sMaterial = this.getView().getModel("materialDisplayModel").getProperty("/Material");
							this._materialDisplayModel.setProperty("/MatnrSuper", sMaterial);
						} else {
							this.userClickedSuperSession = false;
						}
					}
					// ================ header Type - Begin ================================
					//    oData.Type = "C"; // remove this
					// switch (oData.Type) {
					// case "C":
					// 	//TYPEC
					// 	var headMessage = this._oResourceBundle.getText("TYPEMHEAD");//Multiple
					// 	break;
					// case "M":
					// 	var headMessage = this._oResourceBundle.getText("TYPEMHEAD"); // Multiple
					// 	break;
					// case "A":
					// 	var headMessage = this._oResourceBundle.getText("TYPEAHEAD");  // elective
					// 	break;
					// case "I":
					// 	var headMessage = this._oResourceBundle.getText("TYPEI");
					// 	break;
					// case "F":
					// 	var headMessage = this._oResourceBundle.getText("TYPEF");
					// 	break;
					// default:
					// }
					// if (headMessage) {
					// 	headMessage = " : " + headMessage;
					// } else {
					// 	headMessage = "";
					// }
					// // set the header description to material display model. 
					// this._materialDisplayModel.setProperty("/headerTypeDesc", headMessage);

					// ================ header Type - End ================================		

					var superSession = [];
					this._superSessionModel.setProperty("/items", superSession); // instatiate here to avoid screen refresh issues. 
					this.getView().setModel(this._superSessionModel, "superSessionModel");
					var that = this;
					this.headerMessageSet = false;
					$.each(oData.toForwSuper.results, function (i, item) {

						if (item.ValidFrom == null) {
							item.ValidFrom = "";

							// localDate = "";
						} else {
							// var tempVar = item.ValidFrom;
							// var utcTime = parseInt(tempVar.substr(6));
							// var localDate = new Date(utcTime); //.toUTCString();

						}
						// ===============================ITem
						switch (item.Type) {
						case "C":
							//TYPEC
							var itemMessage = that._oResourceBundle.getText("TYPEC");
							//for header 
							if (that.headerMessageSet == false) {
								var headMessageHeader = that._oResourceBundle.getText("TYPEMHEAD"); //Multiple
								that._materialDisplayModel.setProperty("/headerTypeDesc", headMessageHeader);
								that.headerMessageSet = true;
							}
							break;
						case "M":
							var itemMessage = that._oResourceBundle.getText("TYPEM");

							//for header 
							if (that.headerMessageSet == false) {
								var headMessageHeader = that._oResourceBundle.getText("TYPEMHEAD"); //Multiple
								that._materialDisplayModel.setProperty("/headerTypeDesc", headMessageHeader);
								that.headerMessageSet = true;
							}
							break;
						case "A":
							// var itemMessage = that._oResourceBundle.getText("TYPEA");
							var itemMessage = "";
							if (that.headerMessageSet == false) {
								var headMessageHeader = that._oResourceBundle.getText("TYPEAHEAD"); // elective
								that._materialDisplayModel.setProperty("/headerTypeDesc", headMessageHeader);
								that.headerMessageSet = true;
							}
							break;
						case "I":
							// var itemMessage = that._oResourceBundle.getText("TYPEI");
							var itemMessage = "";
							if (that.headerMessageSet == false) {
								var headMessageHeader = that._oResourceBundle.getText("TYPEI"); // elective
								that._materialDisplayModel.setProperty("/headerTypeDesc", headMessageHeader);
								that.headerMessageSet = true;
							}
							break;
						case "F":
							// var itemMessage = that._oResourceBundle.getText("TYPEF");
							var itemMessage = "";
							if (that.headerMessageSet == false) {
								var headMessageHeader = that._oResourceBundle.getText("TYPEF"); // elective
								that._materialDisplayModel.setProperty("/headerTypeDesc", headMessageHeader);
								that.headerMessageSet = true;
							}

							break;
						default:
						}

						//================================= end of Item. 
						//  if the part has do not display flag then comment out the price and quantity data. 
						if (that.doNotDisplayReceived == true) {
							item.DealerNet = "";
							item.QtyReqd = "";
							item.QtyAvail = "";
						} else {

							that.getView().byId("messageStripError").setProperty("visible", false);
						};

						superSession.push({
							"MatnrSuper": item.MatnrSuper,
							"PartDesc": item.PartDesc,
							"Type": itemMessage,
							"DealerNet": item.DealerNet,
							"QtyReqd": item.QtyReqd,
							"QtyAvail": item.QtyAvail,
							"HasForwSuper": item.HasForwSuper,
							"LastUpdDate": item.ValidFrom //localDate

						});

					}); // for each 

					if (superSession.length == 0) {
						this._oViewModel.setProperty("/nosuperSessionDisplay", false);

					} else {
						this._oViewModel.setProperty("/nosuperSessionDisplay", true);
					}

					this._superSessionModel.setProperty("/items", superSession);
					this.getView().setModel(this._superSessionModel, "superSessionModel");

				}, this),

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

			var sUrlforQuantitySet = this.nodeJsUrl + "/ZMD_PRODUCT_FS_SRV/zc_QuantitySet?Matnr=" + (selectedMaterial);

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
				"Qtybackorder": sqtyBackOrdered,
				"stopSalesFlag": sStopSaleFlag,
				"Z3plqtyavail": sZ3plqtyavail
			});

			// var sUrlforQuantity = "/ZMD_PRODUCT_FS_SRV/zc_QuantitySet?$filter=Matnr eq" + "'" + (selectedMaterial) + "'" +
			// 	"&$format=json";

			var oZMaterialDisplayModel = this.getModel("zMaterialDisplayModel");

			var client = 200;
			var that = this;
			oZMaterialDisplayModel.read("/zc_QuantitySet", {
				urlParameters: {
					"$filter": "Matnr eq" + "'" + (selectedMaterial) + "'"
				},

				success: $.proxy(function (oData) {

					sap.ui.core.BusyIndicator.hide(); //  this is where I end the busy indicator
					var that = this;
					$.each(oData.results, function (i, item) {
						if ((item.Location == "A") || (item.Location == "O")) {
							item.Location = "California";
						} else if (item.Location == "T") {
							item.Location = "Kentucky";
						} else {
							item.Location = item.Location;
						}
						if (that.doNotDisplayReceived == true) {
							item.QtyAvailable = "";
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
					if (this.doNotDisplayReceived != true) {
						//c	this.getView().byId("messageStripError").setProperty("visible", false);
					}

				}, this),
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
			}

			var sSelectedDealer = oEvent.getParameter("\selectedItem").getProperty("key");
			var sSelectedDealerText = oEvent.getParameter("\selectedItem").getProperty("additionalText");
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

					// extract the business partner type to be validated for pio indicator. 

					this._selectedDealerModel.setProperty("/Dealer_type", aDataBP[i].BusinessPartnerType);
					// set the Division  				    
					this.sDivision = aDataBP[i].Division;

					if (this.sDivision == '10') // set the toyoto logo
					{
						var currentImageSource = this.getView().byId("idLexusLogo");
						currentImageSource.setProperty("src", "images/toyota_logo_colour.png");

					} else { // set the lexus logo
						if (this.sDivision == "Dual") {
							// read the url division. default make it toyota
							var isDivisionSent = window.location.search.match(/Division=([^&]*)/i);
							if (isDivisionSent) {
								this.sDivision = window.location.search.match(/Division=([^&]*)/i)[1];
								if (this.sDivision == 10) {
									var currentImageSource = this.getView().byId("idLexusLogo");
									currentImageSource.setProperty("src", "images/toyota_logo_colour.png");
								} else {
									var currentImageSource = this.getView().byId("idLexusLogo");
									currentImageSource.setProperty("src", "images/i_lexus_black_full.png");
								}
							} else { // for default behaviour we use toyota. 
								this.sDivision = "10";
								var currentImageSource = this.getView().byId("idLexusLogo");
								currentImageSource.setProperty("src", "images/toyota_logo_colour.png");
							}
						} else { // it is lexus
							var currentImageSource = this.getView().byId("idLexusLogo");
							currentImageSource.setProperty("src", "images/i_lexus_black_full.png");

						}

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

			var oMaterialDisplayModel = this.getModel("materialDisplayModeloData");

			oMaterialDisplayModel.read("/I_MaterialText", {
				urlParameters: {

					"$filter": "startswith(Material," + "'" + (sTerm) + "')"
				},

				success: $.proxy(function (oData) {

					sap.ui.core.BusyIndicator.hide();

					if (oData.results.length <= 0) {

						this.getView().getModel("detailView").setProperty("/enableMaterialEntered", false);
						this.getView().getModel("detailView").setProperty("/afterMaterialFound", false);
						var errorMessage = this._oResourceBundle.getText("materialNotFound");
						this.getView().byId("messageStripError").setProperty("visible", true);
						this.getView().byId("messageStripError").setText(errorMessage);
						this.getView().byId("messageStripError").setType("Error");

					} else {
						this.getView().byId("messageStripError").setProperty("visible", false);
						this.getView().getModel("detailView").setProperty("/enableMaterialEntered", true);
					}

					var Matsuggestions = [];
					//set the model materialSuggestionModel

					$.each(oData.results, function (i, item) {
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
				}, this),
				error: function () {
					sap.ui.core.BusyIndicator.hide();
					this.dealerSearchError = true;

					//  MessageBox.error(that._oResourceBundle.getText("materialNotFound"));
					MessageBox.error(that._oResourceBundle.getText("materialNotFound"));
					this._oViewModel.setProperty("/afterMaterialFound", false);

				}.bind(this),
			});

		},
		getModel: function (sName) {
			return this.getOwnerComponent().getModel(sName);
		},

	});
});