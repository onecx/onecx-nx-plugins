export interface SearchGeneratorSchema {
  featureName: string;
  customizeNamingForAPI: boolean;
  apiServiceName: string;
  resource: string;
  searchRequestName: string;
  searchResponseName: string;
  standalone?: boolean;
}
