/* globals require */
'use strict';

require.config({
  paths: {
    jquery:     '../lib/jquery.min',
    underscore: '../lib/underscore.min',
    backbone:   '../lib/backbone.min',
    handlebars: '../lib/handlebars.min',
    text:       '../lib/text',
    templates:  'templates/',
    transition:   '../lib/transition',
    dropdown:   '../lib/dropdown',
    bouncefix:  '../lib/bouncefix'
  },
  shim: {
    underscore: {
      exports: '_'
    },
    backbone: {
      deps: [
        'underscore',
        'jquery'
      ],
      exports: 'Backbone'
    },
    handlebars: {
      exports: 'Handlebars'
    }
  }
});