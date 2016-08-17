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
        window.language_identifier = object.language = this.get('user.model.language.identifier');
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

        //
        window.Intercom('onShow', this.onShow);

        //

        //
        //this.showNewMessage();

    },

    shutdown() {

        window.Intercom('shutdown');
        this.set('booted', false);

    },

    //

    onShow() {

        Ember.run.later(function() {

            var iframe = Ember.$('iframe[data-reactid=".0.1.0.$=10.0"]');

            // FONTS

            var robotoFontStyle = 'font-family: "Roboto", sans-serif !important;';
            var messiriFontStyle = 'font-family: "El Messiri", sans-serif !important;';

            var directionStyle;
            var fontStyle;

            if ( window.language_identifier === 'ar' || window.language_identifier === 'ur' || window.language_identifier === 'fa' ) {
                directionStyle = 'direction: ' + 'rtl';
                fontStyle = messiriFontStyle;
            } else {
                directionStyle = 'direction: ' + 'ltr';
                fontStyle = robotoFontStyle;
            }

            // BODY
            var body = iframe.contents().find('body');
            body.attr('dir', 'rtl');

            //
            var style = '';
            style = style + "body {" + fontStyle + directionStyle + "}";

            // DEFAULT
            style = style + "#intercom-container a, #intercom-container abbr, #intercom-container acronym, #intercom-container address, #intercom-container applet, #intercom-container article, #intercom-container aside, #intercom-container audio, #intercom-container b, #intercom-container big, #intercom-container blockquote, #intercom-container button, #intercom-container canvas, #intercom-container caption, #intercom-container center, #intercom-container cite, #intercom-container code, #intercom-container dd, #intercom-container del, #intercom-container details, #intercom-container dfn, #intercom-container div, #intercom-container div.form, #intercom-container dl, #intercom-container dt, #intercom-container em, #intercom-container fieldset, #intercom-container figcaption, #intercom-container figure, #intercom-container footer, #intercom-container form, #intercom-container h1, #intercom-container h2, #intercom-container h3, #intercom-container h4, #intercom-container h5, #intercom-container h6, #intercom-container header, #intercom-container hgroup, #intercom-container i, #intercom-container iframe, #intercom-container img, #intercom-container input, #intercom-container input[type], #intercom-container ins, #intercom-container kbd, #intercom-container label, #intercom-container legend, #intercom-container li, #intercom-container mark, #intercom-container menu, #intercom-container nav, #intercom-container object, #intercom-container ol, #intercom-container p, #intercom-container pre, #intercom-container q, #intercom-container s, #intercom-container samp, #intercom-container section, #intercom-container small, #intercom-container span, #intercom-container strike, #intercom-container strong, #intercom-container sub, #intercom-container summary, #intercom-container sup, #intercom-container table, #intercom-container tbody, #intercom-container td, #intercom-container textarea, #intercom-container tfoot, #intercom-container th, #intercom-container thead, #intercom-container time, #intercom-container tr, #intercom-container tt, #intercom-container u, #intercom-container ul, #intercom-container var, #intercom-container video {" + fontStyle + "}";

            // ADMIN NAME
            style = style + "#intercom-container .intercom-team-profile-full-admin-name, #intercom-container .intercom-admin-profile-compact-admin-name {" + robotoFontStyle + "}";

            // INPUT FIELD
            style = style + "#intercom-container .intercom-team-profile-full-intro span, #intercom-container .intercom-composer, #intercom-container .intercom-composer textarea, #intercom-container .intercom-composer pre, #intercom-container .intercom-composer textarea::-webkit-input-placeholder, #intercom-container .intercom-composer textarea .placeholder {" + fontStyle + directionStyle + "}";

            // MESSAGE
            style = style + "#intercom-container .intercom-conversation-summary-body-text-summary, #intercom-container .intercom-block.intercom-block-paragraph, #intercom-container intercom-snippet-body, #intercom-container .intercom-block-heading {" + fontStyle + directionStyle + "}";

            //
            iframe.contents().find("head").append(Ember.$("<style id='custom-intercom' type='text/css'>" +  style  + "</style>"));


        }, 100);

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
