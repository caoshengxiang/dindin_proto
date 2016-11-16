/* global define */
'use strict';
define (function (require) {
  var
      $ = require('jquery'),
      Handlebars = require('handlebars'),

      Base = require('base'),
      settings = require('settings'),
      MESSAGES = require('common/messages'),

      addCardFormTpl = require('text!apps/manageAccounts/templates/add_card_form.html');


  var AddCardForm = Base.View.extend({

    className: 'AddCardPage add-card-page app-page accounts-page has-nav',

    events: {
      'click .AddCard': 'submitForm'
    },

    template: Handlebars.compile(addCardFormTpl),

    render: function () {
      this.$el.html(this.template());

      return this;
    },

    submitForm: function (e) {
      e.preventDefault();

      var _this = this;

      var data = {
        'number': this.$el.find('.AccountNum').val().trim(),
        'holder_name': this.$el.find('.HolderName').val().toUpperCase().trim(),
        'vendor': this.$el.find('#card-vendor').val(),
        'code': this.$el.find('.SecurityCode').val(),
        'exp_date': this.$el.find('.ExpDate').val()
      };

      for (var key in data) {
        if (data[key] === '' || !data[key]) {
          alert(MESSAGES.ALERT.invalid);
          return false;
        }
      }

      this.showPageLoader();

      $.ajax({
        url: settings.urlRoot + '/u/' + localStorage.loggedInAs + '/creditcards/new',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function () {
          window.location.hash = 'accounts';
          _this.hidePageLoader();
        },
        error: function (req, status) {
          alert(MESSAGES.ALERT.unableAddCard);
          _this.hidePageLoader();
        }
      });
    }
  });

  return AddCardForm;
});