export interface FeatureGeneratorSchema {
  name: string;
  customizeNamingForAPI: boolean;
  resource: string;
  standalone?: boolean;
}
