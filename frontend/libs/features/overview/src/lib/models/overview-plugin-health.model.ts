/** Minimal shapes of the plugin endpoints the Overview health card consumes. */

export interface BackendPluginDescriptorRecord {
  readonly id: string;
  readonly status: 'ACTIVE' | 'DEGRADED' | 'UNTRUSTED' | string;
}

export interface BackendPluginDiagnosticsRecord {
  readonly installed: readonly BackendPluginDescriptorRecord[];
}

export interface PluginCanaryMetricRecord {
  readonly pluginId: string;
  readonly version: string;
  readonly promotable: boolean;
}

/** Aggregated plugin health for the Overview dashboard. */
export interface PluginHealth {
  readonly active: number;
  readonly degraded: number;
  readonly blocked: number;
}
