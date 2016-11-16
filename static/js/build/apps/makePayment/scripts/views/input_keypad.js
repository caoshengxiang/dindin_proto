/* globals define, require, console */
'use strict';
define(function (require) {
  var
      $ = require('jquery'),
      Handlebars = require('handlebars'),

      Base = require('base'),

      SearchPage = require('apps/makeSearch/scripts/views/make_search'),

      keyPadTpl = require('text!apps/makePayment/templates/input_keypad.html'),

      currencyUtil = require('utils/currency_util');

  var KeyPadView = Base.View.extend({

    template: Handlebars.compile(keyPadTpl),

    events: {
      'click .NumKey': 'addDigit',
      'click .DelimiterKey': 'AddDecimals',
      'click .RemoveKey': 'removeDigit'
    },

    initialize: function () {
      this.extendEvents();
    },

    render: function () {
      var _this = this,
          totalCount = 0;

      var data = {};

      if (this.props) data = this.props;

      this.$el.html(this.template(data));
      this.decimalsLeft = null;

      this.model.on('change', function () {
        _this.$el.find('#PaymentAmountDisplay').text(_this.model.formatNum(_this.model.get('amount')));
      });

      if (!this.props) {
        this.showData(false);
      }

      return this;
    },
    showData: function(onlyChangeTotalAmount){

      var totalCount = this.pplCount ? this.pplCount : this.searchPage.getSearchResults().texts.length;
      totalCount = parseInt(totalCount);
      if(onlyChangeTotalAmount === false){
        //show the people of number
        this.$el.find(".peopleNum").html(totalCount);

        //show the single amount
        var amount = this.model.get('amount');
        this.$el.find('#PaymentAmountDisplay').text(this.model.formatNum(amount));
      }
      //show the total amount
      var totalAmount = parseFloat(this.model.get('amount')) * totalCount;
      console.log(totalAmount.toFixed(2))
      this.$el.find(".totalAmount").html(currencyUtil.formatNum(totalAmount));
    },

    addDigit: function (e) {
      /**
       * Get data from this.model
       * If this.model.attributes.amount === 0.00,
       * then amount * 10 + keyValue * 0.01;
       */
      var curKeyVal = parseInt($(e.currentTarget).val()),
          amount = this.model.get('amount'),
          totalAmount = 0,
          totalCount = 0;


      if (this.decimalsLeft === 0 && parseInt(amount) !== 0) {
        // If user use up all decimal space
        return;
      } else if (!this.decimalsLeft) {
        amount = (amount * 10) + curKeyVal;
      } else {
        amount = amount + (Math.pow(0.1, (1 + 2 - this.decimalsLeft))) * curKeyVal;
        this.decimalsLeft -= 1;
      }

      this.model.set({'amount': parseFloat(amount.toFixed(2))});

      console.log('Amount now is ' + this.model.get('amount'));

      //show total money
      this.showData(true);
    },

    AddDecimals: function () {
      // It's very tricky to handle, so reset input
      // after user clicks the delimiter
      if (this.decimalsLeft === null) {
        this.decimalsLeft = 2;
        // this.$el.find('#PaymentAmountDisplay').append(',');
        console.log('Start entering decimals.');
      }
    },

    removeDigit: function () {
      var amount = this.model.get('amount');

      amount = parseFloat(amount.toString().slice(0, -1));

      amount = isNaN(amount) ? 0 : amount;

      if (parseFloat(amount.toFixed(2)) !== 0) {
        this.model.set({'amount': amount});
      } else {
        this.model.set({'amount': 0});
      }

      // Meanwhile, if decimalsLeft is currently 0, adds back 1
      if (this.decimalsLeft !== null && this.decimalsLeft < 2) {
        this.decimalsLeft += 1;
      } else if (this.decimalsLeft === 2) {
        this.decimalsLeft = null;
      }

      console.log('Amount now is ' + this.model.get('amount'));
      console.log('Decimals left: ' + this.decimalsLeft);

      //show total money
      this.showData(true);
    }
  });

  return KeyPadView;

});