export interface CreateUpdateGeneratorSchema {
  featureName: string;
  customizeNamingForAPI: boolean;
  serviceName: string;
  resource: string;
  createRequestName: string;
  createResponseName: string;
  updateRequestName: string;
  updateResponseName: string;
  createRequestPropertyName: string;
  createResponsePropertyName: string;
  updateRequestPropertyName: string;
  updateResponsePropertyName: string;
  standalone?: boolean;
}
