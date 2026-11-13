export interface ReactGeneratorSchema {
  name: string;
  appPrefix?: string;
  chatty?: boolean;
  styles?: 'primeflex' | 'tailwind';
  aiTool?: 'none' | 'copilot';
  stateManagement?: 'none' | 'zustand';
}
