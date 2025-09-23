import { OpenAPIDefault } from '../shared/openapi/models/openapi-default.model';

interface SearchEndpointParameter {
  dataObjectName: string;
  searchRequestName: string;
  searchResponseName: string;
}

export function createSearchEndpoint(
  data: OpenAPIDefault,
  parameter: SearchEndpointParameter
) {
  const response = {};
  response[data.type] = {
    operationId: data.operationId,
    tags: data.tags,
    description: data.description,
    requestBody: {
      content: {
        'application/json': {
          schema: {
            $ref: `#/components/schemas/${parameter.searchRequestName}`,
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'OK',
        content: {
          'application/json': {
            schema: {
              $ref: `#/components/schemas/${parameter.searchResponseName}`,
            },
          },
        },
      },
      '400': {
        description: 'Bad request',
      },
      '500': {
        description: 'Something went wrong',
      },
    },
  };
  return response;
}
