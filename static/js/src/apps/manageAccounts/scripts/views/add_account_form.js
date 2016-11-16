/* globals define, require, alert */
'use strict';
define (function (require) {
  var
      $ = require('jquery'),
      settings = require('settings'),
      MESSAGES = require('common/messages'),

      Handlebars = require('handlebars'),
      transition = require('transition'),
      dropdown = require('dropdown'),

      Base = require('base'),
      AddAccountFormTpl = require('text!apps/manageAccounts/templates/add_account_form.html');

  var AddAccountForm = Base.View.extend({

    className: 'AddAccountPage add-account-page app-page accounts-page has-nav',

    events: {
      'click .AddAccount': 'submitForm'
    },

    template: Handlebars.compile(AddAccountFormTpl),

    render: function () {
      var _this = this;

      this.$el.html(this.template());

      $.ajax({
        url: settings.urlRoot + '/banks',
        type: 'GET',
        dataType: 'json',
        success: function (data) {
          _this.$el.html(_this.template({banks: data}));

          _this.$el.find('.dropdown').dropdown({});
        },
        error: function (req, status) {
          try {
            alert("Error: " + status.responseJSON.error);
          } catch (e) {
            alert(e);
          }
        }
      });

      return this;
    },

    submitForm: function (e) {
      e.preventDefault();
      var data = {
        'bankID': this.$el.find('.dropdown').dropdown('get value')[0],
        'account': this.$el.find('.AccountNum').val().trim(),
        'password': this.$el.find('.AccountPW').val()
      };

      $.ajax({
        url: settings.urlRoot + '/u/' + localStorage.loggedInAs + '/accounts/new',
        type: 'POST',
        contentType: "application/json",
        data: JSON.stringify(data),
        success: function (data) {
          window.location.hash = 'accounts';
        },
        error: function (req, status) {
          alert(MESSAGES.ALERT.unableAddAccount);

          return false;
        }
      });

    }
  });

  return AddAccountForm;
});