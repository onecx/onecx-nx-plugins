export interface FeatureGeneratorSchema {
  customizeNamingForAPI: boolean;
  existStrategy: 'skip';
  name: string;
  resource: string;
  standalone?: boolean;
}
