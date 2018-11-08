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
		
		
		//	var mConfig = this.getMetadata().getManifestEntry("/sap.app/dataSources/MD_PRODUCT_FS_SRV");
		/*	var oDataModel = new ODataModel(mConfig.uri, {
				useBatch: true,
				disableHeadRequestForToken: true,
				defaultUpdateMethod: 'PATCH',
				json: true
			});
			this.setModel(oDataModel, "vehicleDataModel");	*/
			
			
			
		}
	});
});