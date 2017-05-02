/* jshint node: true */
'use strict';

module.exports = {

      name: 'sq-ember-intercom',

      included: function(app) {

        this._super.included(app);

      },

      isDevelopingAddon: function() {
          return true;
      }

};
