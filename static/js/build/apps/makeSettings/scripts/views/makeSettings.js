/* globals define */
'use strict';

define (function (require) {
  var
      Handlebars = require('handlebars'),
      Base = require('base'),
      settings = require('settings'),
      settingsListTpl = require('text!apps/makeSettings/templates/settings_list.html');

  var MakeSettingsList = Base.View.extend({

    template: Handlebars.compile(settingsListTpl),

    className: 'MakeSettingsList settings-list dd-list app-page has-nav',

    events:{
      'click .setting1': 'showPrivacyPage',
      'click .setting2': 'blockedUserPage'
    },

    render: function (data) {
      var data = {
        items: [
          {'codename': 'setting1', 'name': 'PRIVACIDADE', 'ico': 'dd-icon-privacy-grey-01'},
          {'codename': 'setting2', 'name': 'USUÁRIOS BLOQUEADOS', 'ico': 'dd-icon-block-grey-01'},
          {'codename': 'setting3', 'name': 'NOTIFICAÇÕES', 'ico': 'dd-icon-notifitications-grey-01'},
          {'codename': 'setting4', 'name': 'VALIDAÇÃO DO TELEFONE', 'ico': 'dd-icon-attention-grey-01'}
        ]
      };
      this.$el.html(this.template(data));

      return this;
    },
    showPrivacyPage: function(){
      window.location.hash = 'settings/privacy';
    },
    blockedUserPage: function(){
      window.location.hash = 'blocked/users';
    }
  });

  return MakeSettingsList;

});