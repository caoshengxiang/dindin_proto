/* globals define, require, console */
'use strict';
define (function (require) {
  var
      $ = require('jquery'),
      Handlebars = require('handlebars'),
      Base = require('base'),
      NavbarTpl = require('text!common/templates/navbar.html');

  var Navbar = Base.View.extend({

    className: 'Navbar navbar',

    template: Handlebars.compile(NavbarTpl),

    events: {
      'click .BackButton': 'showPreviousPage'
    },

    initialize: function (data) {
      if (data) {
        this.data = data;
      }
      return this;
    },

    render: function () {
      this.$el.html(this.template(this.data));
      return this;
    },

    showPreviousPage: function () {
      window.location.hash = this.data.backUrl;
    }
  });

  return Navbar;

});