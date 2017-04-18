/* jshint node: true */
'use strict';

module.exports = {

      name: 'sq-ember-intercom',

      included: function(app) {

        this._super.included(app);

        if ( !process.env.EMBER_CLI_FASTBOOT ) {
            app.import('vendor/intercom.js');
        }

      },

      isDevelopingAddon: function() {
          return true;
      }

};
