export interface ReactGeneratorSchema {
  name: string;
  chatty?: boolean;
  styles?: 'primeflex' | 'tailwind';
  aiTool?: 'none' | 'agents' | 'copilot' | 'both';
}
