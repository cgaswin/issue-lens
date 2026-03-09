import { createRoot, Root } from 'react-dom/client';
import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root';
import App from '../App';

export interface PanelMountHandle {
  mount: () => void;
  remove: () => void;
}

export async function createPanelMountHandle(ctx: any): Promise<PanelMountHandle> {
  const ui = await createShadowRootUi(ctx, {
    name: 'issue-lens-panel',
    position: 'overlay',
    onMount: (container: HTMLElement) => {
      const root = createRoot(container);
      root.render(<App />);
      return root;
    },
    onRemove: (root: Root | undefined) => {
      root?.unmount();
    },
  });

  return {
    mount: () => ui.mount(),
    remove: () => ui.remove(),
  };
}
