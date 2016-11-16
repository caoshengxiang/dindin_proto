/* globals define, require, console*/

'use strict';

define(function (require) {
  require('stdrequire');

  if (!localStorage.verified) {
    var passcode = prompt("Please enter your passcode");

    if (parseInt(passcode) !== 7890) {
      alert('Sorry, your pass code is incorrect, please try again');

      window.location.reload();

      return false;
    } else {
      localStorage.verified = true;
    }
  }

  var
      router = require('router');

  return router.start();
});