/* globals define, require, console, confirm, alert */
'use strict';
define(function (require) {
  var
      $ = require('jquery'),
      Handlebars = require('handlebars'),

      Base = require('base'),
      settings = require('settings'),

      MESSAGES = require('common/messages'),

      SearchPage = require('apps/makeSearch/scripts/views/make_search'),

      UserModel = require('common/scripts/models/user_model'),
      TransactionModel = require('common/scripts/models/transaction_model'),
      MakePaymentTpl = require('text!apps/makePayment/templates/make_payment.html'),

      KeyPadView = require('apps/makePayment/scripts/views/input_keypad');


  var MakePaymentForm = Base.Views.FormView.extend({

    className: 'MakePaymentView app-page has-nav',

    events: {
      'click .PayMoney': 'payMoneyTo',
      'click .ChargeMoney': 'chargeMoneyFrom',
      'click .EnterAmount': 'loadKeyPad',
      'click .backPayment': 'backUserPicker',
      'click .AddUsers': 'backUserPicker',
      'keyup .SearchUsers': function (e) {
        if (e.which === 13) {
          return this.loadKeyPad();
        }
      },
      'keyup .TransNote': function (e) {
        if (e.which === 13) {
          $('.TransNote').blur();
          return false;
        }
      }
    },

    template: Handlebars.compile(MakePaymentTpl),

    initialize: function (options) {
      if (options && 'toID' in options) {
        this.toID = options.toID;
      }

      return this;
    },

    render: function (config) {
      var _this = this;
      config = config || {};

      this.$el.html(this.template());

      this.transModel = new TransactionModel();

      if (this.toID) {
        this.transModel.set({
          to: this.toID
        });
        this.userModel = new UserModel();
        this.userModel.fetch({
          url: settings.urlRoot + '/user/' + this.toID,
          success: function () {
            _this.loadKeyPad();
          },
          error: function () {
            alert(MESSAGES.ALERT.noPayee);
          }
        });
      } else if (config.groupID) {
        this.groupID = config.groupID;
        $.getJSON(settings.urlRoot + '/u/' + localStorage.loggedInAs + '/social/groups/' + config.groupID, function (data) {
          _this.loadKeyPad({groupID: data.id, groupName: data.name, members: data.members});
        });
      } else {
        this.loadUserPicker();

      }

      return this;
    },

    loadUserPicker: function (render) {
      var previousRecipients = {};

      if (this.searchPage) {
        previousRecipients = this.searchPage.getRecipients();
      }
      this.searchPage = new SearchPage({recipients: previousRecipients});

      this.$el.find('.PaymentForm').addClass('hidden');

      if(render === true && !this.groupID){
        console.log("back");
      }else{
        this.$el.find('.UserPicker').html(this.searchPage.render().el);
      }

      return this;
    },

    loadKeyPad: function (config) {
      var _this = this;
      var recipientNamesTpl,
          recipients,
          attNum = 0,
          pplCount = 0;

      config = config || {};

      recipientNamesTpl = '{{#each recipients}}<span class="input-name-tag"><em>{{this}}</em></span>{{/each}}';

      try {
        recipients = this.searchPage.getSearchResults();
        recipientNamesTpl = '{{#each recipients}}<span class="input-name-tag"><em>{{this}}</em></span>{{/each}}<span class="AddUsers plus">+</span>';
      } catch (e) {
        if (this.userModel) {
          recipients = {
            values: [this.userModel.get('id')],
            texts: [[this.userModel.get('firstName'), this.userModel.get('lastName')].join(' ')]
          };
          recipientNamesTpl = '{{#each recipients}}<span class="input-name-tag"><em>{{this}}</em></span>{{/each}}<span class="AddUsers add">+</span>';
        } else if (config.groupID) {
          // Execute when user is paying/charging a group
          this.recipients = recipients = {};
          recipients.values = [config.groupID];
          recipients.texts = ['Grupo: ' + config.groupName];
          pplCount = config.members.length;
        }
      }

      this.keyPad = new KeyPadView({model: this.transModel});
      this.keyPad.pplCount = pplCount;
      this.keyPad.searchPage = this.searchPage;
      // TODO: Show recipient names in a white box
      this.$el.find('.RecipientNames').html(Handlebars.compile(recipientNamesTpl)({recipients: recipients.texts}));
      this.$el.find('.InputKeypad').html(this.keyPad.render().el);

      if (this.$el.find('.UserPicker').css('display') === 'block') {
        this.$el.find('.UserPicker').hide();
        _this.$el.find('.PaymentForm').removeClass('hidden');
      } else {
        this.$el.find('.UserPicker').remove();
        this.$el.find('.PaymentForm').removeClass('hidden');
      }

      /**
       * Auto focus on the description field.
       */
      $('.TransNote').val($('.TransNote').val().trim()).focus();

      return this;
    },

    /**
     * Send payment info to the server which contains:
     *   from: <int> sender's id
     *   to:   <int array> recipients ids
     *   note: <str>
     *   type_en: <'payment' or 'charge'>
     * @return status : success or error
     */
    payMoneyTo: function () {
      var _this = this,
          recipients,
          note = this.$el.find('.TransNote').val().trim(),
          message,
          queryBalance,
          isDefault,
          paymentAmount = this.transModel.get("amount"),
          number,
          total;

      if (!note) {
        alert(MESSAGES.ALERT.mustEnterNote);
        window.location.hash = "#payment";
        return;
      }


      /**
       * In case direct payment cause error cuz
       * search page is not being used
       */
      try {
        recipients = this.searchPage.getSearchResults();
      } catch (e) {
        if (this.userModel) {
          recipients = {
            values: [this.userModel.get('id')],
            texts: [[this.userModel.get('firstName'), this.userModel.get('lastName')].join(' ')]
          };
        }
      }

      if (!recipients) {
        recipients = this.recipients;
      }
      number = recipients.texts.length;
      total = paymentAmount*number;
      if(total <= 0){
        alert(MESSAGES.ALERT.noPayAmount);
        window.location.hash = "#payment";
        return;
      }
      if(!number){
        alert(MESSAGES.ALERT.noRecipients);
        return;
      }

      // TODO: Show page loader before querying balance
      this.showPageLoader();

      /**
       * Make sure user has enough balance before submitting
       * payment
       */
      this.userModelBalance = new UserModel({id: localStorage.loggedInAs});
      this.userModelBalance.fetch({
        url: settings.urlRoot + '/me/' + this.userModelBalance.id,
        success: function(model,data){
          if( total <= parseInt(data.balance)){
            queryBalance = true;
          }else{
            queryBalance = false;
          }

          _this.transModel.set({
            'from': localStorage.loggedInAs,
            'to': recipients.values,
            'note': note,
            'type_en': 'payment',
            'group_trans': _this.groupID ? true : false
          });
          if(queryBalance){
            message = MESSAGES.CONF.makeTransaction.replace('{{recipients}}', recipients.texts)
              .replace('{{amount}}', _this.transModel.formatNum(_this.transModel.get('amount')))
              .replace('{{note}}', note);

            if (confirm(message)) {

              _this.transModel.save(null, {
                success: function (data) {
                  alert(MESSAGES.ALERT.confirmedTransaction);
                  window.location.hash = 'activities';
                  _this.hidePageLoader();
                },
                error: function (req, status, err) {
                  try {
                    alert(status.responseJSON.error);
                  } catch (e) {
                    alert(e);
                  }

                  _this.hidePageLoader();
                  return false;
                }
              });
            } else {
              /**
               * If user cancels payment
               */
              _this.hidePageLoader();
            }
          }else{
            if(confirm(MESSAGES.ALERT.notEnoughBalance)){
              _this.userModelAccounts = new UserModel({id: localStorage.loggedInAs});
              _this.userModelAccounts.fetch({
                url: settings.urlRoot + '/u/'+ _this.userModelAccounts.get('id') +'/accounts/all',
                success: function(model,data){
                  //console.log(data);

                  if(data.length){
                    for(var i = 0;i < data.length;i++){
                      if(data[i].isDefault === true){
                        isDefault = true;
                        break;
                      }
                    }
                  }else{
                    isDefault = false;
                  }
                  //console.log(isDefault);

                  if(isDefault){//if there is an account with `isDefault: true`
                    _this.transModel.save(null, {
                      url: settings.urlRoot + '/transfer-from-bank',
                      success: function (data) {
                        console.log(data)
                      },
                      error: function (req, status, err) {
                        alert(MESSAGES.ALERT.paymentNotCompleted);
                        return false;
                      }
                    });
                  }else{
                    alert(MESSAGES.ALERT.noDefaultAccount);
                    window.location.hash = "#accounts";
                  }
                },
                error: function(){
                  console.log("For accounting errors");
                  return false;
                }
              });
            }
          }
        },
        error: function(){
          console.log("error");
          return false;
        }
      });

    },

    chargeMoneyFrom: function () {
      var _this = this,
          note = this.$el.find('.TransNote').val().trim(),
          recipients,
          message;

      if (!note) {
        alert(MESSAGES.ALERT.mustEnterNote);
        return;
      }

      /**
       * In case direct payment cause error cuz
       * search page is not being used
       */
      try {
        recipients = this.searchPage.getSearchResults();
      } catch (e) {
        if (this.userModel) {
          recipients = {
            values: [this.userModel.get('id')],
            texts: [[this.userModel.get('firstName'), this.userModel.get('lastName')].join(' ')]
          };
        }
      }

      if (!recipients) {
        recipients = this.recipients;
      }
      this.transModel.set({
        'from': recipients.values,
        'to': localStorage.loggedInAs,
        'note': note,
        'type_en': 'charge',
        'group_trans': _this.groupID ? true : false
      });

      message = MESSAGES.CONF.makeCharge.replace('{{recipients}}', recipients.texts)
        .replace('{{amount}}', this.transModel.formatNum(this.transModel.get('amount')))
        .replace('{{note}}', note);

      if (confirm(message)) {
        this.showPageLoader();

        this.transModel.save(null, {
          success: function (data) {
            alert(MESSAGES.ALERT.confirmedTransaction);
            window.location.hash = 'activities';
            _this.hidePageLoader();
          },
          error: function (req, status, err) {
            try {
              alert(status.responseJSON.error);
            } catch (e) {
              alert(e);
            }
            _this.hidePageLoader();
            return false;
            }
          });
      }
    },
    backUserPicker: function(){
      var _this = this;
      this.loadUserPicker(true);

      this.$el.find('.PaymentForm').hide(function(){
        _this.$el.find('.UserPicker').show();
      });

    }

  });

  return MakePaymentForm;

});