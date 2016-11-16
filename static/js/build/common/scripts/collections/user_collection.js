/* globals define, require */
'use strict';

define(function (require) {

  var
      Base = require('base'),
      settings = require('settings'),
      UserModel = require('common/scripts/models/user_model');

  var UserCollection = Base.Collection.extend({
    url: settings.urlRoot + '/users',
    model: UserModel
  });

  return UserCollection;
});