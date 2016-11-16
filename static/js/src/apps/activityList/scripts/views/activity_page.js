/* global define, alert, console */
'use strict';
define (function (require) {
  var
      $ = require('jquery'),
      Handlebars = require('handlebars'),

      Base = require('base'),

      settings = require('settings'),
      MESSAGES = require('common/messages'),

      TransactionModel = require('common/scripts/models/transaction_model'),
      ActivityListItem = require('apps/activityList/scripts/views/activity_list_item'),
      commentListItemTpl = require('text!apps/activityList/templates/comment_list_item.html'),
      activityPageTpl = require('text!apps/activityList/templates/activity_page.html'),
      datetimeUtils = require('utils/datetime_util');


  var ActivityPage = Base.View.extend({

    className: 'ActivityPage activity-page app-page has-nav background-light',

    template: Handlebars.compile(activityPageTpl),

    events: {
      'submit .LeaveCommentForm': 'leaveComment',
      'touchend .backActivity': 'backActivity'
    },

    initialize: function (config) {
      this.extendEvents();

      this.trans_id = config.trans_id;
      return this;
    },

    render: function () {
      var _this = this;

      this.showPageLoader();
      this.$el.html(this.template());
      this.model = new TransactionModel({id: this.trans_id});
      this.model.fetch({
        url: settings.urlRoot + '/activities/' + this.trans_id + '?user_id=' + localStorage.loggedInAs,
        success: function (model) {
          var date = new Date();
          var d = parseInt(model.get("timestamp")) * 1000;
          var formatTime = datetimeUtils.formatDate("DD/MM/YY", d) + " às " +datetimeUtils.formatDate("h:mm", d);
          model.set('dateFromNow', formatTime);

          _this.d = d;   //Store comment period；
          _this.activityListItem = new ActivityListItem({model: model});

          _this.$el.find('.ActivityContainer').html(_this.activityListItem.render().el);

          _this.hidePageLoader();
          // Load other comments
          _this.loadComments();

         var nameId = model.get("likes");
         var getURL = settings.urlRoot + '/users?ids=[';
         var html = "";
         for(var i = 0; i < nameId.length; i++){
          if( i === nameId.length -1){
            getURL += nameId[i];
          }else{
            getURL += nameId[i] + ',';
          }
         }
         getURL += ']';

         if( nameId.length ){
          $.ajax({
            type: 'GET',
            dataType: 'json',
            url: getURL,
            success: function(data){
              if(data.length <= 2) {
                for(var i = 0; i < data.length; i++){
                  if(data.length === 2 && i === 0 ){
                    html += data[i].firstName + ",";
                  }else{
                    html += data[i].firstName;
                  }
                }
                html += " ";
              }else if(data.length >2){
                if(data.length ===3 ){
                  html = data[0].firstName + "," + data[1].firstName + " e outras " + (data.length-2) + " pessoa curtiram isso.";
                }else{
                  html = data[0].firstName + "," + data[1].firstName + " e outras " + (data.length-2) + " pessoas curtiram isso.";
                }

              }
              _this.$el.find(".likeUsers").html(html);
            }
          });
         }
        },
        error: function (req, status) {
          alert(MESSAGES.alert.activityPageNotLoad);
          _this.hidePageLoader();
        }
      });

      /* Meanwhile load user's own image */
      this.$el.find('.LeaveCommentForm .user-photo').attr('src', settings.urlRoot + '/uploads/users/' + localStorage.loggedInAs);

      return this;
    },

    leaveComment: function (e) {
      e.preventDefault();

      var _this = this,
          commentText = this.$el.find('.CommentText').val();

      $.ajax({
        url: settings.urlRoot + '/social/' + localStorage.loggedInAs + '/comment/' + this.model.get('id'),
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify({comment: commentText}),
        success: function (data) {
          _this.$el.find('.CommentText').val('');
          document.activeElement.blur();
          _this.loadComments();
        },
        error: function () {
          alert(MESSAGES.alert.activityPageNotLoad);
        }
      });

    },

    loadComments: function () {
      // populate comments
      var _this = this;

      this.showContentLoader();
      $.ajax({
        url: settings.urlRoot + '/social/comments/' + this.model.get('id'),
        type: 'GET',
        dataType: 'json',
        success: function (comments) {
          for (var i = 0, comment; i < comments.length; i++) {
            comment = comments[i];

            comment.image = settings.urlRoot + comment.image;
          }
          //show default image
          var modelT = comments;
          var reg = /(null)|(user_default.jpg)/;
          var nameAcronym;
          for(var i = 0; i < modelT.length; i++){
            var fullName = modelT[i].fullName.replace(/\s+/g,' ').split(" ");
            if (modelT[i].image && !reg.test(modelT[i].image)) {
              modelT[i].image = '<img class="user-photo dd-photo" src="' + modelT[i].image + '">';
            }else{
              if(fullName.length < 2){
                nameAcronym = fullName[0].substr(0,1);
              }else{
                nameAcronym = fullName[0].substr(0,1) + fullName[1].substr(0,1);
              }
              modelT[i].image = '<span class="user-photo dd-photo default-photo">' + nameAcronym.toUpperCase() + '</span>';
            }
          }
          comments = modelT;
          //

          _this.$el.find('.ListComments').html(
            Handlebars.compile(commentListItemTpl)({comments: comments}));
          _this.hideContentLoader();

          var d = _this.d;
          var commentTime =" às " + datetimeUtils.formatDate("hh", d) + "h" +datetimeUtils.formatDate("mm", d);
          _this.$el.find('.commentTime').html(commentTime);
        },
        error: function (req,status) {
          alert(MESSAGES.ALERT.activityPageNotLoad);
          _this.hideContentLoader();
        }
      });
    },
    backActivity: function(){
      window.location.hash = 'activities';
    }
  });

  return ActivityPage;
});