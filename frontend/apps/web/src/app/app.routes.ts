import { buildAppRoutesFromPluginManifests } from '@integration-hub/shared/ui';

import { PLATFORM_PLUGIN_MANIFEST } from './core/platform-plugin.manifest';

export const appRoutes = buildAppRoutesFromPluginManifests([PLATFORM_PLUGIN_MANIFEST], {
  defaultRedirectTo: 'overview',
});
