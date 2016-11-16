
/* globals define, require, console */
'use strict';

define(function (require) {
  var
      $ = require('jquery'),
      Handlebars = require('handlebars'),
      bouncefix = require('bouncefix'),

      settings = require('settings'),
      Base = require('base'),

      TransactionCollection = require('common/scripts/collections/transactions'),

      ActivityListTpl = require('text!apps/activityList/templates/activity_list.html'),
      ActivityListItem = require('apps/activityList/scripts/views/activity_list_item');


  var ActivityListView = Base.Views.ListView.extend({

    className: 'ActivityList app-page has-nav',

    events: {
      'click .GlobalActivities': 'showActivities',
      'click .FriendsActivities': 'showActivities',
      'click .ToPay': 'showToPayTransactions',
      'click .ToCharge': 'showToChargeTransactions'
    },

    template: Handlebars.compile(ActivityListTpl),

    render: function (config) {
      /**
       * Config is {
       *   filter: <filter_criteria>
       * }
       *
       * if filter_criteria === 'me' {
       *   pull data from '/activities/me'
       * }
       *
       */
      var _this = this, fetchUrl = '', context = {};

      /**
       * Load page specific tabs here
       */
      this.inverse = true;
      if (config.filter === 'me') {
        fetchUrl = 'activities/me/u/' + localStorage.loggedInAs;
        context.isUser = true;
        context.isPersonalFeed = true;
      } else if (config.filter === 'pending') {
        fetchUrl = 'activities/pending/u/' + localStorage.loggedInAs;
        context.isPending = true;
        this.inverse = false;
      } else if (config.filter === 'friends') {
        fetchUrl = 'activities/friends/u/' + localStorage.loggedInAs;
        this.inverse = false;
        context.isPublic = true;
        context.friendsTab = 'active';
        context.isFriendsFeed = true;
      } else {
        fetchUrl = 'activities';
        context.isPublic = true;
        context.globalTab = 'active';
      }

      // Save context variable for later use
      this.context = context;

      this.$el.html(this.template(context));
      bouncefix.add('ios-scroll');
      this.showContentLoader();

      this.collection = new TransactionCollection();

      this.collection.fetch({
        url: settings.urlRoot + '/' + fetchUrl,
        success: function (collection) {
          if (!context.isPending) {
            _this.showActivities();
          } else {
            _this.showToChargeTransactions();
            var pendingPayCount = collection.filter({fromID: parseInt(localStorage.loggedInAs)}).length;
            var pendingChargeCount = collection.filter({toID: parseInt(localStorage.loggedInAs)}).length;

            if (pendingPayCount > 0) {
              _this.$el.find('.PendingToPay').html(pendingPayCount).css({display: 'flex'});
            }

            if (pendingChargeCount > 0) {
              _this.$el.find('.PendingToReceive').html(pendingChargeCount).css({display: 'flex'});
            }


          }

          /* Removed fixed top for user's own feed */
          if (context.isUser) {
            _this.$el.find('.ActivityContainer').removeClass('has-fixed-top');
            _this.$el.find('.ActivityContainer').addClass('personal-feed');
          }
          /**
           * Hide content loader on success callback
           */
          _this.hideContentLoader();
        },
        error: function (req, status, err) {
          alert(err);
        }
      });

      return this;
    },

    toggleActiveTabs: function ($activeTab) {
      this.$el.find('.tab').removeClass('active');
      $activeTab.addClass('active');
    },

    showActivities: function (e) {
      var activities;

      // TODO:
      // if no 'e', show friends activities by default
      if (!e) {
        activities = this.collection;
      } else {

        if( !this.$el.find('.tab').hasClass('Profile')){
          var $targetTab = $(e.currentTarget);

          this.toggleActiveTabs($targetTab);

          if ($targetTab.attr('data-name') === 'friends') {
            window.location.hash = 'activities/friends';
          } else {
            window.location.hash = 'activities';
          }
          return false;
        }else{
          activities = this.collection;
        }

      }

      return this.loadTransactions(activities.models);
    },

    showToPayTransactions: function (e) {
      /**
       * Idea here is fetch all pending from server, but
       * only display toPay when clicked tab "toPay", show
       * toCharge when clicked tab "toCharge"
       */
      var $target = $(e.currentTarget),
          transToBePaid = this.collection.filter({
            fromID: parseInt(localStorage.loggedInAs)});

      this.toggleActiveTabs($target);
      return this.loadTransactions(transToBePaid);
    },

    showToChargeTransactions: function (e) {
      var $target = e ? $(e.currentTarget) : this.$el.find('.ToCharge'),
          transToBeCharged = this.collection.filter({
            toID: parseInt(localStorage.loggedInAs)});

      this.toggleActiveTabs($target);
      return this.loadTransactions(transToBeCharged);
    },

    loadTransactions: function (activities) {
      var activity, activityItem, cachedDom = [];

      for (var i = 0; i < activities.length; i++) {
        activity = activities[i];
        if (this.context.isFriendsFeed || this.context.isPersonalFeed) {
          activity.set('fromNameDisplay', activity.get('fromName'));
          activity.set('toNameDisplay', activity.get('toName'));
          activity.set('isPersonalFeed', this.context.isPersonalFeed);
          activity.set('isFriendsFeed', this.context.isFriendsFeed);
        }

        activityItem = new ActivityListItem({model: activity, inverse: this.inverse});
        cachedDom.push(activityItem.render().el);
      }
      this.$el.find('.ActivityContainer').empty().append(cachedDom);

      return this;
    }
  });



  return ActivityListView;

});