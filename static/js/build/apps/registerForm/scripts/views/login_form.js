/* globals define, console, require */
'use strict';

define(function (require) {
  var
      Handlebars = require('handlebars'),
      Base = require('base'),
      UserModel = require('common/scripts/models/user_model'),
      PhoneVerifyFormTpl = require('text!apps/registerForm/templates/login_form.html');

  var LoginForm = Base.Views.FormView.extend({

    className: 'LoginPage app-page welcome-page',

    events: {
      'submit': 'submitForm',
      'click .Register': 'register'
    },

    template: Handlebars.compile(PhoneVerifyFormTpl),

    initialize: function () {
      this.extendEvents();
    },

    render: function () {
      this.$el.html(this.template());

      return this;
    },

    submitForm: function (e) {
      var _this = this;

      e.preventDefault();
      // TODO: use real ajax calls here
      this.showPageLoader();
      var userModel = new UserModel();
      userModel.set({
        email: this.$el.find('.email').val().toLowerCase().trim(),
        password: this.$el.find('.password').val(),
        login: true
      });
      userModel.save(null, {
        success: function (data) {
          window.location.hash = 'activities';
          _this.hidePageLoader();
          localStorage.loggedInAs = data.id;
        },
        error: function (req, status) {
          try {
            alert("Error: " + status.responseJSON.error);
          } catch (e) {
            console.log(e);
            alert('Your username or password is incorrect');
          }

          _this.hidePageLoader();

          return false;
        }
      });
    },

    register: function () {
      window.location.hash = 'register';
    }
  });

  return LoginForm;
});