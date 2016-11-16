/* globals define, require */
'use strict';
define(function (require) {

  var
      settings = require('settings'),
      Base = require('base'),

      TransactionModel = require('common/scripts/models/transaction_model');

  var TransactionCollection = Base.Collection.extend({
    url: settings.urlRoot + '/activities',

    model: TransactionModel
  });

  return TransactionCollection;
});