/* globals define */
'use strict';
define (function (require) {
  var
      $ = require('jquery'),
      _ = require('underscore'),
      Base = require('base'),
      Handlebars = require('handlebars'),

      settings = require('settings'),
      MESSAGES = require('common/messages'),
      bouncefix = require('bouncefix'),

      UserModel = require('common/scripts/models/user_model'),
      TransactionCollection = require('common/scripts/collections/transactions'),

      userProfileTpl = require('text!apps/userProfile/templates/user_profile.html'),
      editProfileTpl = require('text!apps/userProfile/templates/edit_profile.html'),
      ActivityList = require('apps/activityList/scripts/views/activity_list'),
      ActivityListItem = require('apps/activityList/scripts/views/activity_list_item');


  var UserProfile = Base.View.extend({

    className: 'UserProfile app-page has-nav',

    template: Handlebars.compile(userProfileTpl),

    events: {
      'click .EnterPaymentPage': 'enterPaymentPage',
      'change .NewPhoto': 'updatePhoto',
      'click .AddFriend': 'addFriend',
      'click .ActivityTab': 'showActivitiesPro',
      'click .SaveProfile': 'saveProfileChanges',
      'click .EditProfile': 'editUserProfile'
    },

    initialize: function (options) {
      var _this = this;
      this.data = {};

      this.extendEvents();
      this.user = new UserModel();
      // this.user.on('change', function () {
      //   _this.render();
      // });

      if ('uid' in options) {
        this.uid = options.uid;
      }

      if ('userSelf' in options) {
        this.data.userSelf = true;
      } else {
        this.$el.addClass('background-light');
      }

      if (options.edit) {
        this.edit = true;
      }

      return this;
    },

    render: function () {
      if (this.edit) {
        this.template = Handlebars.compile(editProfileTpl);
      }
      // this.$el.html(this.template(this.data));
      this.loadUserProfile();

      return this;
    },

    loadUserProfile: function () {
      this.showPageLoader();

      var _this = this;

      this.user.fetch({
        url: settings.urlRoot + '/user/' + this.uid + '?verifyFriends=' + localStorage.loggedInAs,

        success: function (model) {
          var data = model.toJSON();
          data.userSelf = _this.data.userSelf;
          _this.$el.html(_this.template(data));
          _this.hidePageLoader();

          if (!_this.edit) {
            /**
             *  If not user self, write this user's name to the
             *  navbar
             */
            $('.Navbar .PageInfo').addClass('name-bar');
            $('.Navbar .PageName').html(model.get('fullName'));
            $('.Navbar .page-ico').addClass('hidden');

            bouncefix.add('ios-scroll');

            return _this.loadActivityList();
          }
        },
        error: function (req, status) {
          try {
            alert(status.responseJSON.error);
          } catch (e) {
            alert(e);
          }
          _this.hidePageLoader();
          return false;
        }
      });
    },

    enterPaymentPage: function () {
      window.location.hash = 'payment/' + this.uid;
    },

    updatePhoto: function () {
      // this.$el.find('.NewPhoto').click();
      var _this = this,
          photo = this.$el.find('.NewPhoto')[0].files[0],
          formData = new FormData();

      if (!photo.type.match('image.*')) {
        alert('Your new photo has to be an image file');
        return false;
      }

      if (photo.size / 1000 > 1000) {
        /**
         * Reject all files greater than 1MB,
         * Silently fail
         */
        return false;
      }

      this.showPageLoader();
      formData.append('photos', photo, photo.name);

      $.ajax({
        url: settings.urlRoot + '/me/' + localStorage.loggedInAs + '/photo',
        type: 'POST',
        data: formData,
        cache: false,
        contentType: false,
        processData: false,
        success: function (data) {
          _this.render();
        },
        error: function (req, status) {
          try {
            alert(status.responseJSON.error);
          } catch (e) {
            console.log(e);
            alert(MESSAGES.ALERT.photoFail);
          }

          return false;
          }
      });

    },

    addFriend: function () {
      var data = {uid2: this.uid, uid1: localStorage.loggedInAs};

      $.ajax({
        type: 'POST',
        url: settings.urlRoot + '/friendship/new',
        contentType: 'applicatin/json',
        data: JSON.stringify(data),
        success: function (data) {
          console.log(data);
          alert(MESSAGES.ALERT.friendly);
        },
        error: function (req, status) {
          console.log(status);
          alert(MESSAGES.ALERT.unfriendly);
          return false;
        }
      });
    },

    showActivitiesPro: function (e) {
      var $targetTab = $(e.currentTarget);
      var activityList = new ActivityList();
      this.$el.find('.active.ActivityTab').removeClass('active');
      $targetTab.addClass("active");
    },

    editUserProfile: function () {
      window.location.hash = "#user/edit/" + localStorage.loggedInAs;
    },

    saveProfileChanges: function () {
      var newFullName = this.$el.find('.FullName').val().trim(),
          newEmail = this.$el.find('.Email').val().trim().toLowerCase(),
          newPhoneNum = this.$el.find('.PhoneNum').val().trim();

      var nameCombo = newFullName.split(' ');
      var newFirstName, newLastName;
      if (nameCombo.length > 1) {
        newLastName = nameCombo.pop();
        newFirstName = nameCombo.join(' ');
      }
      this.user.set({
        firstName: newFirstName,
        lastName: newLastName,
        email: newEmail,
        phoneNum: newPhoneNum
      });

      if (_.isEmpty(this.user.changedAttributes())) {
          window.location.hash = "#user/" + localStorage.loggedInAs;
          return;
      }

      this.user.save(null, {
        url: settings.urlRoot + '/me/' + localStorage.loggedInAs + '/profile',
        data: JSON.stringify(this.user.changedAttributes()),
        contentType: 'application/json',
        success: function (response) {
          console.log(response);
          window.location.hash = "#user/" + localStorage.loggedInAs;
        },
        error: function (req, status, err) {
          if (status.responseJSON.error === 'emailExists') {
            alert(MESSAGES.ALERT.emailExists);
          } else {
            alert(MESSAGES.ALERT.cantSaveProfile);
          }
        }
      });

      return this;
    },

    loadActivityList: function () {
      var _this = this;

      this.collection = new TransactionCollection();
      _this.showContentLoader();

      var cachedDOM = [];
      this.collection.fetch({
        url: settings.urlRoot + '/activities',
        success: function (collection) {
          for (var i = 0; i < collection.models.length; i++) {
            var itemView = new ActivityListItem({model: collection.models[i]});
            cachedDOM.push(itemView.render().el);
          }

          _this.$el.find('.ActivityContainer').html(cachedDOM);
          _this.hideContentLoader();
        }
      });
    }

  });

  return UserProfile;
});