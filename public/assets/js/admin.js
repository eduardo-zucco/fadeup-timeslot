import { createApplication } from './shared/application.js';
import { createOperatorSession } from './admin/session.js';
import { createBookingFeature } from './booking/index.js';
import { createAdminFeature } from './admin/index.js';
const context = createApplication({ area: 'admin', session: createOperatorSession() });
context.booking = createBookingFeature(context);
context.admin = createAdminFeature(context);
context.register('admin', context.admin.render);
async function init() {
  try {
    context.state.config = await context.api('config');
    context.$('#business-name').textContent = context.state.config.name;
    try { await context.api('admin/session'); context.state.authenticated = true; }
    catch (error) { if (error.status !== 403) throw error; context.session.clear(); }
    context.app.removeAttribute('aria-busy'); context.navigate('admin');
  } catch (error) { context.startError(error, init); }
}
init();
