export interface CreateUpdateGeneratorSchema {
  featureName: string;
  customizeNamingForAPI: boolean;
  apiServiceName: string;
  dataObjectName: string;
  creationRequestName: string;
  creationResponseName: string;
  updateRequestName: string;
  updateResponseName: string;
}
