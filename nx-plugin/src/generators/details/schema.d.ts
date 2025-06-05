export interface DetailsGeneratorSchema {
  featureName: string;
  customizeNamingForAPI: boolean;
  apiServiceName: string;
  dataObjectName: string;
  getByIdResponseName: string;
  editMode: boolean;
  allowDelete: boolean;
  standalone?: boolean;  
  updateRequestName: string;
  updateResponseName: string;
}
