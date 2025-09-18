import { OpenAPIDefault } from '../shared/openapi/models/openapi-default.model';

interface CreateEndpointParameter {
  dataObjectName: string;
  createRequestName: string;
  createResponseName: string;
}

export function createCreateEndpoint(
  data: OpenAPIDefault,
  parameter: CreateEndpointParameter
) {
  const response = {};
  response[data.type] = {
    operationId: data.operationId,
    tags: data.tags,
    description: data.description,
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            $ref: `#/components/schemas/${parameter.createRequestName}`,
          },
        },
      },
    },
    responses: {
      '201': {
        description: `New ${parameter.dataObjectName} created`,
        headers: {
          Location: {
            required: true,
            schema: {
              type: 'string',
              format: 'url',
            },
          },
        },
        content: {
          'application/json': {
            schema: {
              $ref: `#/components/schemas/${parameter.createResponseName}`,
            },
          },
        },
      },
      '400': {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ProblemDetailResponse',
            },
          },
        },
      },
    },
  };
  return response;
}

interface UpdateEndpointParameter {
  dataObjectName: string;
  updateRequestSchema: string;
  updateResponseSchema: string;
}

export function createUpdateEndpoint(
  data: OpenAPIDefault,
  parameter: UpdateEndpointParameter
) {
  const response = {};
  response[data.type] = {
    operationId: data.operationId,
    tags: data.tags,
    description: data.description,
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
        },
      },
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            $ref: `#/components/schemas/${parameter.updateRequestSchema}`,
          },
        },
      },
    },
    responses: {
      '204': {
        description: `${parameter.dataObjectName} updated`,
        headers: {
          Location: {
            required: true,
            schema: {
              type: 'string',
              format: 'url',
            },
          },
        },
        content: {
          'application/json': {
            schema: {
              $ref: `#/components/schemas/${parameter.updateResponseSchema}`,
            },
          },
        },
      },
      '400': {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ProblemDetailResponse',
            },
          },
        },
      },
      '404': {
        description: `${parameter.dataObjectName} not found`,
      },
    },
  };
  return response;
}