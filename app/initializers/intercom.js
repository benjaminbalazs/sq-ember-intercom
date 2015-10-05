import IntercomService from '../services/intercom';

export function initialize (app) {

	app.register('service:intercom', IntercomService);

    app.inject('route', 'intercom', 'service:intercom');
    app.inject('adapter', 'intercom', 'service:intercom');
    app.inject('component', 'intercom', 'service:intercom');
    app.inject('controller', 'intercom', 'service:intercom');

}

export default {
    name: 'intercom',
    initialize: initialize
}
