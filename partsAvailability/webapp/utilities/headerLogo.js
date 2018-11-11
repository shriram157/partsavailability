sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/Label",
    "sap/m/Button",
    "sap/m/Bar",
    "sap/m/Image",
    "sap/m/Link",
    "sap/m/MessageStrip",
    "sap/m/VBox",
    "sap/ui/core/MessageType",
    "sap/ui/core/ValueState",
    "sap/ui/core/routing/History"

], function (Control, Label, Button, Bar, Image, Link, MessageStrip, VBox, MessageType, ValueState, History) {
    "use strict";
     return Control.extend("partsAvailability.utilities.headerLogo", {
          metadata : {
            properties : {
                pageTitle: 	{type : "string", defaultValue : ""},
                userName: 	{type : "string", defaultValue : ""},
                showNavigation: {type : "boolean", defaultValue : true},
                pageTitleBottomBar: {type : "string", defaultValue : ""}
            },
            aggregations : {
                _headerBar: {type : "sap.m.Bar", multiple: false, visibility : "hidden"},
                _subHeaderBar: {type : "sap.m.Bar", multiple: false, visibility : "hidden"},
                _langBox: {type : "sap.m.VBox", multiple: false, alignItems: "End"},
                _messages: {type : "sap.m.VBox", multiple: false, alignItems: "End"}
            },
            associations : {
                _pageTitle : { type: 'sap.m.Label', multiple: false },
                _backButton : { type: 'sap.m.Button', multiple: false },
                _homeButton : { type: 'sap.m.Button', multiple: false },
                _welcomeLabel : { type: 'sap.m.Label', multiple: false },
                _welcomeUserNameLabel : { type: 'sap.m.Link', multiple: false },
                _pageTitleBottomBar : { type: 'sap.m.Label', multiple: false }
            }
        },

        
      // init : function () {
      // 	            var tciLogo = new Image({
      //           src: "partsAvailability/images/toyotaLogo.jpg",
      //           alt: "TCI Logo",
      //           decorative: true
      //       });
      	
      // 	var pageTitle = new Label({design: "Bold"});
      //       this.setAssociation("_pageTitle", pageTitle);

      	
      	
      // 	            this.setAggregation("_headerBar", new Bar({
      //           contentLeft: tciLogo,
      //           contentMiddle: pageTitle
               
      //       }));
      	
      	
      	
      // }
    
        init : function () {
            var tciLogo = new Image({
                src: "partsAvailability/images/toyotaLogo.jpg",
                alt: "TCI Logo",
                decorative: true
            });
 
          
            var pageTitle = new Label({design: "Bold"});
            this.setAssociation("_pageTitle", pageTitle);

            this.setAggregation("_headerBar", new Bar({
                contentLeft: tciLogo,
                contentMiddle: pageTitle
                
            }));

            var backButton = new Button({
                icon: "sap-icon://nav-back",
                press: function(oEvent){
                    this.onNavBack(oEvent);
                }.bind(this),
                ariaLabelledBy: "actionButtonLabel"
            });
            this.setAssociation("_backButton", backButton);
            var homeButton = new Button({
                icon: "sap-icon://home",
                press: function(oEvent){
                    this.onHomePress(oEvent);
                }.bind(this),
                ariaLabelledBy: "actionButtonLabel"
            });
            this.setAssociation("_homeButton", homeButton);
            var welcomeLabel = new Label({text: "{i18n>consolidatedAppsHeader.welcome}"});
            this.setAssociation("_welcomeLabel", welcomeLabel);

            var welcomeUserNameLink = new Link({
                text: "",
                press: function(oEvent){
                    this.onUserNameClick(oEvent);
                }.bind(this)
            });
            this.setAssociation("_welcomeUserNameLabel", welcomeUserNameLink);

            var pageTitleBottomBar = new Label({design: "Bold"});
            this.setAssociation("_pageTitleBottomBar", pageTitleBottomBar);

            var subHeaderBar = new Bar({
                contentLeft: [backButton,homeButton],
                contentMiddle: pageTitleBottomBar,
                contentRight: [welcomeLabel, welcomeUserNameLink]
            });
            this.setAggregation("_subHeaderBar", subHeaderBar);
            subHeaderBar.setVisible(false);

//            var langLink = new Link({
//                text: "{i18n>vendorHeader.switchLang}",
//                press: function(oEvent){
//                    this.onLanguageChange();
//                }.bind(this)
//            });
//            var _langBox = new VBox({
//                items: [langLink]
//            });
//            this.setAggregation("_langBox", _langBox);

            var _messages = new VBox({});
            this.setAggregation("_messages", _messages);
        },
    


   addMessage: function (message, messageType, messageControl) {
            var messageStrip = new MessageStrip({
                text: message,
                type: messageType,
                showIcon: true,
                showCloseButton: false
            });
            messageStrip.messageControl = messageControl;

            if (!(messageControl === undefined)) {
                if (typeof messageControl.setValueState === "function") {
                    if (messageType === MessageType.Error)
                    {
                        messageControl.setValueState(ValueState.Error);
                    }
                    else if (messageType === MessageType.Success)
                    {
                        messageControl.setValueState(ValueState.Success);
                    }
                    else if (messageType === MessageType.Warning)
                    {
                        messageControl.setValueState(ValueState.Warning);
                    }
                    else
                    {
                        messageControl.setValueState(ValueState.None);
                    }
                }
                if (typeof messageControl.setShowValueStateMessage === "function") {
                    messageControl.setShowValueStateMessage(false);
                }
            }

            var vbox = this.getAggregation("_messages");
            vbox.addItem(messageStrip);
        },

   hasMessages: function () {
            var vbox = this.getAggregation("_messages");
            return vbox.getItems().length > 0;
        },

        clearMessages: function () {
            var vbox = this.getAggregation("_messages");
            var items = vbox.removeAllItems();
            var itemsLength = items.length;

            for (var i = 0; i < itemsLength; i++) {
                var messageControl = items[i].messageControl;
                if ((messageControl) && (typeof messageControl.setValueState === "function"))
                   {
                    messageControl.setValueState(ValueState.None);
                   }
                items[i].messageControl = null;
            }
        },

        addError: function (message, messageControl) {
            this.addMessage(message, MessageType.Error, messageControl);
        },

        addSuccess: function (message, messageControl) {
            this.addMessage(message, MessageType.Success, messageControl);
        },

        setPageTitle: function (pageTitle) {
            this.setProperty("pageTitle", pageTitle, true);
            var label = sap.ui.getCore().byId(this.getAssociation("_pageTitle"));
            label.setText(pageTitle);

        },

        setUserName: function (userName) {
            this.setProperty("userName", userName, true);
            var label = sap.ui.getCore().byId(this.getAssociation("_welcomeUserNameLabel"));
            label.setText(userName);
            this.getAggregation("_subHeaderBar").setVisible(true);
        },

        setShowNavigation: function (showNavigation) {
            this.setProperty("showNavigation", showNavigation, true);
            if (!showNavigation)
            {
                this.getAggregation("_subHeaderBar").removeAllContentLeft();
            }
        },

        setPageTitleBottomBar: function (pageTitleBottomBar) {
            this.setProperty("pageTitleBottomBar", pageTitleBottomBar, true);
            var label = sap.ui.getCore().byId(this.getAssociation("_pageTitleBottomBar"));
            label.setText(pageTitleBottomBar);
        },

        renderer : function (oRM, oControl) {
            oRM.renderControl(oControl.getAggregation("_headerBar"));
            oRM.renderControl(oControl.getAggregation("_subHeaderBar"));
            oRM.renderControl(oControl.getAggregation("_langBox"));
            oRM.renderControl(oControl.getAggregation("_messages"));
        },

        onNavBack: function (oEvent) {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this.onHomePress(oEvent);
            }
        },

        onHomePress: function (oEvent) {
            var b = oEvent.getSource();
            while (b && b.getParent) {
                b = b.getParent();
                if (b instanceof sap.ui.core.mvc.View){
                    var controller = b.getController();
                    var oRouter = sap.ui.core.UIComponent.getRouterFor(controller);
                    oRouter.navTo("landingPage", {}, true);
                    break;
                }
            }
        },

        onLanguageChange: function () {
            var language = sap.ui.getCore().getConfiguration().getLanguage();
            if(language && language.startsWith("en"))
            {
                language = "fr";
            }
            else
            {
                language = "en";
            }
            sap.ui.getCore().getConfiguration().setLanguage(language);
        },

        onUserNameClick: function (oEvent) {
            // create popover
            if (! this._oPopover) {
                this._oPopover = sap.ui.xmlfragment("partsAvailability.UserPopover", this);
                this.addDependent(this._oPopover);
            }

            // delay because addDependent will do a async rerendering and the actionSheet will immediately close without it.
            var oButton = oEvent.getSource();
            jQuery.sap.delayedCall(0, this, function () {
                this._oPopover.openBy(oButton);
            });
        },
/*        onResetPassword: function (oEvent) {
            window.location.hash = '#/resetPassword';
            var sUrl =window.location.href;
            window.location = sUrl;
        },*/

        onSignOut: function (oEvent) {
           window.location = "/TBD";// TODO:   To be decided on what to do here

            // document.location=;
        }

 
     });
});
    
 