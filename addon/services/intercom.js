import Ember from 'ember';

export default Ember.Service.extend({

	//

	init() {

		this._super();

		var config = this.container.lookupFactory('config:environment');

        if ( config.APP.intercom_api_id ) {
            this.set('id', config.APP.intercom_api_id);
        }

        //if ( this.get('session') )

        this.boot();

	},

    boot() {

        var data = { app_id: this.get('id') };

        window.Intercom('boot', data);


        /*
        window.Intercom('boot', {
        app_id: "q9bd0tq7",
        name: "Nikola Tesla", //
        email: "nikola@example.com", //
        created_at: 1312182000 // 
      });
      */


    }

});
