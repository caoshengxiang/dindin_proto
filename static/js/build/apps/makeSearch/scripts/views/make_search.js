/* globals define, alert, confirm */
'use strict';
define(function (require) {
  var
      $ = require('jquery'),
      _ = require('underscore'),
      Handlebars = require('handlebars'),

      settings = require('settings'),

      Base = require('base'),

      searchPageTpl = require('text!apps/makeSearch/templates/search_page.html'),
      searchListItemTpl = require('text!apps/makeSearch/templates/search_list_item.html');

  /**
   * The search page allows user to perform searching for users (for now)
   * its function getSearchResults() will return the search results.
   * @type {View Object}
   */

  /**
   * global variable but local to this module
   */
  var recipients = {};
  var groupMembers = [];
  var recentUsers = [];

  var SearchPage = Base.View.extend({

    className: 'SearchPage search-page app-page has-nav',

    template: Handlebars.compile(searchPageTpl),

    events: {
      // 'click': 'unfocusAll',
      'click .EnterAmount': 'enterPaymentPage',
      'keyup .SearchUsers': 'searchForUsers',
      'click .SearchBox': 'searchInputFocus',
      'submit': 'formSubmit',
      'click .CreateGroup': 'enterGroupManagerPage'
    },

    initialize: function (options) {
      options = options || {};
      options.recipients = options.recipients || {};

      try {
        this.filter = options.filter;
      } catch (e) {
        console.log(e);
      }

      recipients = this.recipients = options.recipients;

      return this;
    },

    render: function () {
      var _this = this;

      this.showContentLoader();

      if (!this.filter ||
          (this.filter && this.filter === 'payment') ||
          (this.filter && this.filter === 'groupManage')
          ) {
        this.loadMultiUserDropdown();
      } else {
        this.loadSingleUserDropdown();
      }

      return this;
    },

    searchForUsers: function (e) {
      var _this = this;
      var queryString = this.$el.find('.SearchUsers').val().trim().toLowerCase();

      if (queryString === '') {
        /**
         * If user clears the input box, clear the result list
         */
        this.$el.find('.Results').html('');
        return;
      }

      var queryUrl;

      if (this.filter === 'groupManage') {
        queryUrl = settings.urlRoot + '/users?nogroup=True&query=' + queryString;
      } else {
        queryUrl = settings.urlRoot + '/users?user_id='+ localStorage.loggedInAs +'&query=' + queryString;
      }

      $.ajax({
        url: queryUrl,
        type: 'GET',
        dataType: 'json',
        success: function (data) {
          var cachedDom = [];
          var userData;
          for (var i = 0; i < data.length; i++) {
            userData = data[i];
            if (userData.id in recipients) { continue; }
            if (recentUsers.indexOf(userData.id) > 0) continue;

            userData.image = settings.urlRoot + userData.image;
            userData.fullName = [userData.firstName, userData.lastName].join(' ');
            // TODO: change this once we have a strategy for generating username
            userData.userName = userData.email;

            if (_this.isToPay) {  userData.isToPay = true; }
            else if (_this.groupManage) { userData.groupManage = true; }
            var searchListItem = new SearchListItem({model: data[i]});
            cachedDom.push(searchListItem.render().el);
          }

          _this.$el.find('.Results').html(cachedDom);

        },
        error: function (req, status) {
          try {
            alert('Error' + status.responseJSON.error);
          } catch(e) {
            alert(e);
          }

          return false;
        }
      });
    },

    searchInputFocus: function () {
      this.$el.find('.SearchUsers').focus();
    },

    searchInputUnfocus: function () {
      this.$el.find('.Results').html('');
    },

    formSubmit: function (e) {
      e.preventDefault();
    },

    getSearchResults: function (filter) {
      var outData, key;

      if (filter && filter === 'groupManage') {
        outData = [];
        for (key in recipients) {
          var member = recipients[key];
          outData.push({id: key, fullName: member.fullName, image: member.image});
        }

        return outData;
      } else {

        outData = { values: [], texts: [] };

        for (key in recipients) {
          outData.values.push(key);
          outData.texts.push(recipients[key]);
        }
        return outData;
      }
    },

    getRecipients: function () {
      return recipients;
    },

    // unfocusAll: function (e) {
    //   /**
    //    * Work around. With an exception of clicking anywhere inside
    //    *   dropdown area
    //    */
    //   var target = e.target;

    //   if ($(target).hasClass('SearchBox') ||
    //       this.$el.find('.SearchBox').has(target).length > 0) {
    //     return false;
    //   }

    //   this.$el.find('.focused').removeClass('focused');
    // },

    enterPaymentPage: function (e) {
      e.preventDefault();
      if (_.isEmpty(recipients)) {
        return false;
      } else {
        window.location.hash = 'payment';
      }
    },

    loadMultiUserDropdown: function () {
      var data = {};
      if (this.filter === 'groupManage') {
        this.groupManage = true;
        data.groupManage = true;
      } else {
        this.isToPay = true;
        data.isToPay = true;
      }
      this.$el.html(this.template(data));

      if (this.isToPay) {
        this.loadRecentRecipients();
      }

      return this.loadTags();
    },

    loadTags: function () {
      /**
       * Comment: you have to load it AFTER other DOM elements are
       * fully loaded!
       */
      if (_.isEmpty(this.recipients)) {
        console.log('No previous search results yet, starting a new search');
      } else {
        console.log('There are previous results, displaying them now.');
        for (var key in this.recipients) {
          var model = {id: key, fullName: this.recipients[key]};
          var inputTag = new InputNameTag({model: model});
          inputTag.render();
        }
      }
    },

    loadSingleUserDropdown: function () {
      this.$el.html(this.template());
      this.loadRecentRecipients();
    },

    enterGroupManagerPage: function () {
      window.location.hash = 'group/create';
    },

    removeRecipient: function (id) {
      delete recipients[id];
      console.log('deleted ', id);
    },

    loadRecentRecipients: function () {
      var _this = this;

      $.getJSON(settings.urlRoot + '/u/' + localStorage.loggedInAs + '/recipients/recent', function (data) {
        var cachedDom = [];
        for (var i = 0, counter = 0; i < data.length; i++) {
          data[i].fullName = data[i].firstName + ' ' + data[i].lastName;
          data[i].image = settings.urlRoot + data[i].image;
          data[i].isToPay = _this.isToPay;
          recentUsers.push(data[i].id);
          if (counter >= 3) break;
          var itemView = new SearchListItem({model: data[i]});
          cachedDom.push(itemView.render().el);
          counter++;
        }
        _this.$el.find('.Recents').html(cachedDom);
      });
    }
  });

  var SearchListItem = Base.View.extend({

    className: 'SearchListItem search-list-item',

    template: Handlebars.compile(searchListItemTpl),

    events: {
      'click': 'clickedItem'
    },

    render: function () {
      // NOTE: this.model is just a data object, not a backbone Model object

      //show default image
      var modelT = this.model;
      var reg = /(null)|(user_default.jpg)/;
      var fullName = modelT.fullName.replace(/\s+/g,' ').split(" ");
      var nameAcronym;
      if (modelT.image && !reg.test(modelT.image)) {
        modelT.image = '<img class="user-photo dd-photo" src="' + modelT.image + '">';
      }else{
        if(fullName.length < 2){
          nameAcronym = fullName[0].substr(0,1);
        }else{
          nameAcronym = fullName[0].substr(0,1) + fullName[1].substr(0,1);
        }
        modelT.image = '<span class="user-photo dd-photo default-photo">' + nameAcronym.toUpperCase() + '</span>';
      }
      this.model = modelT;
      this.$el.html(this.template(this.model));

      return this;
    },

    clickedItem: function () {
      $('.Results').html('');
      if (this.model.isToPay) {
        if (this.model.group) {
          window.location.hash = '#payment/group/' + this.model.id;
        } else {
          this.$el.addClass('hidden');
          recipients[this.model.id] = this.model.fullName;
          var newNameTag = new InputNameTag({model: this.model});
          newNameTag.render();

          // Every time user clicks a search result, we refocus
          // input field in case user wants to enter new search
          $('.SearchUsers').focus();
        }

      } else if (this.model.groupManage) {
        // TODO: mixed use of data structure is probably a bad idea
        // Figure out a better approach
        recipients[this.model.id] = {
          fullName: this.model.fullName,
          image: this.model.image
        };

        console.log("Add user to group, user: ", this.model.id);
        var inputNameTag = new InputNameTag({model: this.model});
        inputNameTag.render();
      } else {
        if (this.model.group) {
          window.location.hash = '#payment/group/' + this.model.id;
        } else {
          window.location.hash = '#user/' + this.model.id;
        }
      }
      $('.SearchUsers').val('').focus();
    }
  });

  var InputNameTag = Base.View.extend({

    tagName: 'span',

    className: 'InputNameTag input-name-tag selected-result',

    template: Handlebars.compile('{{fullName}}&nbsp;&nbsp;x'),

    events: {
      'click': 'removeThisName'
    },

    render: function () {
      this.$el.html(this.template(this.model));
      $('.SelectedUsers').append(this.el);

      return this;
    },

    removeThisName: function () {
      console.log("Removing " + this.model.fullName);
      this.$el.remove();
      delete recipients[this.model.id];
      console.log(recipients);
      this.remove();

      // TODO: This code is getting repetitive, can we have a controller
      $('.SearchUsers').focus();
    }
  });

  return SearchPage;
});