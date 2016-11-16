/* globals define, require, console */
'use strict';

define(function (require) {
  var MESSAGES = {
    'CONF': {
      'makeTransaction': 'Are you sure you want to pay {{recipients}} \n each in the amount of R$ {{amount}} \n for {{note}}?',
      'makeCharge': 'Are you sure you want to charge {{recipients}} \n each in the amount of R$ {{amount}} \n for {{note}}?',
      'makeWithdraw': 'Are you sure you want to withdraw R$ {{amount}} to your bank account?',
      'deleteAccount': 'Are you sure you want to delete this account? You may need to choose a new default payment method.',
      'deleteGroup': 'Are you sure you want to delete this group?',
      'leaveGroup': 'Are you sure you want to leave this group?',
      'removeMember': 'Are you sure you want to remove this member?'
    },
    'ALERT': {
      'confirmedTransaction': 'Your recipients will be notified to confirm your payment/charge',
      'canceledTransaction': 'Your transaction is canceled, you can revise transaction details and try again',
      'cantSaveProfile': 'Sorry, we cannot save your new profile data at this moment',
      'emailExists': 'Sorry, this email is registered by another account.',
      'mustSelectAccount': 'You must select a bank account/credit card to load your balance',
      'mustAboveZero': 'You must make payment/charge with amount greater than R$ 0,00',
      'withdrawSuccess': 'You have successfully withdrawn to your bank account, your payment will be posted in 2 - 5 days',
      'mustEnterNote': 'Please enter a short note, you can type text or emoji',
      'noPayee': 'Desculpe, não podemos encontrar a pessoa que você quer pagar dinheiro para . Por favor, procure por essa pessoa manualmente reiniciando um pagamento',
      'photoFail': 'Sorry, we are unable to update your profile image.',
      'photoTooBig': 'Sorry, the photo you are trying to upload is too big. Please make sure your photo is under 1MB. You may crop it locally to reduce size.',
      'friendly': 'Your friend request is submitted.',
      'unfriendly': 'Sorry, we cannot process your friends request',
      'activityPageNotLoad': 'Sorry, we cannot load the content for this activity',
      'paymentNotCompleted': 'Sorry, we cannot finish your transaction. Please check that you have enough balance if you are paying.',
      'verifyCodeIncorrect': 'Sorry, the verification code you entered is incorrect.',
      'cardsCannotLoad': 'Sorry, we are unable to load your credit card list',
      'accountsCannotLoad': 'Sorry, we are unable to load your bank account list',
      'unableSetDefault': 'Sorry, we are unablet to set this payment method as default right now. Please try again later',
      'unlikable': 'Sorry, we cannot process your like/unlike request, please try again later.',
      'unableDeleteAccount': 'Sorry, we cannot delete this account right now. Please try again later.',
      'invalid': 'Some of the information you entered is invalid, please check.',
      'unableAddCard': 'Sorry, we failed to add this credit card to your account, please double check you have entered valid info.',
      'unableAddAccount': 'Sorry, we failed to add this bank account to your accoutn, please make sure you have entered correct credentials.',
      'notEnoughBalance': "You don't have enough balance in your account, do you want to pay with your default associated bank account?",
      'noDefaultAccount': 'you do not have a default payment account, please add one or make an existing one default',
      'noRecipients': "You haven't add the recipient, please add the recipient!",
      'noPayAmount': "Please enter the amount you want to pay",
      'userExists': 'You have already registered, please log in instead',
      'groupCreationFail': 'We are not able to create a group with your given name, please try again or change to another name'
    }
  };

  return MESSAGES;
});