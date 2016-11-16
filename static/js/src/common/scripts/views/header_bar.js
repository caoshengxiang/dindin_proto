/* globals define, require, console */
'use strict';

define(function (require) {
  var
      $ = require('jquery'),
      Handlebars = require('handlebars'),

      Base = require('base'),
      settings = require('settings'),
      MenuPane = require('apps/menuPane/scripts/views/menu_pane'),

      HeaderBarTpl = require('text!common/templates/header_bar.html');

  var HeaderBar = Base.View.extend({

    template: Handlebars.compile(HeaderBarTpl),

    className: 'HeaderBar header-bar',

    events: {
      'click .MakePayment': 'makePayment',
      'click .Activity': 'showActivities',
      'click .MenuToggle': 'toggleMenuPane'
    },

    initialize: function (config) {
      this.extendEvents();

      this.config = config;


      return this;
    },

    render: function () {
      this.$el.html(this.template());

      this.$el.find('.Global').addClass("dd-icon-feed-grey-01");

      this.$el.find('.Activity').removeClass('active');
      if (this.config && 'activeTab' in this.config) {
        this.$el.find(this.config.activeTab).addClass('active');
      }

      if(window.location.hash === "#payment"){
        this.$el.find('.payBt').removeClass("dd-icon-new-grey-01").addClass("dd-icon-new-lightgreen-01");
      }else if(window.location.hash === "#activities"){
        this.$el.find('.Global').removeClass("dd-icon-feed-grey-01").addClass("dd-icon-feed-lightgreen-01");
      }else if(window.location.hash === "#activities/pending"){
        this.$el.find('.Pending').removeClass("dd-icon-odds-grey-01").addClass("dd-icon-odds-lightgreen-01");
      }else if(window.location.hash === "#activities/me"){
        this.$el.find('.User').removeClass("dd-icon-person-grey-01").addClass("dd-icon-person-lightgreen-01");
        // Clear all unread messages since users are "reading" this page
        localStorage.requestsCount = 0;
      }else if(/^#activity\/*/.test(window.location.hash) || /#activities\/friends/.test(window.location.hash)){
        this.$el.find('.Global').removeClass("dd-icon-feed-grey-01").addClass("dd-icon-feed-lightgreen-01");
      }

      /* Display notification signal when there are notifications */
      this.fetchNotifications();

      // console.log(window.location.hash);
      return this;
    },

    makePayment: function () {
      this.$el.find('.payBt').addClass("ative");

      window.location.hash = 'refresh/payment';
    },

    showActivities: function (e) {
      var $target = $(e.currentTarget);
      /**
       * toggle active states
       */

      if (!$target.hasClass('active')) {
        this.$el.find('.Activity').removeClass('active');
        $target.addClass('active');
      }

      if ($target.hasClass('User')) {
        window.location.hash = 'refresh/activities/me';

      } else if ($target.hasClass('Pending')) {
        // TODO:
        // Check with product team if this stands for pending
        window.location.hash = 'refresh/activities/pending';
      } else {
        window.location.hash = 'refresh/activities';
      }

    },

    toggleMenuPane: function () {
      var currPos, newPos;

      if (this.menuPane) {
        // 0 or -80%
        currPos = this.$el.find('.MenuPaneWrapper').css('left');
        if (currPos === '0px') {
          newPos = '-80%';
        } else {
          this.menuPane.render();
          newPos = '0px';
        }
        this.$el.find('.MenuPaneWrapper').animate({left: newPos});
      } else {
        this.menuPane = new MenuPane();
        this.$el.find('.MenuPaneWrapper')
          .html(this.menuPane.render().el)
          .animate({left: '-80%'}, 0)
          .animate({left: '0'});
      }
    },
    fetchNotifications: function () {
      var _this = this;

      $.ajax({
        url: settings.urlRoot + '/u/' + localStorage.loggedInAs + '/notifications',
        type: 'GET',
        dataType: 'json',
        success: function (data) {
          if (data.pending_count > 0) {
            _this.$el.find('.PendingCount').html(data.pending_count).css({display: 'flex'});
          }

          localStorage.requestsCount = localStorage.requestsCount || 0;

          if (data.request_count > 0) {
            _this.$el.find('.RequestsCount').html(data.request_count + localStorage.requestsCount).css({display: 'flex'});
          } else if (localStorage.requestsCount > 0) {
            _this.$el.find('.RequestsCount').html(localStorage.requestsCount).css({display: 'flex'});
          }
        },
        error: function (data) {
          console.error('Unable to get notifications for user id: ', localStorage.loggedInAs);
        }
      });
    }
  });

  return HeaderBar;

});