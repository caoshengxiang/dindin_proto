/* globals define */
'use strict';

define (function (require) {
  var
      Handlebars = require('handlebars'),
      Base = require('base'),
      settings = require('settings'),
      settingsListTpl = require('text!apps/makeSettings/templates/settings_privacy_list.html');


  // code reference:
  // 0: VOCE
  // 5: AMIGOS
  // 9: TODOS
  var privacySetting = {
    "options": [0, 5, 9],
    "selected" : 9
  };

  var MakeSettingsList = Base.View.extend({

    template: Handlebars.compile(settingsListTpl),

    className: 'MakeSettingsList settings-list dd-list app-page has-nav',

    events: {
      'click .PriListItem' : 'secletedList'
    },

    render: function (data) {

      

      var data = {
        items: [
          {'codename': 'setting9', 'code':'9', 'name': 'TODOS ', 'ico': 'dd-icon-public-darkgreen-01  ico-size-32' , 'bgstyle': 'pri-firstlist'},
          {'codename': 'setting5', 'code':'5', 'name': 'AMIGOS ', 'ico': 'dd-icon-group-grey-01  ico-size-32', 'bgstyle':''},
          {'codename': 'setting0', 'code':'0', 'name': 'VOCÊ ', 'ico': 'dd-icon-private-grey-01  ico-size-32', 'bgstyle': ''}
          
        ]
      };
      this.$el.html(this.template(data));

      return this;
    },
    secletedList: function(e){

      var ico = [
        {"green":"dd-icon-public-darkgreen-01  ico-size-32" , "grey":"dd-icon-public-grey-01 ico-size-32"},
        {"green":"dd-icon-group-darkgreen-01 ico-size-32", "grey":"dd-icon-group-grey-01  ico-size-32"},
        {"green":"dd-icon-private-lightgreen-01 ico-size-32", "grey":"dd-icon-private-grey-01 ico-size-32"}
      ]


      var target = e.currentTarget;
      privacySetting.selected = parseInt($(target).attr("code"));
//console.log(privacySetting.selected)
      $(target).siblings(".PriListItem").removeClass("pri-firstlist");
      $(target).addClass("pri-firstlist");

      //change ico
      this.$el.find(".setting0 .priIco").removeClass(ico[2].green).addClass(ico[2].grey);
      this.$el.find(".setting5 .priIco").removeClass(ico[1].green).addClass(ico[1].grey);
      this.$el.find(".setting9 .priIco").removeClass(ico[0].green).addClass(ico[0].grey);
      if(privacySetting.selected == 0){
        this.$el.find(".setting0 .priIco").removeClass(ico[2].grey).addClass(ico[2].green); 
      }else if(privacySetting.selected == 5){
        this.$el.find(".setting5 .priIco").removeClass(ico[1].grey).addClass(ico[1].green);
      }else if(privacySetting.selected == 9){
        this.$el.find(".setting9 .priIco").removeClass(ico[0].grey).addClass(ico[0].green);
      }
    }
  });

  return MakeSettingsList;

});