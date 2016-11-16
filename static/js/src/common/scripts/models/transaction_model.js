/* global define, require, console */
'use strict';
define(function (require){
  var
      settings = require('settings'),
      Base = require('base'),

      ActivityModel = require('common/scripts/models/activity_model');

  var  TransactionModel = ActivityModel.extend({

    url: settings.urlRoot + '/transfer',

    defaults: {
      from: null,
      to: null,
      fromName: '',
      toName: '',
      amount: parseFloat(0),
      status: null,
      timestamp: null,
      type_en: null,
      // If to id is not present, send toEmail to server
      toEmail: null,
      image: 'static/img/users/user_default.jpg'
    },

    parse: function (data) {

      var uid = parseInt(localStorage.loggedInAs),
          timeNow = new Date();
      var nameAcronym = '';
      var reg = /(null)|(user_default.jpg)/;
      var fullName = '';

      if(data.fromName){
        fullName = data.fromName.replace(/\s+/g,' ').split(" ");
      }
      if (data.image && !reg.test(data.image)) {
        data.image = '<img class="user-photo dd-photo" src="' + settings.urlRoot + data.image + '">';
      }else{
        if(fullName.length < 2 && fullName !== ''){
          nameAcronym = fullName[0].substr(0,1);
        }else if (fullName !== '') {
          nameAcronym = fullName[0].substr(0,1) + fullName[1].substr(0,1);
        }
        data.image = '<span class="user-photo dd-photo default-photo">' + nameAcronym.toUpperCase() + '</span>';
      }


      if (data.amount) {
        data.displayAmount = this.formatNum(data.amount);
        /**
         * If user id === toid,
         *   then positive
         * Else if user id === fromid
         *   then negative
         */
        if (uid) {
          if (parseInt(data.toID) === uid) {
            data.isPositive = 'positive';
          } else if (parseInt(data.fromID) === uid) {
            data.isPositive = 'negative';
          }
        }
      }

      /**
       * TODO: change name display to be more sensible
       */
      data.fromNameDisplay = this.formatDisplayName(data.fromName);
      data.toNameDisplay = this.formatDisplayName(data.toName);

      /**
       * Get dateFromNow
       */
      data.dateFromNow = this.formatTimeRange(data.timestamp, timeNow);

      return data;
    },

    /**
     * Split by spaces, then join the first with the capital letter
     *   of last, followed by a '.'
     */
    formatDisplayName: function (name) {
      if (!name) {
        return '';
      }

      var nameParts = name.split(' '),
          len = nameParts.length;
      if (len <= 1) {
        return name;
      }
      return nameParts[0] + ' ' + nameParts[len - 1][0] + '.';
    },

    formatTimeRange: function (prevTime, nowTime) {
      /**
       * Time intervals:
       *   - h
       *   - d
       *   - m
       *   - w
       *   - y
       * if (dayInterval > 0):
       *   - if (dayInterval > 7): modulus -> weeks
       *   - if (dayInterval > 30): modulus -> months
       *   - if (dayInterval > 365): modulus -> years
       * else:
       *   - modulus -> hours
       */
      var
          prevDate = new Date(parseInt(prevTime) * 1000),
          timeInterval;

      /*if (nowTime.getDate() - prevDate.getDate() > 0) {
        timeInterval = nowTime.getDate() - prevDate.getDate();
        if (timeInterval / 365 >= 1) {
          return Math.ceil(timeInterval / 365) + ' yr';
        } else if (timeInterval / 30 >= 1) {
          return Math.ceil(timeInterval / 30) + ' m';
        } else if (timeInterval / 7 >= 1) {
          return Math.ceil(timeInterval / 7) + ' w';
        } else {
          return timeInterval + ' d';
        }
      } else {
        timeInterval = nowTime.getHours() - prevDate.getHours();
        return timeInterval + ' hr';
      }*/

      if(nowTime.getFullYear() - prevDate.getFullYear()){
        timeInterval = nowTime.getFullYear() - prevDate.getFullYear();
        return timeInterval + ' yr';
      }else if(nowTime.getMonth() - prevDate.getMonth()){
        timeInterval = nowTime.getMonth() - prevDate.getMonth();
        return timeInterval + ' m';
      }else if(( nowTime.getDate() - prevDate.getDate() ) > 7){
        timeInterval = nowTime.getDate() - prevDate.getDate();
        return Math.ceil(timeInterval / 7) + ' w';
      }else if( nowTime.getDate() - prevDate.getDate() ){
        timeInterval = nowTime.getDate() - prevDate.getDate();
        return timeInterval + ' d';
      }else{
        timeInterval = nowTime.getHours() - prevDate.getHours();
        return timeInterval + ' hr';
      }
    }
  });

  return TransactionModel;

});