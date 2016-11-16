/* globals define, require, console */

'use strict';

define(function (require) {
  var
      Handlebars = require('handlebars'),

      Base = require('base'),
      
      settings = require('settings'),

      TransactionCollection = require('common/scripts/collections/transactions'),
      ActivityListItem = require('apps/activityList/scripts/views/activity_list_item'),
      standingPageTpl = require('text!apps/standingPage/templates/standing_page.html');


  var StandingPageView = Base.View.extend({

    className: 'WelcomeContent welcome-content activity-container app-page welcome-page',

    events: {
      'click': 'loadLoginOptions',
      'click .Register': 'loadRegistrationForm',
      'click .Enter': 'loadActivities'
    },

    template: Handlebars.compile(standingPageTpl),

    initialize: function (data) {
      this.data = {};
      this.data.centerImage = data.centerImage;
      this.data.bgImage = data.bgImage;
      this.data.extraImages = data.extraImages;
      this.data.centerText = data.centerText;
      this.data.extraText = data.extraText;
    },

    render: function () {
      var _this =this;
      this.$el.html(this.template(this.data));
      this.$el.addClass('app-background-color');

      this.collection = new TransactionCollection();
      this.collection.fetch({
        url: settings.urlRoot + '/activities',
        success: function (collection) {
         
         // _this.$el.find('.RecentActivity').html(_this.activityListItem.render().el);
         var cachedDom = [],
              activity,
              activityItem;
         for(var i = 0; i < collection.models.length; i++){
        //for(var i = 0; i < 4; i++){
            activity = collection.models[i];
            activityItem = new ActivityListItem({model: activity, inverse: true});
            cachedDom.push(activityItem.render().el);
         }
          _this.$el.find('.RecentActivity').empty().append(cachedDom);
          _this.$el.find('.RecentActivity').find('.ico-cell').css({'display': 'none'});
        },
        error: function(){
          alert()
        }
      });

     
      return this;
    },

    loadLoginOptions: function () {
      this.$el.addClass('display-login');
    },

    loadRegistrationForm: function () {
      
      window.location.hash = 'register';
      
    },

    loadActivities: function () {
      // TODO: make sure user logged in
      if (localStorage.loggedInAs) {
        window.location.hash = 'activities';
      } else {
        window.location.hash = 'login';
      }
    }
  });

  return StandingPageView;

});