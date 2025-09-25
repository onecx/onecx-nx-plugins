export interface CreateUpdateGeneratorSchema {
  featureName: string;
  customizeNamingForAPI: boolean;
  apiServiceName: string;
  resource: string;
  createRequestName: string;
  createResponseName: string;
  updateRequestName: string;
  updateResponseName: string;
  standalone?: boolean;
}
