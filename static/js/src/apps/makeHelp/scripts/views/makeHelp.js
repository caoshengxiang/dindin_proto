/* globals define */
'use strict';

define (function (require) {
  var
      Handlebars = require('handlebars'),
      Base = require('base'),
      settings = require('settings'),
      settingsListTpl = require('text!apps/makeHelp/templates/help_list.html');

  var MakeSettingsList = Base.View.extend({

    template: Handlebars.compile(settingsListTpl),

    className: 'MakeSettingsList settings-list dd-list app-page has-nav',


    render: function (data) {
      var data = {
        items: [
          {'codename': 'help1', 'name': 'DÚVIDAS FREQUENTES', 'ico': 'dd-icon-faq-grey-01'},
          {'codename': 'help2', 'name': 'CHAT', 'ico': 'dd-icon-chat-grey-01'},
          {'codename': 'help3', 'name': 'test@qq.com', 'ico': 'dd-icon-message-grey-01'}
         
        ]
      };
      this.$el.html(this.template(data));

      return this;
    },
    showPrivacyPage: function(){
      window.location.hash = 'settings/privacy';
    }
  });

  return MakeSettingsList;

});