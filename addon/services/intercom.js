import Ember from 'ember';

export default Ember.Service.extend({

    session: Ember.inject.service(),
    user: Ember.inject.service(),

	//

	init() {

		this._super();

        // CONFIG
		var config = this.container.lookupFactory('config:environment');

        if ( config.INTERCOM ) {

            if ( config.INTERCOM.api_id ) {

                this.set('id', config.INTERCOM.api_id);

                //
                this.get('session').on('logout', this, this.shutdown);

                // LISTEN TO USER TO BE LOADED
                this.get('user').on('init', this, this.didUserLoad);

                // BOOT IF USER IS NOT authenticated
                if ( !this.get('session.authenticated') ) {
                    this.boot();
                }

            }

        }

	},

    didUserLoad() {

        this.boot();

        this.get('user.model').on('didUpdate', this, this.didUserUpdated);

    },

    didUserUpdated() {

        window.Intercom('update', this.attributes());

    },

    attributes() {
        var object = {};
        object.email = this.get('user.model.email');
        object.user_id = this.get('user.model.id');
        object.name = this.get('user.model.full_name');
        object.first_name = this.get('user.model.first_name');
        object.last_name = this.get('user.model.last_name');
        object.language = this.get('user.model.language.identifier');
        object.language_override = this.get('user.model.language.identifier');
        object.countrycode = this.get('user.model.countrycode.code');
        object.ui_direction = this.get('user.model.ui_direction');
        object.sites = this.get('user.model.sites.length');
        object.domains = this.get('user.model.domains.length');
        object.subscriptions = this.get('user.model.subscriptions.length');
        return object;
    },

    boot() {

        var data = { app_id: this.get('id') };

        // IF USER IS LOGGED OUT, BUT HAS LOGGED IN BEFORE
        if ( this.get('session.authenticated') === false ) {
            if ( this.get('session.credentials.email') ) {
                data.email = this.get('session.credentials.email');
            }
        }

        // MERGE USER DATA
        var object = this.attributes();
        for ( var param in object ) {
            data[param] = object[param];
        }

        // NEED TO SHIT DOWN IF REBOOTING
        if ( this.get('boot') ) {
            this.shutdown();
        }

        //
        window.Intercom('boot', data);
        this.set('boot', true);

    },

    shutdown() {

        window.Intercom('shutdown');
        this.set('boot', false);

    },

    // PUBLIC API

    trackEvent(name, metadata) {
        window.Intercom('trackEvent', name, metadata);
    }

});
