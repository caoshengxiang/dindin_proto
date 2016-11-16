/* global define, alert */
'use strict';
define (function (require) {
  var
      $ = require('jquery'),
      Handlebars = require('handlebars'),

      Base = require('base'),
      settings = require('settings'),
      MESSAGES = require('common/messages'),

      ActivityListItemTpl = require('text!apps/activityList/templates/activity_list_item.html');


  var ActivityListItem = Base.View.extend({

    className: 'ActivityListItem activity-list-item',

    template: Handlebars.compile(ActivityListItemTpl),

    events: {
      'touchstart': 'toggleHighlight',
      'touchend': 'toggleHighlight',
      'click': function (e) {
        e.preventDefault();
        var target = e.target,
            tParent = target.parentElement,
            tClassNames = target.className,
            pClassNames = tParent.className;

        if (tClassNames.match('LikeActivity')) {
          return this.liked();
        } else if (tClassNames.match('AcceptCharge')) {
          return this.acceptCharge();
        } else if (tClassNames.match('RejectCharge')) {
          return this.rejectCharge();
        } else if (pClassNames.match('dd-photo-link')) {
          // console.log('View photo');
          window.location = $(tParent).attr('href');
        } else if (tClassNames.match('AcceptFriendship')) {
          return this.acceptFriendship(e);
        } else if (tClassNames.match('RejectFriendship')) {
          return this.rejectFriendship(e);
        } else {
          if (!this.model.get('isFriendRequest')) {
            return this.enterActivityPage();
          }
        }
      }
    },

    render: function () {
      /**
       * Do not inverse on /pending page
       */
      if (this.model.get('status') === 'pending' && this.inverse) {
        this.$el.addClass('inverse');
      }
      this.$el.html(this.template(this.model.translate().evalStatus().toJSON()));

      for(var i = 0;i < this.model.get('likes').length;i++){
        if(this.model.get('likes')[i] === parseInt(localStorage.loggedInAs)){
          this.$el.find('.LikeActivity').removeClass('dd-icon-heart-01').addClass('dd-icon-heart-highlight-01 liked');
          break;
        }
      }
      //console.log(this.model.get('likes'));
      this.$el.find('.countLikes').html(this.model.get('likes').length);
      return this;
    },

    acceptCharge: function () {
      this.model.set({
        'action': 'accept',
        'status': 'completed'
      });

      return this.updateModel();
    },

    rejectCharge: function () {
      this.model.set({
        'action': 'reject',
        'status': 'rejected'
      });

      return this.updateModel();
    },

    acceptFriendship: function (e) {
      e.preventDefault();
      // TODO: remove first because query may take long
      // If there are errors, users will still be notified later
      this.remove();

      $.ajax({
        url: settings.urlRoot + '/friendship/confirm/u1/' + this.model.get('fromID') + '/u2/' + localStorage.loggedInAs,
        type: 'POST',
        success: function (data) {
          console.log(data);
          var newRequestCount = parseInt($('.HeaderBar .RequestsCount').text());
          if ((newRequestCount -= 1) > 0) {
            $('.HeaderBar .RequestsCount').text(newRequestCount);
          } else {
            $('.HeaderBar .RequestsCount').hide();
          }
        },
        error: function (response) {
          alert(MESSAGES.ALERT.friendshipConfirmFailed);
        }
      });
    },

    rejectFriendship: function (e) {
      e.preventDefault();
      // TODO: remove first because query may take long
      // If there are errors, users will still be notified later
      this.remove();

      $.ajax({
        url: settings.urlRoot + '/friendship/reject/u1/' + this.model.get('fromID') + '/u2/' + localStorage.loggedInAs,
        type: 'POST',
        success: function (data) {
          console.log(data);
          var newRequestCount = parseInt($('.HeaderBar .RequestsCount').text());
          if ((newRequestCount -= 1) > 0) {
            $('.HeaderBar .RequestsCount').text(newRequestCount);
          } else {
            $('.HeaderBar .RequestsCount').hide();
          }
        },
        error: function (response) {
          alert(MESSAGES.ALERT.friendshipConfirmFailed);
        }
      });
    },

    liked: function() {
      if(!this.$el.find('.LikeActivity').hasClass('liked')){
        this.model.set({
          'likeAction': 'liked',
        });
      }else{
        this.model.set({
          'likeAction': 'dislike',
        });
      }


      return this.likeActivityFunc();
    },

    likeActivityFunc: function() {
      var _this = this;
      var count = this.$el.find('.countLikes').html();
      if(count === null || count === define || count === ''){
        count = 0;
      }
      count = parseInt(count);
      // It is kinda slow waiting for the async,
      // since it is not a critical function, update UI first, then make async call
      if(_this.model.get('likeAction') === 'liked'){
        this.$el.find('.LikeActivity').removeClass('dd-icon-heart-01').addClass('dd-icon-heart-highlight-01 liked');
        count++;
        this.$el.find('.countLikes').html(count);
      }
      else{
        this.$el.find('.LikeActivity').removeClass('dd-icon-heart-highlight-01 liked').addClass('dd-icon-heart-01');
        count--;
        this.$el.find('.countLikes').html(count);
      }

      this.model.save(null, {
       url: settings.urlRoot + '/social/' + localStorage.loggedInAs + '/like/' + this.model.id,
       error: function(){
          alert(MESSAGES.ALERT.unlikable);
          _this.render();

          return false;
       }
      });
    },

    updateModel: function () {
      var _this = this;

      this.model.save(null, {
        url: this.model.url + '/' + this.model.id,
        success: function (data) {
          _this.model.set('isPending', false);
          _this.$el.removeClass('inverse');

          var curPendingPay = parseInt($('.PendingToPay').text());
          curPendingPay -= 1;
          if (curPendingPay > 0) {
            $('.PendingToPay').text(curPendingPay);
          } else {
            $('.PendingToPay').hide();
          }

          return _this.render();
        },
        error: function () {
          alert(MESSAGES.ALERT.paymentNotCompleted);

          return false;
        }
      });
    },
    enterActivityPage: function () {
      // Redirect to the page of this specific activity
      $('.activityGlobal').addClass("active");
      window.location.hash = '#activity/' + this.model.get('id');

    },

    toggleHighlight: function (e) {
      var target = e.currentTarget;

      $(target).toggleClass('highlighted');
    }
  });

  return ActivityListItem;

});