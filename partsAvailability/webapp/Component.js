sap.ui.define([
	"sap/base/i18n/ResourceBundle",
	"sap/m/Dialog",
	"sap/m/Text",
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"sap/ui/model/odata/v2/ODataModel",
	"partsAvailability/model/models"
], function(ResourceBundle, Dialog, Text, UIComponent, Device, ODataModel, models) {
	"use strict";

	return UIComponent.extend("partsAvailability.Component", {

		metadata: {
			manifest: "json",
			config: {
				fullWidth: true
			}
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// set the device model
			this.setModel(models.createDeviceModel(), "device");

			// Get resource bundle
			var locale = jQuery.sap.getUriParameters().get('Language');
			var bundle = !locale ? ResourceBundle.create({
				url: './i18n/i18n.properties'
			}): ResourceBundle.create({
				url: './i18n/i18n.properties',
				locale: locale
			});

			// Attach XHR event handler to detect 401 error responses for handling as timeout
			var sessionExpDialog = new Dialog({
				title: bundle.getText('SESSION_EXP_TITLE'),
				type: 'Message',
				state: 'Warning',
				content: new Text({
					text: bundle.getText('SESSION_EXP_TEXT')
				})
			});
			var origOpen = XMLHttpRequest.prototype.open;
			XMLHttpRequest.prototype.open = function () {
				this.addEventListener('load', function (event) {
					// TODO Compare host name in URLs to ensure only app resources are checked
					if (event.target.status === 401) {
						if (!sessionExpDialog.isOpen()) {
							sessionExpDialog.open();
						}
					}
				});
				origOpen.apply(this, arguments);
			};

			// ============================== md_product service==========================Begin
			var mConfig = this.getMetadata().getManifestEntry("/sap.app/dataSources/MD_PRODUCT_FS_SRV");
			//  if running on a local version,  use the destination otherwise use /node.			
			var sLocation = window.location.host;
			var sLocation_conf = sLocation.search("webide");
			if (sLocation_conf == 0) {
				mConfig.uri = "/partsavailability-node" + mConfig.uri;
			}
			var oDataModel = new ODataModel(mConfig.uri, {
				useBatch: false,
				json: true,
				headers: {
					"X-Requested-With": "XMLHttpRequest"
				}
			});
			this.setModel(oDataModel, "materialDisplayModeloData");
			// ============================== md_product service==========================End	
			// ============================== zmd_product service==========================Begin
			var mConfig = this.getMetadata().getManifestEntry("/sap.app/dataSources/ZMD_PRODUCT_FS_V2_SRV");
			//  if running on a local version,  use the destination otherwise use /node.			
			var sLocation = window.location.host;
			var sLocation_conf = sLocation.search("webide");
			if (sLocation_conf == 0) {
				mConfig.uri = "/partsavailability-node" + mConfig.uri;
			}
			var oDataModel = new ODataModel(mConfig.uri, {
				useBatch: false,
				json: true,
				headers: {
					"X-Requested-With": "XMLHttpRequest"
				}
			});
			this.setModel(oDataModel, "zMaterialDisplayModel");
			// ============================== zmd_product service==========================Begin
			// ==============================api_business partner==========================Begin
			var mConfig = this.getMetadata().getManifestEntry("/sap.app/dataSources/API_BUSINESS_PARTNER");
			//  if running on a local version,  use the destination otherwise use /node.			
			var sLocation = window.location.host;
			var sLocation_conf = sLocation.search("webide");
			if (sLocation_conf == 0) {
				mConfig.uri = "/partsavailability-node" + mConfig.uri;
			}
			var oDataModel = new ODataModel(mConfig.uri, {
				useBatch: false,
				json: true,
				headers: {
					"X-Requested-With": "XMLHttpRequest"
				}
			});
			this.setModel(oDataModel, "aPiBusinessPartner");
			this.setModel(models.createLocalDataModel(), "LocalDataModel");

		}
	});
});