export interface SearchGeneratorSchema {
  apiServiceName: string;
  customizeNamingForAPI: boolean;
  existStrategy: 'skip';
  featureName: string;
  resource: string;
  searchRequestName: string;
  searchResponseName: string;
  standalone?: boolean;
}
