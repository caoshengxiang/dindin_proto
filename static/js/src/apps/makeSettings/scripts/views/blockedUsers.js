/* globals define */
'use strict';

define (function (require) {
  var
      Handlebars = require('handlebars'),
      Base = require('base'),
      settings = require('settings'),
      userCollection = require('common/scripts/collections/user_collection'),
      settingsListTpl = require('text!apps/makeSettings/templates/blocked_users.html');

  var MakeSettingsList = Base.View.extend({

    template: Handlebars.compile(settingsListTpl),

    className: 'BlockedUsers block-user-photo-container dd-list app-page has-nav',

    events:{
      'click .Unblock': 'unblockUser'
    },

    render: function (data) {
      var _this = this;
      this.collection = new userCollection();
      this.collection.fetch({
        url: settings.urlRoot + '/users?query=s',
        success: function (data) {
          _this.$el.html(_this.template(data));
        }
      });

      return this;
    },
    unblockUser: function(e){
      var target = e.currentTarget;
      var dataId = $(target).attr('data-id');
      console.log($(target).attr('data-id'));

      $.ajax({
        type: 'post',
        url: settings.urlRoot + /user/ + localStorage.loggedInAs + /unblock/ + dataId ,
        dataType: 'json',
        success: function(data){

        },
        error: function(){
          console.log("error");
        }
      });

      $(target).parents(".block-user-photo-list").remove();

    }
  });

  return MakeSettingsList;

});