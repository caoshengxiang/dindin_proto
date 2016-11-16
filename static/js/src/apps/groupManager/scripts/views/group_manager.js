/* global define */
'use strict';

define(function (require) {

  var
      $ = require('jquery'),
      Base = require('base'),
      settings = require('settings'),
      MESSAGES = require('common/messages'),
      Handlebars = require('handlebars'),
      SearchPage = require('apps/makeSearch/scripts/views/make_search'),
      groupManTpl = require('text!apps/groupManager/templates/group_manager.html'),
      groupListTpl = require('text!apps/groupManager/templates/group_list.html'),
      groupMemberItemTpl = require('text!apps/groupManager/templates/group_member_item.html');


  var GroupManager = Base.View.extend({

    className: 'GroupManager group-manager app-page has-nav',

    events: {
      // 'click': 'loadSelectedUser',
      'click .Remove': 'removeSelectedMember',
      'click .Submit': 'submitForm',
      'change .NewPhoto': 'updatePhoto',
      'click .RemoveGroup': 'removeGroup',
      'click .LeaveGroup': 'leaveGroup',
      'click .CancelEdit': 'cancelEditing'
    },

    initialize: function (config) {
      var tpl;

      this.config = config;

      if (config.module === 'createGroup') {
        tpl = groupManTpl;
      } else if (config.module === 'listGroups') {
        tpl = groupListTpl;
      } else if (config.module === 'viewGroup') {
        tpl = groupManTpl;
        this.data = {viewGroup: true};
      } else if (config.module === 'editGroup') {
        tpl = groupManTpl;
        this.data = {editGroup: true};
      }

      this.template = Handlebars.compile(tpl);
    },

    render: function () {
      this.$el.html(this.template(this.data));

      if (this.config.module === 'createGroup') {
        this.searchPage = new SearchPage({filter: 'groupManage'});
        this.$el.find('.SearchMember').html(this.searchPage.render().el);
      } else if (this.config.module === 'listGroups') {
        this.getGroups();
      } else if (this.config.module === 'viewGroup') {
        this.getGroup(this.config.gid);
      } else if (this.config.module === 'editGroup') {
        this.getGroup(this.config.gid, {verify: true});
      }

      return this;
    },

    // removeSelectedMember: function (e) {
    //   var $selectedMember = $(e.target).parentsUntil('.SelectedMembers').first();
    //   var uid = $selectedMember.attr('data-id');

    //   this.searchPage.removeRecipient(uid);
    // },

    submitForm: function () {
      var _this = this;
      var groupName = this.$el.find('.GroupName').val().trim();
      var memberIDs = this.searchPage.getSearchResults().values;
      var photo = this.$el.find('.NewPhoto')[0].files[0];
      var callbackFunc;

      var postData = {
        groupName: groupName,
        members: memberIDs
      };

      if (photo) {
        if (!photo.type.match('image.*')) {
          alert('Your new photo has to be an image file');
          return false;
        }

        if (photo.size / 1000 > 1000) {
        /**
         * Reject all files greater than 1MB,
         * Silently fail
         */
          console.log('File too big');
          return false;
       }

       /**
        * This callbackfunction sends the new photo to update
        * the group with id == gid
        */
       callbackFunc = function (gid) {
        var formData = new FormData();
        formData.append('photos', photo, photo.name);
        $.ajax({
          url: settings.urlRoot + '/me/' + localStorage.loggedInAs + '/photo/group/' + gid,
          type: 'POST',
          data: formData,
          cache: false,
          contentType: false,
          processData: false,
          success: function (data) {
            // _this.render();
            console.log('Image successfully uploaded');
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
       };
      }

      /**
       * The AJAX call to submit group information.
       */
      var postUrl = settings.urlRoot + '/u/' + localStorage.loggedInAs + '/social/groups/';
      if (this.config.module === 'editGroup') {
        postUrl += this.config.gid;
        this.config.targetUrl = '#group/view/' + this.config.gid;
      } else {
        postUrl += 'create';
      }

      this.showContentLoader();

      $.ajax({
        type: 'POST',
        url: postUrl,
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(postData),
        success: function (data) {
          /**
           * If group creation succeeded, call function to
           * upload group image.
           */
          if (callbackFunc) {
            callbackFunc(data.id);
          }
          _this.hideContentLoader();
          if (_this.config.targetUrl) {
            window.location.hash = _this.config.targetUrl;
          } else {
            window.location.hash = 'payment/group/' + data.id;
          }
        },
        error: function (req, status) {
          console.error("error");
          _this.hideContentLoader();
          alert(MESSAGES.ALERT.groupCreationFail);
        }
      });
    },

    updatePhoto: function () {
      /**
       * If this group is already created, update photo directly,
       * otherwise, just show the photo and hold on to it until
       * user clicks OK.
       */
      var input = this.$el.find('.NewPhoto')[0];

      if (input.files && input.files[0]) {
        var reader = new FileReader();

        reader.onload = function (e) {
          $('.dd-photo.temp-image').attr('src', e.target.result).removeClass('hidden');
        };

        reader.readAsDataURL(input.files[0]);
      }
    },

    getGroups: function () {
      var _this = this;

      this.showContentLoader();

      $.ajax({
        url: settings.urlRoot + '/u/' + localStorage.loggedInAs + '/social/groups',
        type: 'GET',
        dataType: 'json',
        success: function (data) {
          console.log(data);
          for (var i = 0; i < data.length; i++) {
            data[i].image = settings.urlRoot + data[i].image;
          }
          _this.$el.css({overflow: 'scroll'});
          _this.$el.html(_this.template({groups:data}));
          _this.hideContentLoader();
        },
        error: function (req, status, err) {
          console.log('Unable to get groups');
        }
      });
    },

    getGroup: function (gid, options) {
      var _this = this;
      var options = options || {};
      var extraArg = options.verify ? '?verify=true' : '';

      $.ajax({
        url: settings.urlRoot + '/u/' + localStorage.loggedInAs + '/social/groups/' + this.config.gid + extraArg,
        type: 'GET',
        dataType: 'json',
        success: function (data) {
          if (_this.config.module === 'viewGroup') {
            data.viewGroup = true;
            _this.$el.addClass('background-light');
          } else if (_this.config.module === 'editGroup') {
            data.editGroup = true;
          }

          /* Show group name on navbar and center */
          $('.PageInfo').addClass('name-bar');
          $('.PageName').text(data.name);

          data.image = settings.urlRoot + data.image;
          _this.$el.html(_this.template(data));
          /**
           *  For editing group members, we also need to load
           *  a search module to allow adding members.
           */
          /**
           * TODO: there are too many IFs, try organizing them.
           */
          if (_this.config.module === 'editGroup') {
            _this.searchPage = new SearchPage({filter: 'groupManage'});
            _this.$el.find('.SearchMember').html(_this.searchPage.render().el);
          }

          var memberListItem;
          var cachedDom = [];
          for (var i = 0, model; i < data.members.length; i++) {
            model = data.members[i];
            model.imageUrl = settings.urlRoot + model.imageUrl;
            model.gid = data.id;
            memberListItem = new GroupMemberItem({model: model});

            cachedDom.push(memberListItem.render().el);
          }

          _this.$el.find('.SelectedMembers').html(cachedDom);
        },
        error: function () {
          console.error('Error');
        }
      });
    },

    removeGroup: function (e) {
      e.preventDefault();

      var _this = this;
      var target = e.currentTarget;
      var gid = $(target).attr('data-id');

      if (confirm(MESSAGES.CONF.deleteGroup)) {
        this.showContentLoader();
        $.ajax({
          url: settings.urlRoot + '/u/' + localStorage.loggedInAs + '/social/groups/' + gid,
          type: 'DELETE',
          success: function (data) {
            console.log(data);
            _this.$el.find('.dd-list-item[data-id="' + gid + '"]').remove();
            _this.hideContentLoader();
          },
          error: function (req, status, err) {
            console.debug('Error removing group');
            _this.hideContentLoader();
          }
        });
      }

      return false;
    },

    leaveGroup: function (e) {
      var _this = this;
      var gid = $(e.currentTarget).attr('data-id');

      if (confirm(MESSAGES.CONF.leaveGroup)) {
        this.showContentLoader({color: '#003A42'});
        $.ajax({
          url: settings.urlRoot + '/u/' + localStorage.loggedInAs + '/social/groups/out/' + gid,
          type: 'POST',
          success: function (data) {
            console.log(data);
            _this.hideContentLoader();
            window.location.hash = 'group/all';

          },
          error: function () {
            _this.hideContentLoader();
            console.log('Error: cannot leave group');
          }
        });
      }
      return false;
    },

    cancelEditing: function () {
      if (this.config.backUrl) {
        window.location.hash = this.config.backUrl;
      } else {
        window.location.hash = '#group/all';
      }
    }
  });

  var GroupMemberItem = Base.View.extend({

    className: 'GroupMemberItem group-member-item dd-row dd-list-item',

    events: {
      'click .Remove': 'removeItem'
    },

    template: Handlebars.compile(groupMemberItemTpl),

    render: function () {
      this.$el.html(this.template(this.model));
      this.$el.attr('data-id', this.model.id);

      return this;
    },

    removeItem: function () {
      if (confirm(MESSAGES.CONF.removeMember)) {
        var _this = this;
        console.log('Deleting ', this.model);
        var postUrl = settings.urlRoot + '/u/' + this.model.uid + '/social/groups/out/' + this.model.gid;

        this.showContentLoader();

        $.ajax({
          url: postUrl,
          type: 'POST',
          data: {},
          success: function (data) {
            console.log('data');
            _this.$el.remove();
            _this.showContentLoader();
          },
          error: function () {
            _this.showContentLoader();
            console.error('Cannot remove user from group.');
          }
        });
      }
    }
  });

  return GroupManager;

});
