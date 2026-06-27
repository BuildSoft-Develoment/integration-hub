import { APP_SECTION_CAPABILITIES } from './app-section-access.policy';

describe('APP_SECTION_CAPABILITIES', () => {
  it('should allow operational users to open process execution flows', () => {
    expect(APP_SECTION_CAPABILITIES.processes).toBe('operate');
    expect(APP_SECTION_CAPABILITIES.executions).toBe('operate');
  });

  it('should keep payment rule management restricted to administrators', () => {
    expect(APP_SECTION_CAPABILITIES.paymentRules).toBe('admin');
  });

  it('should use explicit read capability for audit surfaces', () => {
    expect(APP_SECTION_CAPABILITIES.audit).toBe('audit-read');
    expect(APP_SECTION_CAPABILITIES.schedules).toBe('audit-read');
  });
});
