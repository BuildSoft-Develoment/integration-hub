import { CanActivateFn } from '@angular/router';
import {
  authGuard,
  capabilityGuard,
} from '@integration-hub/core/services';

import {
  APP_SECTION_CAPABILITIES,
  AppSectionKey,
} from './app-section-access.policy';

export function appSectionGuard(section: AppSectionKey): CanActivateFn {
  const capability = APP_SECTION_CAPABILITIES[section];
  return capability ? capabilityGuard(capability) : authGuard;
}
