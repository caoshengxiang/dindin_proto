/* globals define, require, console */
'use strict';

define(function (require) {
  var
      Base = require('base');

  var ActivityModel = Base.Model.extend({

    url: '/api/v1/activities/new',

    dict: {
      'payment': 'pagou',
      'charge': 'cobrou',
      'countLikes': '',
      'countComments': ''
    },

    generateTitle: function () {
      // TODO: this function may not be necessary
      var title;

      if (this.get('type') === 'payment') {
        return this.get('fromName') + ' pagou ' + this.get('toName');
      } else if (this.get('status') === 'pending') {
        // TODO: use portuguese translation here
        title = this.get('fromName') + ' wants to charge you for ' + this.get('amount');
        this.set('title', title);
        return title;
      } else {
        return this.get('toName') + ' cobrou ' + this.get('fromName');
      }
    },

    translate: function () {
      var mAttributes = this.attributes;

      for (var key in mAttributes) {
        if (mAttributes[key] in this.dict) {
          mAttributes[key + '_br'] = this.dict[mAttributes[key]];
        }
      }

      this.attributes = mAttributes;

      return this;
    },

    evalStatus: function () {
      /**
       * Status includes:
       *   type_en: payment, charge, withdraw
       *   status:  pending, completed, rejected
       */

      /**
       * Highlight group payment
       */
      if (this.get('groupTrans') === true && this.get('groupName')[0] !== '@') {
        this.set('groupName', '@' + this.get('groupName'));
      }

      if (this.get('type_en') === 'payment') {
        // Because payment don't have pending status
        this.set('isPayment', true);
        /**
         * TODO: Move social related stuffs somewhere else?
         */
        var likes = this.get('likes'),
            comments = this.get('comments'),
            countLikes,
            countComments,
            uid = parseInt(localStorage.loggedInAs);

        countLikes = likes.length >= 100 ? '100+' : likes.length;
        countComments = comments.length >= 100 ? '100+' : comments.length;

        this.set('countLikes', countLikes);
        this.set('countComments', countComments);

        if (comments.indexOf(uid) >= 0) {
          this.set('commented', true);
        }

        if (likes.indexOf(uid) >= 0) {
          this.set('liked', true);
        }

        return this;

      } else if (this.get('type_en') === 'withdraw') {
        this.set('isWithdraw', true);
        return this;
      } else if (this.get('type_en') === 'friend_request') {
        this.set('isFriendRequest', true);
        return this;
      }

      if (this.get('status') === 'pending') {
        this.set('isPending', true);
        if (this.get('fromID') === parseInt(localStorage.loggedInAs)) {
          this.set('isActionable', true);
        }
      } else if (this.get('status') === 'rejected') {
        this.set('isRejected', true);
      }

      return this;
    }
  });

  return ActivityModel;
});