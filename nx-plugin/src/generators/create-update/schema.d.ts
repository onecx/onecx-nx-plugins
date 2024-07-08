export interface CreateUpdateGeneratorSchema {
  featureName: string;
  customizeNamingForAPI: boolean;
  apiServiceName: string;
  dataObjectName: string;
  createRequestName: string;
  createResponseName: string;
  updateRequestName: string;
  updateResponseName: string;
  standalone?: boolean;
}
