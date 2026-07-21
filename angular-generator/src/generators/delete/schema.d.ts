export interface DeleteGeneratorSchema {
  featureName: string;
  customizeNamingForAPI: boolean;
  serviceName: string;
  resource: string;
  standalone?: boolean;
}
