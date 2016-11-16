/* globals define, require, console */

'use strict';

define(function (require) {
  var
      $ = require('jquery'),
      _ = require('underscore'),
      Backbone = require('backbone'),
      Handlebars = require('handlebars'),
      contentLoaderTpl = require('text!common/templates/content_loader.html');

  var BaseView = Backbone.View.extend({

    events: {
      'touchstart .button': 'buttonPress',
      'touchend .button': 'buttonRelease'
    },

    extendEvents: function () {
      if (this.events)
        this.events = _.defaults(this.events, BaseView.prototype.events);

      this.delegateEvents(this.events);
    },

    close: function () {
      this.unbind();
      this.remove();
    },

    setData: function (data) {
      this.data = data;
      return this;
    },

    slideLeft: function () {
      this.$el.animate({left: '-100%'});
      return this;
    },

    slideRight: function () {
      this.$el.animate({right: '-100%'});
      return this;
    },

    buttonPress: function (e) {
      var target = e.target;

      $(target).css('opacity', '0.7');
    },

    buttonRelease: function (e) {
      var target = e.target;

      $(target).css('opacity', '1');
    },

    showPageLoader: function () {
      $('#loader').css('display', 'flex');
    },

    hidePageLoader: function () {
      $('#loader').css('display', 'none');
    },

    showContentLoader: function (options) {
      var $contentLoader = this.$el.find('.ContentLoader');

      if ($contentLoader.length < 1) {
        this.$el.append(contentLoaderTpl);
        this.$el.find('.ContentLoader').css('display', 'flex');
        if (options && 'color' in options) {
          this.$el.find('.ContentLoader').css('color', options.color);
        }
      }
    },

    hideContentLoader: function () {
      var $contentLoader = this.$el.find('.ContentLoader');

      if ($contentLoader.length < 1) {
        return;
      }

      this.$el.find('.ContentLoader').css('display', 'none');
    }
  });

  var BaseModel = Backbone.Model.extend({

    formatNum: function (num) {

      return parseFloat(num).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,').replace('.', '#').replace(',', '.').replace('#', ',');
    }

  });

  var BaseCollection = Backbone.Collection.extend();

  var BaseRouter = Backbone.Router.extend();

  var FormView = BaseView.extend({
    events: {
      'click .Cancel': 'formCancel',
      'click .Submit': 'formSubmit'
    },

    formCancel: function () {
      this.close();
    },

    formSubmit: function (e) {
      e.preventDefault();
      if (!this.model.sanitize()) {
        return false;
      }
    }
  });

  var ListView = BaseView.extend({});

  var Base = {
    'View': BaseView,
    'Model': BaseModel,
    'Router': BaseRouter,
    'Collection': BaseCollection,
    'Views': {
      'FormView': FormView,
      'ListView': ListView
    }
  };

  return Base;
});