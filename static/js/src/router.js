/* globals define, require, console*/

'use strict';

define(function (require) {
  var
      $ = require('jquery'),

      Backbone = require('backbone'),
      bouncefix = require('bouncefix'),

      Base = require('base'),

      ActivityList = require('apps/activityList/scripts/views/activity_list'),
      ActivityPage = require('apps/activityList/scripts/views/activity_page'),
      HeaderBar = require('common/scripts/views/header_bar'),
      Navbar = require('common/scripts/views/navbar'),
      StandingPageView = require('apps/standingPage/scripts/views/standing_page'),
      RegistrationForm = require('apps/registerForm/scripts/views/register_form'),
      LoginForm = require('apps/registerForm/scripts/views/login_form'),
      PhoneNumVerifyPage = require('apps/registerForm/scripts/views/phone_verify_form'),
      AccountsPage = require('apps/manageAccounts/scripts/views/manage_accounts'),
      AddAccountForm = require('apps/manageAccounts/scripts/views/add_account_form'),
      AddCardForm = require('apps/manageAccounts/scripts/views/add_card_form'),
      WithdrawBalancePage = require('apps/makePayment/scripts/views/withdraw_balance'),
      MakePaymentPage = require('apps/makePayment/scripts/views/make_payment'),
      ProfilePage = require('apps/userProfile/scripts/views/user_profile'),
      SearchPage = require('apps/makeSearch/scripts/views/make_search'),
      GroupManager = require('apps/groupManager/scripts/views/group_manager'),
      MakeSettingsPage = require('apps/makeSettings/scripts/views/makeSettings'),
      MakePrivacySettingsPage = require('apps/makeSettings/scripts/views/makePrivacy'),
      MakeHelpPage = require('apps/makeHelp/scripts/views/makeHelp'),
      BlockedUserPage = require('apps/makeSettings/scripts/views/blockedUsers');


  var Router = Base.Router.extend({

    routes: {
      '': 'showHomepage',
      'register': 'showRegistrationPage',
      'login': 'showLoginPage',
      'activities': 'showActivitiesPage',
      'activities/:filter': 'showActivitiesPage',
      'activity/:trans_id': 'showActivityPage',
      'veriphone/:phoneNum': 'showPhoneNumVerifyPage',
      'search/:filter': 'showSearchPage',
      'payment': 'showPaymentPage',
      'payment/group/:gid': 'showPaymentPageForGroup',
      'payment/:uid': 'showPaymentPageToUser',
      'refresh/:redirectTo': 'refreshPage',
      'refresh/:redirectTo/:filter': 'refreshPage',
      'accounts': 'showAccounts',
      'accounts/new': 'addAccounts',
      'cards/new': 'addCard',
      'withdraw': 'withdrawBalances',
      'user/:uid': 'showProfilePage',
      'user/edit/:uid': 'editProfile',
      'logout': 'logoutAccount',
      'group/:filter': 'manageGroup',
      'group/:filter/:gid': 'manageGroup',
      'settings': 'showSettings',
      'settings/privacy':'privacy',
      'help': 'helpPage',
      'blocked/users': "blockedUsersPage",

      '*actions': 'showHomepage'
    },

    execute: function (callback, args, name) {
      // If not logged in, redirect to login page
      // TODO: make this work better
      var noLoginRequired = ['showHomepage', 'showRegistrationPage', 'showPhoneNumVerifyPage'];

      if (!localStorage.loggedInAs && noLoginRequired.indexOf(name) < 0) {
        window.location.hash = 'login';
      }

      // Set user's last page that visited
      var path;

      for (var key in this.routes) {
        if (this.routes[key] === name) {
          path = key;
          for (var i = 0; i < args.length; i++) {
            path = path.replace(/:\w+/, args[i]);
          }
          // break;
        }
      }

      localStorage.lastVisit = path;

      // args.push(parseQueryString(args.pop()));
      if (callback) callback.apply(this, args);
    },

    start: function () {
      console.log('Router started');
    }
  });

  function loadApp (heading, app, paneOpen) {
    $('#AppContainer')
      .html(heading.render().el)
      .append(app.render().el);

    if (paneOpen) {
      localStorage.paneOpen = true;
    }
  }

  var router = new Router();

  $(document).ready(function () {

    /**
     * Fix the ios web bounsing issue
     */
    bouncefix.add('app-wrapper');
    bouncefix.add('app-page');

    /**
     * Open the last page user has visited
     */
    if (localStorage.lastVisit) {
      window.location.hash = localStorage.lastVisit;
    }

    router.on('route:showHomepage', function () {
      var appStandingPage = new StandingPageView({
        centerImage: 'static/img/dindin_logo_with_txt.png',
        centerText: 'BEM-VINDO'
      });

      $('#AppContainer').html(appStandingPage.render().el)
                        .addClass('standing-page');
    });

    router.on('route:showRegistrationPage', function () {
      var regForm = new RegistrationForm();
      $('#AppContainer').html(regForm.render().el)
                        .removeClass('standing-page');
    });

    router.on('route:showLoginPage', function () {
      var loginForm = new LoginForm();
      $('#AppContainer').html(loginForm.render().el)
                        .removeClass('standing-page');
    });

    router.on('route:showPhoneNumVerifyPage', function (phoneNum) {
      var phoneVerifyPage = new PhoneNumVerifyPage();
      phoneVerifyPage.setData({phoneNum: phoneNum});
      $('#AppContainer').html(phoneVerifyPage.render().el);

    });

    router.on('route:showActivitiesPage', function (filter) {
      var header, activityList, config = {};

      /**
       * Toggle active tab based on the end point of current page,
       * tab should be className with the preceding '.': '.TabName'
       */
      if (filter === 'me') {
        config = {filter: 'me', tab: '.User'};
      } else if (filter === 'pending') {
        config = {filter: 'pending', tab: '.Pending'};
      } else if (filter === 'friends') {
        config = {filter: 'friends', tab: '.Global'};
      } else {
        config = {tab: '.Global'};
      }

      header = new HeaderBar({activeTab: config.tab});
      activityList = new ActivityList();

      $('#AppContainer').html(header.render().el)
                        .removeClass('standing-page');

      $('#AppContainer').append(activityList.render(config).el);
      $('.ActivityContainer').fadeOut(0).fadeIn();

      if (localStorage.paneOpen) {
        header.toggleMenuPane();
        delete localStorage.paneOpen;
      }

    });

    router.on('route:showActivityPage', function (trans_id) {
      var header = new HeaderBar();

      var activityPage = new ActivityPage({trans_id: trans_id});

      $('#AppContainer').html(header.render().el)
                        .removeClass('standing-page');

      $('#AppContainer').append(activityPage.render().el);

    });

    router.on('route:showPaymentPage', function () {
      var header = new HeaderBar(),
          paymentPage = new MakePaymentPage();

      $('#AppContainer').html(header.render().el)
                        .removeClass('standing-page');

      $('#AppContainer').append(paymentPage.render().el);

    });


    router.on('route:showPaymentPageForGroup', function (gid) {
      var header = new HeaderBar(),
          paymentPage = new MakePaymentPage();

      $('#AppContainer').html(header.render().el)
                        .removeClass('standing-page');

      $('#AppContainer').append(paymentPage.render({groupID: gid}).el);
    });


    router.on('route:showPaymentPageToUser', function (uid) {
      /**
       * Redirect user to make direct payment to the person he/she
       * chose
       */
      var header = new HeaderBar(),
          paymentPage = new MakePaymentPage({toID: uid});

      $('#AppContainer').html(header.render().el)
                        .removeClass('standing-page');

      $('#AppContainer').append(paymentPage.render().el);

    });

    router.on('route:showSearchPage', function (filter) {
      /**
       * filter: 'payment', 'addfriend'
       * @type {Navbar}
       */
      var navbar = new Navbar({
            pageName: 'PESQUISAR',
            pageIcon: 'fa fa-search',
            backUrl: 'activities'
          }),
          searchPage = new SearchPage({filter: filter});

      loadApp(navbar, searchPage, true);
    });

    router.on('route:showAccounts', function () {
      var navbar = new Navbar({
            pageName: 'CONTAS E CARTÕES',
            pageIcon: 'fa fa-credit-card-alt',
            backUrl: 'activities'
          }),
          accountsPage = new AccountsPage();

      loadApp(navbar, accountsPage, true);
    });

    router.on('route:addAccounts', function () {
      var navbar = new Navbar({
            pageName: 'ADICIONAR CONTA',
            pageIcon: 'fa fa-plus-square',
            backUrl: 'accounts'
          }),
          addAccountsPage = new AddAccountForm();

      loadApp(navbar, addAccountsPage, true);
    });

    router.on('route:addCard', function () {
      var navbar = new Navbar({
            pageName: 'ADICIONAR CARTÃO',
            pageIcon: 'fa fa-credit-card-alt',
            backUrl: 'accounts'
          }),
          addCardPage = new AddCardForm();

      loadApp(navbar, addCardPage, true);
    });

    router.on('route:withdrawBalances', function () {
      var navbar = new Navbar({
        pageName: 'TRANSFERIR PARA BANCO',
        pageIcon: '',
        backUrl: 'activities'
      }),
          withdrawBalancePage = new WithdrawBalancePage();

      loadApp(navbar, withdrawBalancePage, true);
    });

    router.on('route:showProfilePage', function (uid) {
      var pageName = '',
          pageIcon = '',
          navbar,
          profilePage;

      var config = {uid: uid};
      if (+uid === +localStorage.loggedInAs) {
        config.userSelf = true;
      }
      profilePage = new ProfilePage(config);

      navbar = new Navbar({
            pageName: pageName,
            pageIcon: pageIcon,
            backUrl: 'activities'
          });

      loadApp(navbar, profilePage, false);
    });

    router.on('route:editProfile', function (uid) {
        var profilePage = new ProfilePage({uid: localStorage.loggedInAs, userSelf: true}),
            pageName = 'EDITAR PERFIL',
            pageIcon = 'fa fa-user';

        var navbar = new Navbar({
          pageName: pageName,
          pageIcon: pageIcon,
          backUrl: 'activities'
        });

        profilePage = new ProfilePage({uid: uid, edit: true, userSelf: true});

        loadApp(navbar, profilePage, true);
    });

    router.on('route:logoutAccount', function () {
      localStorage.removeItem('loggedInAs');
      localStorage.removeItem('lastVisit');

      window.location.hash = '/';
    });

    router.on('route:manageGroup', function (filter, gid) {
      var pageName, pageIcon, pageImage, backUrl, moduleName, paneOpen, targetUrl;

      if (filter === 'create' || filter === 'createOnly') {
        pageName = 'NOVO GRUPO';
        pageIcon = 'fa fa-users';
        backUrl = '/search/payment';
        moduleName = 'createGroup';

        if (filter === 'createOnly') {
          targetUrl = '#group/all';
          backUrl = '#group/all';
        }

      } else if (filter === 'all') {
        pageName = 'GERENCIAR GRUPOS';
        pageImage = '/static/sprite/images/dd-icon-group-grey-01.png';
        backUrl = '/activities';
        moduleName = 'listGroups';
        paneOpen = true;
      } else if (filter === 'view') {
        pageName = 'VIEW GRUPO';
        backUrl = '#group/all';
        moduleName = 'viewGroup';
      } else if (filter === 'edit') {
        pageName = 'EDITAR GRUPO';
        backUrl = '#group/view/' + gid;
        moduleName = 'editGroup';
        paneOpen = false;
      }

      if (window.location.hash.match('fromfeed')) {
        backUrl = '#activities';
      }

      var navbar = new Navbar({
        pageName: pageName,
        pageIcon: pageIcon,
        backUrl: backUrl
      });

      var groupManagerPage = new GroupManager({module: moduleName, targetUrl: targetUrl, gid: gid, backUrl: backUrl});

      loadApp(navbar, groupManagerPage, paneOpen);
    });


    router.on('route:showSettings', function () {
      var navbar = new Navbar({
        pageName: 'AJUSTES',
        pageIcon: 'dd-icon-settings-grey-01 ico-size-32',
        backUrl: '#activities'
      });

      var paneOpen = true;

      var makeSettingsPage = new MakeSettingsPage();

      loadApp(navbar, makeSettingsPage, paneOpen);

    });

    router.on('route:privacy', function () {
      var navbar = new Navbar({
        pageName: 'PRIVACIDADE',
        pageIcon: 'dd-icon-privacy-grey-01 ico-size-32',
        backUrl: '#settings'
      });

      var paneOpen = true;

      var makeSettingsPage = new MakePrivacySettingsPage();

      loadApp(navbar, makeSettingsPage, paneOpen);

    });

    router.on('route:helpPage', function () {
      var navbar = new Navbar({
        pageName: 'ME AJUDA',
        pageIcon: 'dd-icon-help-grey-01 ico-size-32',
        backUrl: '#activities'
      });

      var paneOpen = true;

      var makeHelpPage = new MakeHelpPage();

      loadApp(navbar, makeHelpPage, paneOpen);

    });

     router.on('route:blockedUsersPage', function () {
      var navbar = new Navbar({
        pageName: 'USUÁRIOS BLOQUEADOS',
        pageIcon: 'dd-icon-block-grey-01 ico-size-32',
        backUrl: '#settings'
      });

      var paneOpen = true;

      var blockedUserPage = new BlockedUserPage();

      loadApp(navbar, blockedUserPage, paneOpen);

    });

    router.on('route:refreshPage', function (redirectTo, filter) {
      if (filter) {
        window.location.hash = redirectTo + '/' + filter;
      } else {
        window.location.hash = redirectTo;
      }
    });


    Backbone.history.start({root: '/'});

  });

  return router;


});