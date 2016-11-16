/* globals define, require, console */

'use strict';

define(function (require) {
  var
      $ = require('jquery'),
      settings = require('settings'),
      Base = require('base');

  var UserModel = Base.Model.extend({

    url: settings.urlRoot + '/register',

    dict: {
      firstName: 'Nombre',
      lastName: 'Sobrenome',
      email: 'email@mail.com',
      password: 'sencha',
      phoneNum: 'telefone'
    },

    defaults: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phoneNum: '',
      image: ''
    },

    initialize: function (data) {
      if (!data) {
        return this;
      }

      this.attributes = this.attributes || {};
      this.attributes.firstName = data.firstName;
      this.attributes.lastName = data.lastName;
      this.attributes.password = data.password;
      this.attributes.email = data.email;
      this.attributes.phoneNum = data.phoneNum;
    },

    simpleValidate: function () {
      // TODO: this is a simple validate, just make sure they have entered
      // data
      if (this.get('firstName') &&
          this.get('lastName')  &&
          this.get('email')     &&
          this.get('password')  &&
          this.get('phoneNum')  &&
          this.get('cpf')
        ) {
        return true;
      } else {
        return false;
      }
    },

    parse: function (data) {

      data.fullName = [data.firstName, data.lastName].join(' ');

      var reg = /(null)|(user_default.jpg)/;
      var fullName = data.fullName.replace(/\s+/g,' ').split(" ");
      var nameAcronym;
      if (data.image && !reg.test(data.image)) {
        data.image = '<span class="dd-photo islarge"><img class="user-photo" src="' + settings.urlRoot + data.image + '"></span>';
      }else{
        if(fullName.length < 2){
          nameAcronym = fullName[0].substr(0,1);
        }else{
          nameAcronym = fullName[0].substr(0,1) + fullName[1].substr(0,1);
        }
        data.image = '<span class="user-photo dd-photo default-photo islarge">' + nameAcronym.toUpperCase() + '</span>';
      }

      return data;
    },

    validateData: function (data) {
      var cleanKeyData, re;

      if (!data) {
        return 'Por favor, inserir informações válidas';
      }

      for (var key in this.dict) {

        if (!data[key] || !data[key].trim()) {
          return 'Por favor, insira seu ' + this.dict[key];
        }

        cleanKeyData = data[key].trim();

        if (key === 'email') {
          re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
          if (!re.test(cleanKeyData)) {
            return 'Seu e-mail não é válido';
          }
        } else if (key === 'password') {
          re = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/;
          if (!re.test(cleanKeyData)) {
            return 'Your password is not in an allowed format. Please make sure it is at least 8 characters long, contains at least 1 number, at least 1 lowercase character, at least 1 uppercase character, and contains only 0-9, a-z, and A-Z';
          }
        } else if (key === 'phoneNum') {
          cleanKeyData = parseInt(cleanKeyData.split(/[\-\.\s]/).join(''));

          if (!cleanKeyData || isNaN(cleanKeyData)) {
            return 'Your phone number is not valid';
          }
        }

        this.attributes[key] = cleanKeyData;
      }
    },

    checkExistence: function () {
      console.log('This user does not exist already.');
    },

    checkPasswordStrength: function () {
      console.log('Password strong');
    },

    verifyPhoneNum: function () {
      console.log('Verifying phone number.');
    },

    verifyEmail: function () {
      console.log('Email verified');
    },

    confirmPhoneNum: function () {
      console.log('Phone number confirmed');
    },

    getFriendShip: function (uid) {
      var _this = this;

      $.ajax({
        type: 'POST',
        url: settings.urlRoot + '/friendship/verify',
        data: JSON.stringify({uid1: uid, uid2: localStorage.loggedInAs}),
        contentType: 'application/json',
        dataType: 'json',
        success: function (data) {
          if (data.friends) {
            _this.set({'alreadyFriends': true});
          }
        },
        error: function (req, status) {
          console.log(status);
        }
      });

      return this;
    }
  });

  return UserModel;

});