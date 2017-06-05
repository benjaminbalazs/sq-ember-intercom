import Ember from 'ember';
import config from 'ember-get-config';

export default Ember.Service.extend({

    session: Ember.inject.service(),
    user: Ember.inject.service(),
    request: Ember.inject.service(),
    fastboot: Ember.inject.service(),

	//

	init() {

		this._super();

        if ( this.shouldinit() ) {

            if ( config.INTERCOM ) {

                if ( config.INTERCOM.app_id ) {

                    this.script();

                    if ( config.INTERCOM.debug === true ) {
                        this.set('debug', true);
                    }

                    this.set('id', config.INTERCOM.app_id);

                    // LISTEN TO USER TO BE LOADED
                    this.get('user').on('init', this, this.didUserInitiated);

                    //
                    this.get('session').on('logout', this, this.shutdown);

                    if ( config.INTERCOM.public === true ) {
                        this.boot();
                    }

                }

            }

        }

	},

    script() {

        var w=window;
        var ic=w.Intercom;

        if( typeof ic==="function" ){
            ic('reattach_activator');
            ic('update',intercomSettings);
        } else {
            var d=document;
            var i=function(){
                i.c(arguments);
            };
            i.q=[];
            i.c=function(args){i.q.push(args);};
            w.Intercom=i;
            function l(){
                var s=d.createElement('script');
                s.type='text/javascript';
                s.async=true;s.src='https://widget.intercom.io/widget/' + config.INTERCOM.app_id;
                var x=d.getElementsByTagName('script')[0];
                x.parentNode.insertBefore(s,x);
            }
            if(w.attachEvent){
                w.attachEvent('onload',l);
            }else{
                w.addEventListener('load',l,false);
            }
        }

    },

    //

    shouldinit() {
        return ( this.get('fastboot.isFastBoot') !== true && config.INTERCOM );
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

    pageview() {

        var self = this;

        Ember.run.later(function() {
            self.update();
        }, 500);

    },

    //

    didUserUpdated() {

        if ( this.get('current_language') !== this.get('user.model.language.identifier') ) {
            this.shutdown();
            this.boot();
            this.set('current_language', this.get('user.model.language.identifier') );
        } else {
            this.update();
        }

    },

    update() {

        if ( this.shouldinit() === true ) {

            var attributes = this.attributes();

            if ( attributes.email ) {

                this.debugger('update', attributes);
                window.Intercom('update', attributes);

            } else if ( config.INTERCOM.public === true ) {

                this.debugger('update');
                window.Intercom('update', {
                    language: this.get('user.language_identifier'),
                    language_override: this.get('user.language_identifier'),
                });

            }

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
        object.language_override = this.get('user.model.language.identifier');
        object.countrycode = this.get('user.model.countrycode.code');
        if ( this.get('user.model.citycode.code') ) {
            object.citycode = this.get('user.model.citycode.code');
        }
        object.ui_direction = this.get('user.model.ui_direction');
        //
        object.sites = this.get('user.model.sites.length');
        object.domains = this.get('user.model.domains.length');
        //object.subscriptions = this.get('user.model.subscriptions.length');
        //object.transactions = this.get('user.model.transactions.length');
        //
        object.total_spend = this.get('user.model.total_spend');
        //object.monthly_spend = this.get('user.model.monthly_spend');
        object.active_subscriptions = this.get('user.model.active_subscriptions.length');
        //object.cancelled_subscriptions = this.get('user.model.cancelled_subscriptions.length');
        //
        object.phone_number = this.get('user.model.phone_number');
        object.gender = this.get('user.model.gender');
        object.invitation_code = this.get('user.model.invitation_code.identifier');
        object.referral_code = this.get('user.model.referral_code.identifier');
        object.verified = this.get('user.model.verified');
        //
        object.utm_campaign = this.get('user.model.utm_campaign');
        object.utm_source = this.get('user.model.utm_source');
        object.utm_term = this.get('user.model.utm_term');
        object.utm_medium = this.get('user.model.utm_medium');
        object.utm_content = this.get('user.model.utm_content');
        //
        if ( this.get('user.model') ) {
            if ( this.get('user.model.google_user.id') ) {
                object.authentication = 'google';
            } else if ( this.get('user.model.facebook_user.id') ) {
                object.authentication = 'facebook';
            } else {
                object.authentication = 'email';
            }
        }

        window.language_identifier = object.language;

        return object;

    },

    boot() {

        if ( this.shouldinit() === false ) { return; }

        var data = { app_id: this.get('id') };

        //
        //this.set('current_language', data.language_override);

        // IF USER IS LOGGED OUT, BUT HAS LOGGED IN BEFORE
        if ( this.get('session.authenticated') === false ) {
            if ( this.get('session.credentials.email') ) {
                data.email = this.get('session.credentials.email');
            }
        }

        // MERGE USER DATA
        var object = this.attributes();
        for ( var param in object ) {
            if ( object[param] ) {
                data[param] = object[param];
            }
        }

        // NEED TO shutdownT DOWN IF REBOOTING
        if ( this.get('booted') ) {
            this.shutdown();
        }

        //
        window.Intercom('boot', data);
        this.debugger('boot', data);

        this.set('booted', true);

        //
        window.Intercom('onShow', this.onShow);

    },

    shutdown() {

        if ( this.shouldinit() ) {

            window.Intercom('shutdown');
            this.debugger('shutdown');
            this.set('booted', false);

        }

    },

    //

    onShow() {

        /*
        return;
        Ember.run.later(function() {

            var iframe = Ember.$('iframe[allowfullscreen]');

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
            console.log(iframe.contents());
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

            // BUTTON
            style = style + "#intercom-container .intercom-conversations-new-conversation-button { background-color: #6ABC50; border-radius: 5px; line-height: 40px; height: 40px; box-shadow: none; padding-left: 25px; padding-right: 25px; font-weight: normal; }";
            style = style + "#intercom-container .intercom-conversations-new-conversation-button span { text-transform:uppercase; background-image:none; padding-left: 0px; line-height: 40px; }";

            // LISTEN
            style = style + "#intercom-container .intercom-conversation-summary { border-top: 2px solid #f3f4f5 !important; }";
            style = style + "#intercom-container .intercom-conversation-summary:last-child { border-bottom: 2px solid #f3f4f5 !important; }";
            style = style + "#intercom-container .intercom-conversation-summary:first-child { border-top: 0px solid #f3f4f5 !important; }";

            //
            style = style + "#intercom-container .intercom-conversations-header, #intercom-container .intercom-conversation-body-profile { background-color: #6A7E9F !important; box-shadow:none !important; }";

            // MESSAGE BUBBLE
            style = style + "#intercom-container .intercom-comment-container-user .intercom-comment { background-color: #6A7E9F }";

            //
            iframe.contents().find("head").append(Ember.$("<style id='custom-intercom' type='text/css'>" +  style  + "</style>"));


        }, 100);
        */
    },

    // PUBLIC API --------------------------------------------------------------

    event(name, metadata) {

        if ( this.shouldinit() === false ) { return; }

        this.debugger('trackEvent', name, metadata);

        window.Intercom('trackEvent', name, metadata);

        var self = this;

        Ember.run.later(function() {
            self.update();
        }, 500);

    },

    //

    showNewMessage(content) {

        if ( this.shouldinit() === false ) { return; }

        if ( content ) {
            window.Intercom('showNewMessage', content);
        } else {
            window.Intercom('showNewMessage');
        }

    },

    debugger(name, action, data) {
        if ( this.get('debug') ) {
            if ( data ) {
                console.log('intercom:', name, action, data);
            } else {
                console.log('intercom:', name, action);
            }
        }
    },

});
