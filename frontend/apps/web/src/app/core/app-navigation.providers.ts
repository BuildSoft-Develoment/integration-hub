import { provideAppPluginManifests } from '@integration-hub/shared/ui';

import { PLATFORM_PLUGIN_MANIFEST } from './platform-plugin.manifest';

export const appNavigationProvider = provideAppPluginManifests([PLATFORM_PLUGIN_MANIFEST]);
