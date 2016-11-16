/* globals define, require, console, alert */
'use strict';
define( function (require) {
  var
      $ = require('jquery'),

      Handlebars = require('handlebars'),

      settings = require('settings'),
      MESSAGES = require('common/messages'),

      Base = require('base'),
      AccountsPageTpl = require('text!apps/manageAccounts/templates/manage_accounts.html');

  var ManageAccountsPage = Base.View.extend({

    className: 'AccountsPage accounts-page app-page background-light has-nav',

    events: {
      'click .AddAccount': 'addAccount',
      'click .AddCard': 'addCreditCard',
      'click .MakeDefault': 'makeDefault',
      'click .Delete': 'deleteAccount'
    },

    template: Handlebars.compile(AccountsPageTpl),

    render: function (config) {
      var _this = this, tpldata;

      tpldata = {};

      config = config || {};

      this.$el.addClass(config.otherClassNames);

      // Load template without data
      this.$el.html(this.template(config));
      this.showContentLoader({color: '#4FB169'});

      /* Load accounts only */
      $.ajax({
        url: settings.urlRoot + '/u/' + localStorage.loggedInAs + '/accounts',
        type: 'GET',
        dataType: 'json',
        success: function (data) {
          tpldata.accounts = data;
          tpldata.bankOnly = config.bankOnly;
          _this.$el.html(_this.template({data: tpldata}));
          _this.hideContentLoader();
        },
        error: function () {
          alert(MESSAGES.ALERT.accountsCannotLoad);

          return false;
        }
      });

      if (!config.bankOnly) {
        $.ajax({
          url: settings.urlRoot + '/u/' + localStorage.loggedInAs + '/creditcards',
          type: 'GET',
          dataType: 'json',
          success: function (data) {
            tpldata.cards = data;
            var iconset = {
              'visa': 'cc-visa',
              'amex': 'cc-amex',
              'master-card': 'cc-mastercard',
              'discover': 'cc-discover'
            };

            for (var i = 0, icon; i < tpldata.cards.length; i++) {
              icon = iconset[tpldata.cards[i].vendor];
              tpldata.cards[i].icon = icon ? icon : 'credit-card-alt';
            }

            _this.$el.html(_this.template({data: tpldata}));
            _this.hideContentLoader();
          },
          error: function () {
            alert(MESSAGES.ALERT.cardsCannotLoad);

            return false;
          }
        });
      }

      return this;
    },

    addAccount: function () {
      window.location.hash = 'accounts/new';
    },

    addCreditCard: function () {
      window.location.hash = 'cards/new';
    },

    makeDefault: function (e) {
      var _this, target, postUrl, accountID, cardID;

      _this = this;
      target = e.currentTarget;
      postUrl = settings.urlRoot + '/u/' + localStorage.loggedInAs + '/makedefault';

      if ($(target).find('.isDefault').length > 0) {
        console.log('[Info] Already default');
      } else {
        if ($(target).hasClass('DefaultAccount')) {
          accountID = $(target).parentsUntil('.AccountsContainer').last().attr('data-id');
          postUrl += '/accounts/' + accountID;
        } else if ($(target).hasClass('DefaultCard')) {
          cardID = $(target).parentsUntil('.CardsContainer').last().attr('data-id');
          postUrl += '/creditcards/' + cardID;
        }
      }

      this.showPageLoader();

      $.ajax({
        url: postUrl,
        type: 'POST',
        dataType: 'json',
        success: function () {
          _this.render();
          _this.hidePageLoader();
        },
        error: function () {
          _this.hidePageLoader();
          alert(MESSAGES.ALERT.unableSetDefault);
          return false;
        }
      });
    },

    deleteAccount: function (e) {
      if (confirm(MESSAGES.CONF.deleteAccount)) {
        var _this, target, postUrl, accountID, cardID;

        _this = this;
        target = e.currentTarget;
        postUrl = settings.urlRoot + '/u/' + localStorage.loggedInAs + '/delete';

        if ($(target).hasClass('DeleteAccount')) {
          accountID = $(target).parentsUntil('.AccountsContainer').last().attr('data-id');
          postUrl += '/accounts/' + accountID;
        } else if ($(target).hasClass('DeleteCard')) {
          cardID = $(target).parentsUntil('.CardsContainer').last().attr('data-id');
          postUrl += '/creditcards/' + cardID;
        }

        this.showPageLoader();

        $.ajax({
          url: postUrl,
          type: 'POST',
          dataType: 'json',
          success: function () {
            _this.render();
            _this.hidePageLoader();
          },
          error: function () {
            _this.hidePageLoader();
            alert(MESSAGES.ALERT.unableDeleteAccount);
            return false;
          }
        });
      }
    }
  });

  return ManageAccountsPage;
});