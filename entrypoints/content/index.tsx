import './style.css';
import { getOrCreateIssueLensController } from './core/controller.ts';

export default defineContentScript({
  matches: ['*://github.com/*'],
  cssInjectionMode: 'ui',
  runAt: 'document_end',

  async main(ctx) {
    const controller = getOrCreateIssueLensController(ctx);
    await controller.start();

    ctx.onInvalidated(() => {
      controller.dispose();
    });
  },
});
