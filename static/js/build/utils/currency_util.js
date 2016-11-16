/* globals define, console */

'use strict';

define(function () {

  function CurrencyUtil () {

    this.formatNum = function (num) {
      return parseFloat(num).toFixed(2)
                            .replace(/(\d)(?=(\d{3})+\.)/g, '$1,')
                            .replace('.', '#')
                            .replace(',', '.')
                            .replace('#', ',');
    };
  }

  return new CurrencyUtil();

});