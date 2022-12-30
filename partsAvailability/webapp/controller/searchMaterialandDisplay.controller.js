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
	var materialInventory = [];
	return Controller.extend("partsAvailability.controller.searchMaterialandDisplay", {
		formatter: formatter,
		onInit: function () {
			// instantiate here everytime
            // KT by Minakshi
			this.toggleFlg = false;
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
			if (sSelectedLocale == "fr") {
				var i18nModel = new sap.ui.model.resource.ResourceModel({
					bundleUrl: "i18n/i18n.properties",
					bundleLocale: ("fr")
				});
				this.getView().setModel(i18nModel, "i18n");
				this.sCurrentLocale = 'FR';
			} else {
				var i18nModel = new sap.ui.model.resource.ResourceModel({
					bundleUrl: "i18n/i18n.properties",
					bundleLocale: ("en")
				});
				this.getView().setModel(i18nModel, "i18n");
				this.sCurrentLocale = 'EN';
			}

			var oModeli18n = this.getView().getModel("i18n");
			this._oResourceBundle = oModeli18n.getResourceBundle();

			this._oViewModel = new sap.ui.model.json.JSONModel({
				busy: false,
				delay: 0,
				enableMaterialEntered: false,
				afterMaterialFound: false,
				materialFormError: false,
				ordQty: "",
				ordTp: "",
				toggleVisibility: false,
				rushVisible: true
			});

			// #DMND0002972  ordTp, toggleVisibility and ordQty added by Minakshi

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

			this._materialInventory.setProperty("/items", materialInventory);
			this.getView().setModel(this._materialInventory, "inventoryModel");

			var that = this;

			var sLocation = window.location.host;
			var sLocation_conf = sLocation.search("webide");

			if (sLocation_conf == 0) {
				this.sPrefix = "/partsavailability-node";
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
							"searchTermReceivedDealerName": item.SearchTerm2
						});

					});
					that.getView().setModel(new sap.ui.model.json.JSONModel(BpDealer), "BpDealerModel");
					userAttributes.push({
						"UserType": oData.samlAttributes.UserType[0],
						"DealerCode": oData.samlAttributes.DealerCode ? oData.samlAttributes.DealerCode[0] : null,
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

		toggleSuggestionSearch: function (oEvt) {
			var oModeli18n = this.getView().getModel("i18n");
			var _oResourceBundle = oModeli18n.getResourceBundle();

			if (oEvt.getSource().getState() == true) {
				this.toggleFlg = true;
				MessageToast.show(_oResourceBundle.getText("TOGGLE_ON_MSG"));
			} else {
				this.toggleFlg = false;
				MessageToast.show(_oResourceBundle.getText("TOGGLE_OFF_MSG"));

			}

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
					var currentImageSource = this.getView().byId("idLogo");
					currentImageSource.setProperty("src", "images/toyotaLexus.png");
				}
				oViewModel.setProperty("/editAllowed", true);
			} else {
				//he is  a dealer.
				//ets also set the division from the url here

				var isDivisionSent = window.location.search.match(/Division=([^&]*)/i);
				if (isDivisionSent) {
					this.sDivision = window.location.search.match(/Division=([^&]*)/i)[1];
					if (this.sDivision == '10') // set the toyota logo
					{
						var currentImageSource = this.getView().byId("idLogo");
						currentImageSource.setProperty("src", "images/toyota_logo_colour.png");

					} else { // set the lexus logo
						var currentImageSource = this.getView().byId("idLogo");
						currentImageSource.setProperty("src", "images/i_lexus_black_full.png");
					}
				}

				for (var i = 0; i < aDataBP.length; i++) {
					if (aDataBP[i].BusinessPartner == userDetails[0].DealerCode || aDataBP[i].searchTermReceivedDealerName == userDetails[0].DealerCode) {
						this.getView().byId("dealerID").setSelectedKey(aDataBP[i].BusinessPartnerKey);

						//selectedDealerModel>/Dealer_Name
						this.sSelectedDealer = aDataBP[i].BusinessPartnerKey;
						this._selectedDealerModel.setProperty("/Dealer_No", aDataBP[i].BusinessPartnerKey);
						this._selectedDealerModel.setProperty("/Dealer_Name", aDataBP[i].BusinessPartnerName);
						this._selectedDealerModel.setProperty("/Dealer_Type", aDataBP[i].BusinessPartnerType);
						oViewModel.setProperty("/editAllowed", false);
						this.sDivisionNew = aDataBP[i].Division;

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

						if (this.sDivision == '10') // set the toyota logo
						{
							var currentImageSource = this.getView().byId("idLogo");
							currentImageSource.setProperty("src", "images/toyota_logo_colour.png");

						} else { // set the lexus logo
							var currentImageSource = this.getView().byId("idLogo");
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

					if (this.sDivision == '10') // set the toyota logo
					{
						var currentImageSource = this.getView().byId("idLogo");
						currentImageSource.setProperty("src", "images/toyota_logo_colour.png");

					} else { // set the lexus logo
						var currentImageSource = this.getView().byId("idLogo");
						currentImageSource.setProperty("src", "images/i_lexus_black_full.png");

					}

				}

			} else { // end for usertype == dealer check,
				//not a dealer but a zone user or internal user
				var isDivisionSent = window.location.search.match(/Division=([^&]*)/i);
				if (isDivisionSent) {
					this.sDivision = window.location.search.match(/Division=([^&]*)/i)[1];

					if (this.sDivision == '10') // set the toyota logo
					{
						var currentImageSource = this.getView().byId("idLogo");
						currentImageSource.setProperty("src", "images/toyota_logo_colour.png");

					} else { // set the lexus logo
						var currentImageSource = this.getView().byId("idLogo");
						currentImageSource.setProperty("src", "images/i_lexus_black_full.png");

					}

				} else {
					// just set a both logo
					var currentImageSource = this.getView().byId("idLogo");
					currentImageSource.setProperty("src", "images/toyotaLexus.png");

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

			var materialFromScreen, obj;
			materialFromScreen = this.getView().byId("material_id").getValue();
			obj = this.getView().byId("material_id");
			if (!!materialFromScreen && materialFromScreen !== "") {

				materialFromScreen = materialFromScreen.toString().replace(/-/g, "");
				materialFromScreen = materialFromScreen.trim();
				obj.setValue(materialFromScreen);
			}
			var selectedCustomerT = this.getView().byId("dealerID").getValue();
			this.getView().byId("messageStripError").setProperty("visible", false);
			if (!materialFromScreen || !selectedCustomerT) {
				//mandatory parameters not made
				this._oViewModel.setProperty("/enableMaterialEntered", false);
				this._oViewModel.setProperty("/afterMaterialFound", false);
			} else {
				this._oViewModel.setProperty("/enableMaterialEntered", true);
				// 	   	oViewModel.setProperty("/afterMaterialFound", true);
			}
			//this._oViewModel.refresh("true");

			this.getView().setModel(this._oViewModel, "detailView");
			this.getView().getModel("detailView").refresh(true);

		},

		handlePartSearch: function (oEvent) {
			this.userClickedSuperSession = false;
			materialInventory = [];
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
			this._materialDisplayModel.setProperty("/CaReference", "");
			this._materialDisplayModel.setProperty("/Plantdesc", "");
			this._materialDisplayModel.setProperty("/MovementCode", "");

			var sCurrentLocale = this.sCurrentLocale;

			var that = this;
			this.dealerSearchError = false;
			var materialFromScreen, obj;
			materialFromScreen = this.getView().byId("material_id").getValue();
			obj = this.getView().byId("material_id");

			// convert to upper case. 
			if (!!materialFromScreen && materialFromScreen !== "") {

				materialFromScreen = materialFromScreen.toString().replace(/-/g, "");
				materialFromScreen = materialFromScreen.trim();
				obj.setValue(materialFromScreen);
			}
			var upperCaseMaterial = materialFromScreen.toUpperCase();
			materialFromScreen = upperCaseMaterial;

			var toUpperCase = obj.setValue(materialFromScreen);

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

			// /MD_PRODUCT_OP_SRV/C_Product(Material='4261A53341',Language='EN')?$select=MaterialName
			//this._oODataModel.read("/TReqHdrSet('" + AttReqno + "')/FileSet"
			//	oMaterialDisplayModel.read("/C_Product(Material=" + materialFromScreen  + ",Language=" + sCurrentLocale + ")"){

			oMaterialDisplayModel.read("/C_Product(Product='" + materialFromScreen + "')", {

				urlParameters: {
					// "$filter": "(Material='" + (materialFromScreen) + "',Language='" + (sCurrentLocale) + "')"

				},

				success: $.proxy(function (oData) {
					this.dealerSearchError = false;
					this._materialDisplayModel.setProperty("/MaterialText", oData.ProductName);
					// material found put the screen for display. 
					this._oViewModel.setProperty("/afterMaterialFound", true);

					this.getView().byId("messageStripError").setProperty("visible", false);
					//  lets make one more call to get the Division. 
					this._getTheDivision(oData.Product);

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

			// #DMND0002972  start by Minakshi

			this.getView().getModel("detailView").setProperty("/SimulateSet", []);
			this.getView().getModel("detailView").setProperty("/ordQty", "");
			this.getView().getModel("detailView").setProperty("/toggleVisibility", false);

			this.getModel("zMaterialDisplayModel").read("/zc_ordertypeSet(Dealer='" + this.sSelectedDealer + "')", {
				success: $.proxy(function (data) {
					if (data.RushOrder == "X") {
						this.getView().getModel("detailView").setProperty("/rushVisible", true);
					} else {
						this.getView().getModel("detailView").setProperty("/rushVisible", false);
					}
				}, this),
				error: function (err) {
					console.log(err)
				}

			})

			// #DMND0002972  end by Minakshi

		}, // end of handlepart search

		_getTheDivision: function (Material) {

			// if he is a dual dealer and the url has no division it is gettin difficult for local testing.  so 
			// lets put a popup dialog. 

			if (this.sDivision == "Dual" || this.sDivision_old == "Dual") {
				sap.ui.core.BusyIndicator.hide();
				var that = this;

				this.sDivision_old = "Dual"; // TODO: will comment out before qc
				sap.m.MessageBox.confirm("Dealer Brand Selection for Dual Dealers", {
					// title: "The selecte dealer is of type Dual",
					actions: ["OK"], //["Toyota", "Lexus"],
					icon: "",
					onClose: function (action) {
						// if (action == "Toyota") {
						// 	that.sDivision = "10";
						// 	sap.ui.core.BusyIndicator.show();
						// 	that._callSupplyingPlant();
						// } else {

						// 	that.sDivision = "20";
						// 	sap.ui.core.BusyIndicator.show();
						// 	that._callSupplyingPlant();
						// }
						sap.ui.core.BusyIndicator.show();
						that._callSupplyingPlant();

					}
				});

			} else { // end of if for this.sDivision

				this._callSupplyingPlant();

			}

		},

		_callSupplyingPlant: function () {
			var selectedMaterial;
			selectedMaterial = this.getView().byId("material_id").getValue();

			//	var selectedMaterial = this.getView().byId("material_id").getValue();
			var selectedCustomer = this.sSelectedDealer;

			var that = this;

			// var sUrlforSupplyingPlant = this.nodeJsUrl + "/MD_PRODUCT_OP_SRV/A_Customer?customer=" + (selectedCustomer) +
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
			var selectedMaterial;
			selectedMaterial = this.getView().byId("material_id").getValue();

			var ozMaterialDisplayModel = this.getModel("zMaterialDisplayModel");
			// var priceSetUrl = "(Customer=" + "'" + (selectedCustomer) + "'," + "DisChannel" + "='" + "10" + "'," + "Division" + "='" + (this.sDivision) +
			// 	"'," + "Matnr" + "='" + (selectedMaterial) + "'," + "SalesDocType" + "='" + "ZAF" + "'," + "SalesOrg" + "='" + "7000" + "'," +
			// 	"AddlData" + "=" + true + "," + "LanguageKey" + "='" +
			// 	(sCurrentLocale) + "'," + "Plant" + "='" + (supplyingPlant) + "')";

			var priceSetUrl = "Customer eq'" + selectedCustomer + " ' and DisChannel eq '10' and Division eq '" + this.sDivision +
				"' and Matnr eq '" + selectedMaterial +
				"' and SalesDocType eq 'ZAF' and SalesOrg eq '7000' and AddlData eq true and LanguageKey eq '" + sCurrentLocale +
				"' and Plant eq '" + supplyingPlant + "'";

			var that = this;

			// pio indicator check . 
			// var oDealerType = this.getView().getModel("selectedDealerModel").getProperty("/Dealer_type");
			var dealerData = this.getView().getModel("selectedDealerModel").getData();
			var oDealerType = dealerData.Dealer_Type;

			//	this._selectedDealerModel.setProperty("/Dealer_type", aDataBP[i].BusinessPartnerType);

			ozMaterialDisplayModel.read("/zc_PriceSet", {
				urlParameters: {
					$filter: priceSetUrl
				},

				success: $.proxy(function (oData) {
					if (oData.results[0].Item.CaReference == "") {
						this.getOwnerComponent().getModel("LocalDataModel").setProperty("/VisReffered", false);
					} else {
						this.getOwnerComponent().getModel("LocalDataModel").setProperty("/VisReffered", true);
					}

					for (var elm in oData.results) {
						// oData.results.forEach((elm) => {
						if (oData.results[elm].Item.DoNotDisp !== "X" && !(oData.results[elm].Item.PIOInd === '01' && oDealerType === 'Z001')) {
							this.doNotDisplayReceived = false;
							this.getView().byId("messageStripError").setProperty("visible", false); // if there are any old messages clear it. 
							this._materialDisplayModel.setProperty("/Msrp", oData.results[elm].Item.Msrp);
							this._materialDisplayModel.setProperty("/Qtybackorder", oData.results[elm].Item.Qtybackorder);
							this._materialDisplayModel.setProperty("/Z3plqtyavail", oData.results[elm].Item.Z3plqtyavail);
							this._materialDisplayModel.setProperty("/invQtyReceived", oData.results[elm].Item.Qtyavail);
							this._materialDisplayModel.setProperty("/Dealernet", oData.results[elm].Item.Dealernet);
							this._materialDisplayModel.setProperty("/Roundingprofile", oData.results[elm].Item.Roundingprofile);
							//26-06
							this._materialDisplayModel.setProperty("/Onpostock", oData.results[elm].Item.Onpostock);
							if (oData.results[elm].Item.Dgind === "Yes") {
								this._materialDisplayModel.setProperty("/Dangerousgoods", "Yes");
								this._materialDisplayModel.setProperty("/Dgtooltip", oData.results[elm].Item.MatGrp + " " + oData.results[elm].Item.MatGrpDesc +
									" " + oData.results[elm].Item.MatGrpDesc60);
							} else {
								this._materialDisplayModel.setProperty("/Dangerousgoods", "No");
								this._materialDisplayModel.setProperty("/Dgtooltip", "");
							}
							if (oData.results[elm].Item.Itmcatgrp === "BANS") {
								this._materialDisplayModel.setProperty("/Dtd", "Yes");
							} else {
								this._materialDisplayModel.setProperty("/Dtd", "No");
							}

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
							this._materialDisplayModel.setProperty("/Onpostock", "");
						}
						this._materialDisplayModel.setProperty("/Corevalue", oData.results[elm].Item.Corevalue); // added new field for CR1050 
						this._materialDisplayModel.setProperty("/Partreturnable", oData.results[elm].Item.Partreturnable);
						this._materialDisplayModel.setProperty("/Partstocked", oData.results[elm].Item.Partstocked);
						this._materialDisplayModel.setProperty("/Shippedvia", oData.results[elm].Item.Shippedvia);
						this._materialDisplayModel.setProperty("/CaReference", oData.results[0].Item.CaReference);
						this._materialDisplayModel.setProperty("/Plantdesc", oData.results[elm].Item.Plantdesc);
						this._materialDisplayModel.setProperty("/MovementCode", oData.results[elm].MovementCode);

						// stop sales flag 
						this._materialDisplayModel.setProperty("/stopSalesFlag", oData.results[elm].Item.Stopsalesdesc);

						//	that.stopSalesFlag = oData.d.Item.Stopsalesdesc;
						//	this._materialDisplayModel.setProperty("/invQtyReceived", oData.Item.Qtyavail);
						this._materialDisplayModel.setProperty("/Parttypedesc", oData.results[elm].Item.Parttypedesc);
						this._materialDisplayModel.setProperty("/plantReceived", supplyingPlant);
						this._materialDisplayModel.setProperty("/z3plPlantReceived", oData.results[elm].Item.Z3plplant);
						this._materialDisplayModel.setProperty("/Obsolete", oData.results[elm].Item.Obsolete);
						this._callTheBackward_Supersession_(supplyingPlant);
						this._callTheQuanity_service(selectedMaterial);

						let indx = materialInventory.findIndex((itm) => itm.PlantDesc == oData.results[elm].Item.Plantdesc);

						if (indx < 0) {
							materialInventory.push({
								"Plant": supplyingPlant,
								"PlantDesc": oData.results[elm].Item.Plantdesc,
								"MatlWrhsStkQtyInMatlBaseUnit": oData.results[elm].Item.Qtyavail,
								"Qtybackorder": oData.results[elm].Item.Qtybackorder,
								"stopSalesFlag": oData.results[elm].Item.Stopsalesdesc,
								"Z3plqtyavail": oData.results[elm].Item.Z3plqtyavail,
								"Onpostock": oData.results[elm].Item.Onpostock,
								"MovementCode": oData.results[elm].MovementCode
							});
						}

						// var sStopSaleFlag = this._materialDisplayModel.getProperty("/stopSalesFlag"),
						// 	sinvQtyReceived = this._materialDisplayModel.getProperty("/invQtyReceived"),
						// 	splantReceived = this._materialDisplayModel.getProperty("/plantReceived"),
						// 	sqtyBackOrdered = this._materialDisplayModel.getProperty("/Qtybackorder"),
						// 	sZ3plqtyavail = this._materialDisplayModel.getProperty("/Z3plqtyavail"),
						// 	z3plPlant = this._materialDisplayModel.getProperty("/z3plPlantReceived"),
						// 	sPlantDesc = this._materialDisplayModel.getProperty("/Plantdesc"),

						// 	sgetOnpostock = this._materialDisplayModel.getProperty("/Onpostock");

						/// if the stop sales Flag = Yes then populate the warning message. 

						if ((oData.results[elm].Item.Stopsalesdesc == "Yes" || oData.results[elm].Item.Stopsalesdesc == "Oui") && !(this.doNotDisplayReceived ==
								true)) {

							var warningMessage1 = this._oResourceBundle.getText("ParthasStopSales"); //Part Number has Stop Sales Flag as Yes
							this.getView().byId("messageStripError").setProperty("visible", true);
							this.getView().byId("messageStripError").setText(warningMessage1);
							this.getView().byId("messageStripError").setType("Warning");
						}

					}

					// });

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

			var sCurrentLocale = this.sCurrentLocale;
			var selectedCustomerT = this.getView().byId("dealerID").getValue();
			var selectedMaterial;
			selectedMaterial = this.getView().byId("material_id").getValue();
			var selectedCustomer = this.sSelectedDealer;

			var oZMaterialDisplayModel = this.getModel("zMaterialDisplayModel");

			var urlForBackSuperSet = "(Customer=" + "'" + (selectedCustomer) + "'," + "DisChannel" + "='" + "10" + "'," + "Division" + "='" + (
					this.sDivision) +
				"'," + "Matnr" + "='" + (selectedMaterial) + "'," +
				"SalesDocType" + "='" + "ZAF" + "'," + "SalesOrg" + "='" + "7000" + "'," + "LanguageKey" + "='" + (sCurrentLocale) + "'," +
				"Plant" + "='" + (supplyingPlant) + "')";
			var that = this;
			oZMaterialDisplayModel.read("/zc_BackSuperSet" + urlForBackSuperSet, {
				urlParameters: {
					"$expand": "toForwSuper"
				},

				success: $.proxy(function (oData) {
					sap.ui.core.BusyIndicator.hide(); //  this is where I end the busy indicator
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
								var headMessageHeader = that._oResourceBundle.getText("TYPECHEAD"); //Multiple
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
							var itemMessage = that._oResourceBundle.getText("TYPEA");
							//var itemMessage = "";
							if (that.headerMessageSet == false) {
								var headMessageHeader = that._oResourceBundle.getText("TYPEAHEAD"); // elective
								that._materialDisplayModel.setProperty("/headerTypeDesc", headMessageHeader);
								that.headerMessageSet = true;
							}
							break;
						case "E":
							var itemMessage = that._oResourceBundle.getText("TYPEE");
							//var itemMessage = "";
							if (that.headerMessageSet == false) {
								var headMessageHeader = that._oResourceBundle.getText("TYPEEHEAD"); // elective
								that._materialDisplayModel.setProperty("/headerTypeDesc", headMessageHeader);
								that.headerMessageSet = true;
							}
							break;
						case "I":
							var itemMessage = that._oResourceBundle.getText("TYPEI");
							//var itemMessage = "";
							if (that.headerMessageSet == false) {
								var headMessageHeader = that._oResourceBundle.getText("TYPEIHEAD"); // elective
								that._materialDisplayModel.setProperty("/headerTypeDesc", headMessageHeader);
								that.headerMessageSet = true;
							}
							break;
						case "F":
							var itemMessage = that._oResourceBundle.getText("TYPEF");
							//var itemMessage = "";
							if (that.headerMessageSet == false) {
								var headMessageHeader = that._oResourceBundle.getText("TYPEFHEAD"); // elective
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
							// that.getView().byId("messageStripError").setProperty("visible", false);
						}

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

			var sUrlforQuantitySet = this.nodeJsUrl + "/ZMD_PRODUCT_FS_V2_SRV/zc_QuantitySet?Matnr=" + (selectedMaterial);

			var sStopSaleFlag = this.getView().getModel("materialDisplayModel").getProperty("/stopSalesFlag"),
				sinvQtyReceived = this.getView().getModel("materialDisplayModel").getProperty("/invQtyReceived"),
				splantReceived = this.getView().getModel("materialDisplayModel").getProperty("/plantReceived"),
				sqtyBackOrdered = this.getView().getModel("materialDisplayModel").getProperty("/Qtybackorder"),
				sZ3plqtyavail = this.getView().getModel("materialDisplayModel").getProperty("/Z3plqtyavail"),
				z3plPlant = this.getView().getModel("materialDisplayModel").getProperty("/z3plPlantReceived"),
				sPlantDesc = this.getView().getModel("materialDisplayModel").getProperty("/Plantdesc"),

				sgetOnpostock = this.getView().getModel("materialDisplayModel").getProperty("/Onpostock");

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

			materialInventory.push({
				"Plant": splantReceived,
				"PlantDesc": sPlantDesc,
				"MatlWrhsStkQtyInMatlBaseUnit": sinvQtyReceived,
				"Qtybackorder": sqtyBackOrdered,
				"stopSalesFlag": sStopSaleFlag,
				"Z3plqtyavail": sZ3plqtyavail,
				"Onpostock": sgetOnpostock,
				"MovementCode": this._materialDisplayModel.getProperty("/MovementCode")
			});

			// var sUrlforQuantity = "/ZMD_PRODUCT_FS_V2_SRV/zc_QuantitySet?$filter=Matnr eq" + "'" + (selectedMaterial) + "'" +
			// 	"&$format=json";

			var oZMaterialDisplayModel = this.getModel("zMaterialDisplayModel");

			var that = this;
			oZMaterialDisplayModel.read("/zc_QuantitySet", {
				urlParameters: {
					"$filter": "Matnr eq" + "'" + (selectedMaterial) + "'"
				},

				success: $.proxy(function (oData) {

					// sap.ui.core.BusyIndicator.hide(); //  this is where I end the busy indicator
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
						let indx = materialInventory.findIndex((itm) => itm.PlantDesc == item.Location);

						if (indx < 0) {
							materialInventory.push({
								"PlantDesc": item.Location,
								"MatlWrhsStkQtyInMatlBaseUnit": item.QtyAvailable
									// "Qtybackorder": item.QtyBackorder
							});
						}
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

			this.getView().byId("material_id").setValue(clickedMaterial);

			// clicked the other material, lets instantiate the models to the initial state. 

			// then call the handle part search. 

			this.handlePartSearch();

			// #DMND0002972  start by Minakshi

			this.getView().getModel("detailView").setProperty("/SimulateSet", []);
			this.getView().getModel("detailView").setProperty("/ordQty", "");
			this.getView().getModel("detailView").setProperty("/toggleVisibility", false);
			// #DMND0002972  end by Minakshi

		},

		onBusinessPartnerSelected: function (oEvent) {

			//  validate only to check the business partners from the screen.  do not allow anything else. 
			var oViewModel = this.getView().getModel("detailView");
			var currentImageSource;
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

			//var materialFromScreen = this.getView().byId("material_id").getValue();
			var materialFromScreen, obj;
			materialFromScreen = this.getView().byId("material_id").getValue();

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

					this._selectedDealerModel.setProperty("/Dealer_Type", aDataBP[i].BusinessPartnerType);
					// set the Division  				    
					this.sDivision = aDataBP[i].Division;

					if (this.sDivision == '10') // set the toyota logo
					{
						currentImageSource = this.getView().byId("idLogo");
						currentImageSource.setProperty("src", "images/toyota_logo_colour.png");

					} else { // set the lexus logo
						if (this.sDivision == "Dual") {
							this.sDivisionNew = "Dual";
							// read the url division. default make it toyota
							var isDivisionSent = window.location.search.match(/Division=([^&]*)/i);
							if (isDivisionSent) {
								this.sDivision = window.location.search.match(/Division=([^&]*)/i)[1];
								if (this.sDivision == 10) {
									currentImageSource = this.getView().byId("idLogo");
									currentImageSource.setProperty("src", "images/toyota_logo_colour.png");
								} else {
									currentImageSource = this.getView().byId("idLogo");
									currentImageSource.setProperty("src", "images/i_lexus_black_full.png");
								}
							} else { // for default behaviour we use toyota. 
								this.sDivision = "10";
								currentImageSource = this.getView().byId("idLogo");
								currentImageSource.setProperty("src", "images/toyota_logo_colour.png");
							}
						} else { // it is lexus
							currentImageSource = this.getView().byId("idLogo");
							currentImageSource.setProperty("src", "images/i_lexus_black_full.png");

						}

					}
				}
			}

		},
		handleSuggest: function (oEvent) {

			//  everytime lets start with a fresh suggestion modeul,  this is causing the issues otherwise. 
			var Matsuggestions = [];
			this._materialSuggestionModel.setProperty("/Matsuggestions", Matsuggestions);
			this.getView().setModel(this._materialSuggestionModel, "materialSuggestionModel");

			var oSource = oEvent.getSource();
			var sTerm = oEvent.getParameter("suggestValue");
			if (!!sTerm && sTerm !== "") {

				sTerm = sTerm.toString().replace(/-/g, "");
				sTerm = sTerm.trim();

			}

			if (this.toggleFlg) {
				this._forhandleSuggestCallData(sTerm);
				var s = [];
				s.push(new Filter("Material", sap.ui.model.FilterOperator.StartsWith, sTerm));
				oEvent.getSource().getBinding("suggestionItems").filter(s);

			}

		},

		_forhandleSuggestCallData: function (matnrEntered) {
			var oViewModel = this.getView().getModel("detailView");
			///sap/opu/odata/sap/MD_PRODUCT_OP_SRV/C_Product?$filter=startswith(Material,'335')

			//	var url = "https://fioridev1.dev.toyota.ca:44300/sap/opu/odata/sap";
			// var sCurrentLocale = sap.ui.getCore().getConfiguration().getLanguage();
			// sCurrentLocale = "EN"; // TODO: Temporary
			var sCurrentLocale = this.sCurrentLocale;
			var that = this;
			this.dealerSearchError = false;
			var sTerm = matnrEntered;
			sap.ui.core.BusyIndicator.show();

			var oMaterialDisplayModel = this.getModel("materialDisplayModeloData");

			oMaterialDisplayModel.read("/C_Product", {
				urlParameters: {

					"$filter": "startswith(Product," + "'" + (sTerm) + "')"
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
								"Material": item.Product,
								"MaterialName": item.ProductName
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

				}.bind(this)
			});

		},
		getModel: function (sName) {
			return this.getOwnerComponent().getModel(sName);
		},
		onLogOutBtnPress: function (event) {
			window.location.replace('/custom/do/logout');
		},
		// #DMND0002972  start by Minakshi
		onChangeSimulateVal: function (oEvent) {
			this.getView().getModel("detailView").setProperty("/ordQty", oEvent.getSource().getValue());
			if (oEvent.getSource().getValue() != "") {
				this.getView().getModel("detailView").setProperty("/toggleVisibility", true);
			} else {
				this.getView().getModel("detailView").setProperty("/toggleVisibility", false);
			}
		},
		onPressSimulate: function (oEvent) {
				var selectedMaterial = this.getView().byId("material_id").getValue();
				var OrdType = this.getView().byId("idOrdType").getSelectedKey();
				var qty = parseInt(this.getView().getModel("detailView").getProperty("/ordQty"));
				var ozMaterialDisplayModel = this.getModel("zMaterialDisplayModel");
				var oModeli18n = this.getView().getModel("i18n");
				var _oResourceBundle = oModeli18n.getResourceBundle();

				ozMaterialDisplayModel.read("/ZC_SIMULATESet", {
					urlParameters: {
						"$filter": "Matnr eq '" + selectedMaterial + "'and PartnNum eq'" + this.sSelectedDealer + "'and Division eq '" + this.sDivision +
							"'and SalesDocType eq '" + OrdType + "'and Plant eq '" + this._materialDisplayModel.getProperty("/SupplyingPlant") +
							"'and Qty eq " + qty + ""
					},
					success: $.proxy(function (data) {
						if (data.results.length > 0) {
							if (data.results.findIndex(item => item.Flag == "N" && item.MEng != "") > -1) {
								MessageToast.show(data.results.filter(item => item.Flag == "N")[0].MEng, {
									my: "center center",
									at: "center center"
								});
								this.getView().getModel("detailView").setProperty("/SimulateSet", []);
							} else if (data.results.findIndex(item => item.Flag == "N" && item.MEng == "" && item.Qty == "0") > -1) {
								MessageToast.show("Simulation not available for selected part.", {
									my: "center center",
									at: "center center"
								});
								this.getView().getModel("detailView").setProperty("/SimulateSet", []);
							} else {

								this.getView().getModel("detailView").setProperty("/SimulateSet", data.results);
							}
							var filternoValue = data.results.filter(item => item.Qty == "0" && item.RqDate == "" && item.MEng == "" && item.MFrn == "");
							if (
								(this.getView().getModel("materialDisplayModel").getProperty("/Dealernet") == "0.00" || "") &&
								filternoValue.length > 0
							) {
								this.getView().getModel("detailView").setProperty("/SimulateSet", []);
								MessageToast.show(_oResourceBundle.getText("PricingErrorSimulation"), {
									my: "center center",
									at: "center center"
								});
							}

						}

					}, this),
					error: function () {}
				});

			}
			// #DMND0002972  end by Minakshi
	});
});