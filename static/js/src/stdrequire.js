/* globals require */
'use strict';https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo_top_ca79a146.png

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