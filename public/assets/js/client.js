import { createApplication } from './shared/application.js';
import { createBookingFeature } from './booking/index.js';
import { createHistoryFeature } from './history/index.js';
const context = createApplication();
context.booking = createBookingFeature(context);
context.history = createHistoryFeature(context);
context.register('book', context.booking.render);
context.register('history', context.history.render);
async function init() {
  try {
    context.state.config = await context.api('config');
    context.$('#business-name').textContent = context.state.config.name;
    context.app.removeAttribute('aria-busy');
    const fragment = new URLSearchParams(location.hash.slice(1)).get('reserva');
    if (fragment) {
      const [id, token] = fragment.split('.'); context.reservations.remember({ id, token });
      history.replaceState(null, '', location.pathname); context.navigate('history');
    } else context.navigate('book');
  } catch (error) { context.startError(error, init); }
}
init();
