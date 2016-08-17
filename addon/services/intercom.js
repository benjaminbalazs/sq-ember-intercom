import Ember from 'ember';

export default Ember.Service.extend({

    session: Ember.inject.service(),
    user: Ember.inject.service(),
    request: Ember.inject.service(),

	//

	init() {

		this._super();

        // CONFIG//
		var config = Ember.getOwner(this)._lookupFactory('config:environment');

        if ( config.INTERCOM ) {

            if ( config.INTERCOM.app_id ) {

                this.set('id', config.INTERCOM.app_id);

                // LISTEN TO USER TO BE LOADED
                this.get('user').on('init', this, this.didUserInitiated);

                //
                this.get('session').on('logout', this, this.shutdown);

            }

        }

	},

    //

    didUserInitiated() {

        if ( this.get('user.model.id') ) {
            this.didUserLoad();
        } else {
            this.get('user.model').addObserver('id', this, this.didUserLoad);
        }

    },

    //

    didUserLoad() {

        var self = this;

        if ( this.get('user.model.id') ) {

            this.get('user.model').removeObserver('id', this, this.didUserLoad);

            return this.getHash().then(function() {

                self.boot();

                self.get('user.model').on('didUpdate', self, self.didUserUpdated);

            });

        }

    },

    //

    getHash() {

        var self = this;
        var user_id = this.get('user.model.id');

        return this.get('request').GET('intercom/' + user_id).then(function(data) {

            self.set('hash', data.hash);

            return Ember.RSVP.Promise.resolve(data.hash);

        });

    },

    //

    didUserUpdated() {

        if ( this.get('current_language') !== this.get('user.model.language.identifier') ) {
            this.shutdown();
            this.boot();
            this.set('current_language', this.get('user.model.language.identifier') );
        } else {
            window.Intercom('update', this.attributes());
        }

    },

    attributes() {

        var object = {};

        object.user_hash = this.get('hash');

        object.email = this.get('user.model.email');
        object.user_id = this.get('user.model.id');
        object.name = this.get('user.model.full_name');
        object.first_name = this.get('user.model.first_name');
        object.last_name = this.get('user.model.last_name');
        //
        object.language = this.get('user.model.language.identifier');
        object.countrycode = this.get('user.model.countrycode.code');
        object.ui_direction = this.get('user.model.ui_direction');
        //
        object.sites = this.get('user.model.sites.length');
        object.domains = this.get('user.model.domains.length');
        object.subscriptions = this.get('user.model.subscriptions.length');
        object.transactions = this.get('user.model.transactions.length');
        //
        object.total_spend = this.get('user.model.total_spend');
        object.monthly_spend = this.get('user.model.monthly_spend');
        object.monthly_spend_domain = this.get('user.model.monthly_spend_domain');
        object.monthly_spend_site = this.get('user.model.monthly_spend_site');
        object.active_subscriptions = this.get('user.model.active_subscriptions.length');
        object.cancelled_subscriptions = this.get('user.model.cancelled_subscriptions.length');
        //
        object.phone_number = this.get('user.model.phone_number');
        object.gender = this.get('user.model.gender');
        object.invitation_code = this.get('user.model.invitation_code.identifier');
        object.referral_code = this.get('user.model.referral_code.identifier');
        object.verified = this.get('user.model.verified');
        object.phone_number = this.get('user.model.phone_number');
        //
        object.utm_campaign = this.get('user.model.utm_campaign');
        object.utm_source = this.get('user.model.utm_source');
        object.utm_term = this.get('user.model.utm_term');
        object.utm_medium = this.get('user.model.utm_medium');
        object.utm_content = this.get('user.model.utm_content');
        //
        object.checkout_card_countrycode = this.get('user.model.checkout_card_countrycode');
        object.checkout_card_bankname = this.get('user.model.checkout_card_bankname');
        object.checkout_card_kind = this.get('user.model.checkout_card_kind');
        object.checkout_card_type = this.get('user.model.checkout_card_type');

        return object;

    },

    boot() {

        var data = { app_id: this.get('id') };

        //

        if ( this.get('user.storage.language_identifier') ) {
            var identifier = this.get('user.storage.language_identifier');
            data.language_override = identifier;
        } else {
            data.language_override = 'en';
        }

        this.set('current_language', data.language_override);

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

        // NEED TO shutdownT DOWN IF REBOOTING
        if ( this.get('booted') ) {
            this.shutdown();
        }

        //
        window.Intercom('boot', data);
        this.set('booted', true);

    },

    shutdown() {

        window.Intercom('shutdown');
        this.set('booted', false);

    },

    // PUBLIC API --------------------------------------------------------------

    event(name, metadata) {
        window.Intercom('trackEvent', name, metadata);
    },

    //

    showNewMessage(content) {
        if ( content ) {
            window.Intercom('showNewMessage', content);
        } else {
            window.Intercom('showNewMessage');
        }
    }

});
