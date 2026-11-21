export type ModuleCategory =
  | 'page'
  | 'data-source'
  | 'indicator'
  | 'visualization'
  | 'procurement-category'
  | 'api'
  | 'language'
  | 'reporting'
  | 'community'
  | 'civic-extension';
export interface ObraModule {
  id: string;
  name: string;
  description: string;
  version: string;
  category: ModuleCategory;
  dependencies: string[];
  capabilities: string[];
  routes?: { path: string; label: string }[];
  enabled: boolean;
  dataContracts: string[];
}
export class ModuleRegistry {
  private modules = new Map<string, ObraModule>();
  register(m: ObraModule) {
    if (this.modules.has(m.id)) throw new Error(`Duplicate module: ${m.id}`);
    this.modules.set(m.id, m);
  }
  active() {
    return [...this.modules.values()].filter((m) => m.enabled);
  }
  get(id: string) {
    return this.modules.get(id);
  }
}
