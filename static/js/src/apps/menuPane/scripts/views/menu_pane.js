/* globals define, require, console */
'use strict';
define (function (require) {
  var
      $ = require('jquery'),
      Handlebars = require('handlebars'),

      Base = require('base'),
      settings = require('settings'),

      UserModel = require('common/scripts/models/user_model'),
      currencyUtil = require('utils/currency_util'),

      AccountOverviewTpl = require('text!apps/menuPane/templates/account_overview.html'),
      menuPaneTpl = require('text!apps/menuPane/templates/menu_pane.html');

  var MenuPane = Base.View.extend({

    className: 'MenuPane menu-pane',

    template: Handlebars.compile(menuPaneTpl),

    events: {
      'click .MenuItem': 'goToPage'
    },

    render: function () {
      var _this = this;
      var menuItems = [
        {
          name: 'ManageAccounts',
          dataUrl: 'accounts',
          displayName: 'CONTAS E CARTÕES',
          additionalClass: 'icon-sm',
          image: 'static/sprite/ico/dd-icon-accounts-grey-01.png'
        },
        {
          name: 'Search',
          dataUrl: 'search/addfriend',
          displayName: 'PESQUISAR',
          additionalClass: 'icon-sm',
          image: 'static/sprite/ico/dd-icon-search-grey-01.png'
        },
        {
          name: 'EditProfile',
          dataUrl: 'user/edit/' + localStorage.loggedInAs,
          displayName: 'EDITAR PERFIL',
          additionalClass: 'icon-sm',
          image: 'static/sprite/ico/dd-icon-person-grey-01.png'
        },
        {
          name: 'TransferFromAccounts',
          dataUrl: 'withdraw',
          displayName: 'TRANSF PARA BANCO',
          // icon: 'fa fa-money',
          additionalClass: 'icon-sm',
          image: 'static/sprite/ico/dd-icon-transfertobank-grey-01.png'
        },
        // TODO: this is for social media connections
        // Adding friends through social media
        {
          name: 'AddFriends',
          dataUrl: 'search/addfriend',
          displayName: 'CONVIDAR AMIGOS',
          additionalClass: 'icon-sm',
          image: 'static/sprite/ico/dd-icon-addperson-grey-01.png'
        },
        {
          name: 'ManageGroups',
          dataUrl: 'group/all',
          displayName: 'GERENCIAR GRUPOS',
          additionalClass: 'icon-sm',
          image: 'static/sprite/ico/dd-icon-group-grey-01.png'
        },
        {
          name: 'AppSettings',
          dataUrl: 'settings',
          displayName: 'AJUSTES',
          additionalClass: 'icon-sm',
          image: 'static/sprite/ico/dd-icon-settings-grey-01.png'
        },
        {
          name: 'AppHelp',
          dataUrl: 'help',
          displayName: 'ME AJUDA',
          additionalClass: 'icon-sm',
          image: 'static/sprite/ico/dd-icon-help-grey-01.png'
        },
        {
          name: 'Sair',
          dataUrl: 'logout',
          displayName: 'SAIR',
          additionalClass: 'icon-sm',
          image: 'static/sprite/ico/dd-icon-logout-grey-01.png'
        }
      ];

      this.$el.html(this.template({menuItems: menuItems}));
      this.$el.find('.TopSection').html(Handlebars.compile(AccountOverviewTpl));

      this.userModel = new UserModel({id: localStorage.loggedInAs});
      this.userModel.fetch({
        url: settings.urlRoot + '/me/' + this.userModel.id,
        success: function (data) {
          data.set('balance', currencyUtil.formatNum(data.get('balance')));
          _this.$el.find('.TopSection').html(Handlebars.compile(AccountOverviewTpl)(data.toJSON()));
          _this.delegateEvents();
        },
        error: function (req, status) {
          alert('Error: ' + status.responseJSON.error);
          return false;
        }
      });

      return this;
    },

    goToPage: function (e) {
      var $target = $(e.currentTarget);

      window.location.hash = $target.attr('data-id');
    }
  });

  return MenuPane;
});