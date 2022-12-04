sap.ui.define(["sap/ui/core/format/NumberFormat"], function (NumberFormat) {
	"use strict";

	return {

		/**
		 * Rounds the currency value to 2 digits
		 *
		 * @public
		 * @param {string} sValue value to be formatted
		 * @returns {string} formatted currency value with 2 digits
		 */

		date: function (value) {
			if (value) {
				var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
					pattern: "yyyy-MM-dd"
				});
				//var oDateFormat =  sap.ui.core.format.DateFormat.getDateInstance({pattern: "MM/dd/yyyy"}); 
				var TZOffsetMs = new Date(0).getTimezoneOffset() * 60 * 1000;
				return oDateFormat.format(new Date(value.getTime() + TZOffsetMs));
				// return oDateFormat.format(new Date(value));
			} else {
				return value;
			}
		},

		quantity: function (value) {
			try {

				if (isNaN(value)) { // the charactristics can have specific format
					return (value);
				}

				// if (!isNaN(value)){
				// if (value == 0){
				// 	value = "";
				// }
				if (value) {
					//var sCurrentLocale = sap.ui.getCore().getConfiguration().getLanguage();

					if (this.sCurrentLocale == 'EN') {
						var sCurrentLocale = 'us-EN';

					} else {

						var sCurrentLocale = 'ca-FR';
					}

					var usingLocaleNumber = (new Intl.NumberFormat(sCurrentLocale, {
						maximumSignificantDigits: 8
					}).format(value));
					//	var sCurrentLocale = 'us-EN';

					return (usingLocaleNumber);
				}

				//	return (value) ? parseFloat(value).toFixed(0) : value;
				//	}
			} catch (err) {
				return "Not-A-Number";
			}
		},

		Corevalue: function (sValue) {
			if (!sValue) {
				return "";
			}

			return parseFloat(sValue).toFixed(2);
		},

		price: function (value) {

			try {

				var sCurrentLocale = sap.ui.getCore().getConfiguration().getLanguage();

				var priceInLocalFormat = (new Intl.NumberFormat(sCurrentLocale, {
					currency: 'CAD'
				}).format(value));

				return (priceInLocalFormat);

			} catch (err) {
				return "Not-A-Number";
			}

		}

	};

});