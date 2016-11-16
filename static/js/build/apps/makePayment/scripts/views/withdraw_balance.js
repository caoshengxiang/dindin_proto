/* globals define */
'use strict';
define (function (require) {
  var
      $ = require('jquery'),
      Handlebars = require('handlebars'),

      Base = require('base'),
      settings = require('settings'),

      messages = require('common/messages'),

      AccountsContainer = require('apps/manageAccounts/scripts/views/manage_accounts'),
      KeyPadView = require('apps/makePayment/scripts/views/input_keypad'),
      TransactionModel = require('common/scripts/models/transaction_model'),

      withdrawBalancePageTpl = require('text!apps/makePayment/templates/withdraw_balance_page.html');

  var WithdrawBalancePage = Base.View.extend({

    template: Handlebars.compile(withdrawBalancePageTpl),

    className: 'WithdrawBalancePage withdraw-balance-page app-page has-nav background-light',

    events: {
      'click .BankAccount': 'selectAccount',
      'click .TransferMoney': 'withdrawBalance'
    },

    render: function () {
      this.$el.html(this.template());

      this.loadAccounts();
      this.loadKeyPad();

      return this;
    },

    loadAccounts: function () {
      // Add config here to hide some components
      this.accountsContainer = new AccountsContainer();
      this.$el.find('.AccountsManager').html(this.accountsContainer.render({otherClassNames: 'inverse banks-only', bankOnly: true}).el);
      this.$el.find('.AccountsManager .AccountsContainer').addClass('inverse');
      // Debug
      this.$el.find('.app-page').removeClass('app-page');

      return this;
    },

    loadKeyPad: function () {
      this.transaction = new TransactionModel();
      this.inputKeyPad = new KeyPadView({model: this.transaction});
      this.inputKeyPad.props = {};
      this.inputKeyPad.props.isWithdraw = true;

      this.$el.find('.InputKeyPad').html(this.inputKeyPad.render().el);
      this.$el.find('.InputKeyPad .input-keypad').addClass('inverse');

      return this;
    },

    selectAccount: function (e) {
      var target = e.currentTarget;
      this.$el.find('.BankAccount').removeClass('selected');
      $(target).addClass('selected');
      this.selectedAccountID = $(target).attr('data-id');
    },

    withdrawBalance: function () {

      if (!this.selectedAccountID) {
        alert(messages.ALERT.mustSelectAccount);
        return false;
      } else if (parseInt(this.transaction.get('amount')) === 0) {
        alert(messages.ALERT.mustAboveZero);
        return false;
      }

      this.transaction.set({
        'toBankID': this.selectedAccountID
      });

      if (!confirm(messages.CONF.makeWithdraw.replace('{{amount}}', this.transaction.get('amount')))) {
        return false;
      }

      this.transaction.save(null, {
        url: settings.urlRoot + '/u/' + localStorage.loggedInAs + '/balance/withdraw',
        success: function (data) {
          alert(messages.ALERT.withdrawSuccess);
          window.location.hash = 'activities';
          localStorage.requestsCount = isNaN(parseInt(localStorage.requestsCount)) ? 0 : parseInt(localStorage.requestsCount) + 1;
        },
        error: function (req, status) {
          try {
            alert("Error: " + status.responseJSON.error);
          } catch (e) {
            alert(e);
          }

          return false;
        }
      });
    }
  });

  return WithdrawBalancePage;

});