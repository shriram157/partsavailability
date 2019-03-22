sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
		"sap/ui/model/odata/v2/ODataModel",
	"partsAvailability/model/models"
], function(UIComponent, Device, ODataModel, models) {
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
		init: function() {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// set the device model
			this.setModel(models.createDeviceModel(), "device");
		
		
// ============================== md_product service==========================Begin
			var mConfig = this.getMetadata().getManifestEntry("/sap.app/dataSources/MD_PRODUCT_FS_SRV");
			//  if running on a local version,  use the destination otherwise use /node.			
			var sLocation = window.location.host;
			var sLocation_conf = sLocation.search("webide");
			if (sLocation_conf == 0) {
				mConfig.uri = "/partsAvailability_node_CLONING" + mConfig.uri;
			} else {
			}
			var oDataModel = new ODataModel(mConfig.uri, {
				useBatch: false,
				json: true
			});
			this.setModel(oDataModel, "materialDisplayModeloData");
// ============================== md_product service==========================End	
// ============================== zmd_product service==========================Begin
				var mConfig = this.getMetadata().getManifestEntry("/sap.app/dataSources/ZMD_PRODUCT_FS_V2_SRV");
			//  if running on a local version,  use the destination otherwise use /node.			
			var sLocation = window.location.host;
			var sLocation_conf = sLocation.search("webide");
			if (sLocation_conf == 0) {
				mConfig.uri = "/partsAvailability_node_CLONING" + mConfig.uri;
			} else {
			}
			var oDataModel = new ODataModel(mConfig.uri, {
				useBatch: false,
				json: true
			});
			this.setModel(oDataModel, "zMaterialDisplayModel");		
// ============================== zmd_product service==========================Begin
// ==============================api_business partner==========================Begin
				var mConfig = this.getMetadata().getManifestEntry("/sap.app/dataSources/API_BUSINESS_PARTNER");
			//  if running on a local version,  use the destination otherwise use /node.			
			var sLocation = window.location.host;
			var sLocation_conf = sLocation.search("webide");
			if (sLocation_conf == 0) {
				mConfig.uri = "/partsAvailability_node_CLONING" + mConfig.uri;
			} else {
			}
			var oDataModel = new ODataModel(mConfig.uri, {
				useBatch: false,
				json: true
			});
			this.setModel(oDataModel, "aPiBusinessPartner");	


		}
	});
});