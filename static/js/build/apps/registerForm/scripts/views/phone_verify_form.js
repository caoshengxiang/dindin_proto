/* globals define, console, require */
'use strict';

define(function (require) {
  var
      $ = require('jquery'),
      Handlebars = require('handlebars'),
      Base = require('base'),

      settings = require('settings'),
      MESSAGES = require('common/messages'),

      PhoneVerifyFormTpl = require('text!apps/registerForm/templates/phone_verify_form.html');

  var RegisterForm = Base.Views.FormView.extend({

    className: 'PhoneNumVerifyPage app-page welcome-page',

    events: {
      'submit': 'submitPhoneVerifyForm'
    },

    template: Handlebars.compile(PhoneVerifyFormTpl),

    initialize: function () {
      this.extendEvents();
    },

    render: function () {
      this.hidePageLoader();
      this.data.lastFourDigits = this.data.phoneNum.slice(-4);
      this.$el.html(this.template(this.data));

      return this;
    },

    submitPhoneVerifyForm: function (e) {
      e.preventDefault();
      // TODO: use real ajax calls here
      var verifyCode = this.$el.find('.VerifyCode').val();

      if (verifyCode.trim() === '') {
        alert(MESSAGES.ALERT.verifyCodeIncorrect);
        return false;
      }

      $.ajax({
        url: settings.urlRoot + '/u/' + localStorage.loggedInAs + '/phone/verify/' + verifyCode,
        type: 'GET',
        success: function () {
          window.location.hash = 'activities';
        },
        error: function () {
          alert(MESSAGES.ALERT.verifyCodeIncorrect);
          return false;
        }
      });
    }
  });

  return RegisterForm;
});