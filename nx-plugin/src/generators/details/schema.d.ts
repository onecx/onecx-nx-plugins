export interface DetailsGeneratorSchema {
  featureName: string;
  customizeNamingForAPI: boolean;
  apiServiceName: string;
  resource: string;
  getResponseName: string;
  editMode: boolean;
  allowDelete: boolean;
  standalone?: boolean;  
  updateRequestName: string;
  updateResponseName: string;
}
