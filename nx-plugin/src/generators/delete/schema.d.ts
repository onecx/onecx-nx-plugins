export interface DeleteGeneratorSchema {
  featureName: string;
  customizeNamingForAPI: boolean;
  apiServiceName: string;
  resource: string;
  standalone?: boolean;
}
