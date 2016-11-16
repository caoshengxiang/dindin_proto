/* globals define, require, console */
'use strict';

define(function (require) {
  var
      UserModel = require('common/scripts/models/user_model');


  /**
   * Test cases:
   *
   */
  new UserModel();
  new UserModel({});
  new UserModel({firstName: 'Gabreiella'});
  new UserModel({firstName: 'Gabreiella', lastName: 'Santos'});
  new UserModel({lastName: 'Santos'});
  new UserModel({
    firstName: 'Gabreiella', lastName: 'Santos',
    email: 'gmail', phoneNum: 'ksjdf sdkjf', password: 'sencha'
  });
  new UserModel({
    firstName: 'Gabreiella', lastName: 'Santos',
    email: 'a@gmail.com', phoneNum: 'ksjdf sdkjf', password: 'sencha'
  });
  new UserModel({
    firstName: 'Gabreiella', lastName: 'Santos',
    email: 'a@gmail', phoneNum: 'ksjdf sdkjf', password: 'sencha'
  });
  new UserModel({
    firstName: 'Gabreiella', lastName: 'Santos',
    email: 'gmail', phoneNum: 'ksjdf sdkjf', password: 'sencha'
  });
});