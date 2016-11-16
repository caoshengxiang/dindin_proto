/* globals define, console, require, alert */
'use strict';

define(function (require) {
  var
      Handlebars = require('handlebars'),
      Base = require('base'),
      MESSAGES = require('common/messages'),
      UserModel = require('common/scripts/models/user_model'),
      RegisterFormTpl = require('text!apps/registerForm/templates/register_form.html'),
      privacyPolicy = require('text!apps/registerForm/templates/remos.html'),
      privacyPolitica = require('text!apps/registerForm/templates/politica.html');

  var RegisterForm = Base.Views.FormView.extend({

    className: 'RegisterFormPage app-page welcome-page',

    events: {
      'submit': 'submitRegisterForm',
      'click .Back': 'returnToHome',
      'click .OK': 'moreInfo',
      'input .cpfNum': 'formatCPFNum',
      'input .phoneNum': 'formatPhoneNum',
      'keypress .email': 'moreInfoKeypress',
      'click .termosECon': 'termosEConFun',
      'click .PoliDP': 'PoliDPFun',
      'click .backForm': 'backFormFun'
    },

    template: Handlebars.compile(RegisterFormTpl),

    initialize: function () {
      this.extendEvents();
    },

    render: function () {
      this.$el.html(this.template());

      return this;
    },

    submitRegisterForm: function (e) {
      var _this = this;

      e.preventDefault();

      this.showPageLoader();

      try {
        var newUser = new UserModel({
          firstName: this.$el.find('.firstName').val(),
          lastName: this.$el.find('.lastName').val(),
          email: this.$el.find('.email').val(),
          password: this.$el.find('.password').val(),
          phoneNum: this.$el.find('.phoneNum').val().replace(/[\(\)-]/g,""),
          cpf: this.$el.find('.cpfNum').val().replace(/[.-]/g,"")
        });

        if (!newUser.simpleValidate()) {
          alert("Some of the info you entered are incorrect, please check and make sure they are correct.");
          this.hidePageLoader();
          return false;
        }

        newUser.save(null, {
          success: function (data) {
            // TODO: save user session inside localStorage
            localStorage.loggedInAs = data.id;
            window.location.hash = 'veriphone/' + newUser.attributes.phoneNum;
            _this.hidePageLoader();
          },
          error: function (req, status, err) {
            var errorCode;

            _this.hidePageLoader();
            if (status.responseJSON) {
              errorCode = status.responseJSON.error;
              alert(MESSAGES.ALERT[errorCode]);
            } else {
              alert('We are unable to process your registration right now, please try again later.');
            }
          }
        });

      } catch (err) {
        this.hidePageLoader();
        console.log(err);
        return alert('Please make sure your information is valid.');
      }
    },

    returnToHome: function () {
      window.location.hash = '';
    },

    moreInfo: function(){    
      this.$el.find(".registerPage1").css("display","none");
      this.$el.find(".registerPage2").css("display","block");
    },

    moreInfoKeypress: function(e){ 
      if(e.which === 13){
        e.preventDefault();
        this.$el.find(".registerPage1").css("display","none");
        this.$el.find(".registerPage2").css("display","block");
      }
    },

    formatCPFNum: function(){
      var num = this.$el.find('.cpfNum').val().replace(/[.-]/g,""),
          formatNum = '';
      if(num.length > 3){
        if(num.length <= 6){
          formatNum = num.substr(0,3) + '.' + num.substr(3,3);
        }else if(num.length <= 9){
          formatNum = num.substr(0,3) + '.' + num.substr(3,3) + '.' + num.substr(6,3);
        }else{
          formatNum = num.substr(0,3) + '.' + num.substr(3,3) + '.' + num.substr(6,3) + '-' + num.substr(9);
        }
        //console.log(formatNum);
        this.$el.find('.cpfNum').val(formatNum);
      }
    },
    formatPhoneNum: function(){
      var num = this.$el.find('.phoneNum').val().replace(/[\(\)-]/g,""),
          formatNum ='';
      if(num.length>2){
        formatNum = '(' + num.substr(0,2) + ')' + num.substr(2);
        if(num.length === 10){
          formatNum = '(' + num.substr(0,2) + ')' + num.substr(2,4) + '-' + num.substr(6,4);
        }else if(num.length >= 11){
          formatNum = '(' + num.substr(0,2) + ')' + num.substr(2,5) + '-' + num.substr(7);
        }
        //console.log(formatNum);
        this.$el.find('.phoneNum').val(formatNum);
      }
    },
    termosEConFun: function(){
      this.$el.find(".registerPage2").css("display","none");
      this.$el.css("background","#fff"); 
      this.$el.append(Handlebars.compile(privacyPolicy));
      this.$el.find(".page-header").css({"background":"#003a42","color":"#fff"});  
   },
    PoliDPFun: function(){
      this.$el.find(".registerPage2").css("display","none");
      this.$el.css("background","#fff"); 
      this.$el.append(Handlebars.compile(privacyPolitica));
      this.$el.find(".page-header").css({"background":"#003a42","color":"#fff"});  
    },
    backFormFun: function(){
      this.$el.find(".registerPage2").css("display","block");

      this.$el.find(".textRemos").css("display","none");
      this.$el.find(".textPolitica").css("display","none");

      this.$el.css("background","#003a42"); 
      this.$el.find(".page-header").css({"background":"#fff","color":"#5D6058"});  
    }

  });

  return RegisterForm;
});