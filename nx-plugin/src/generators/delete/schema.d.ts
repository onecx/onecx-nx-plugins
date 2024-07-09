export interface DeleteGeneratorSchema {
  featureName: string;
  customizeNamingForAPI: boolean;
  apiServiceName: string;
  dataObjectName: string;
  standalone?: boolean;
}
