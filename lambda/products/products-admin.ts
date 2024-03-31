import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { ProductRepository } from "/opt/nodejs/productsLayer";

const productsTableName = process.env.PRODUCTS_DDB_TABLE_NAME!;
const dynamoDbClient = new DocumentClient();
const productRepository = new ProductRepository(
  dynamoDbClient,
  productsTableName
);



export async function handler(
  event: APIGatewayProxyEvent,
  context: Context
  ): Promise<APIGatewayProxyResult> {
  const allowedMethods = ["PUT", "POST", "DELETE"];

  const allowedResources = ["/products", "/products/{id}"];

  type AllowedMethods = "PUT" | "POST" | "DELETE";

  type AllowedResources = "/products" | "/products/{id}";

  const method = event.httpMethod as AllowedMethods;

  const resource = event.resource as AllowedResources;

  if (!allowedResources.includes(resource)) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        message: "Not Found",
      }),
    };
  }

  if (!allowedMethods.includes(method)) {
    return {
      statusCode: 405,
      body: JSON.stringify({
        message: "Method Not Allowed",
      }),
    };
  }

  const defaultResponseError = {
    statusCode: 500,
    body: JSON.stringify({
      message: "Internal Server Error",
    }),
  };

  const lambdaRequestId = context.awsRequestId;

  const apiRequestId = event.requestContext.requestId;


  const body = event.body ? JSON.parse(event.body!) : {};

  const productId = event.pathParameters?.id;

  console.log(
    "Lambda Request Id:",
    lambdaRequestId +
      " - " +
      resource +
      " - " +
      method +
      " - " +
      "API Request Id:",
    apiRequestId + " - " + "Body:",
    body + " - " + "Path Parameters:",
    productId,
    " - " + "Event:",
    event
  );

  const mapEventsResources = {
    "/products": (method: "POST") => {
      const mapMethodsFunctions = {
        POST: async () => {
          const productCreated = await productRepository.createProduct(body);
          return {
            statusCode: 201,
            body: JSON.stringify({
              message: "Hello from Products Fetch Lambda! POST /products",
              product: productCreated,
            }),
          };
        },
      };

      return mapMethodsFunctions[method]();
    },
    "/products/{id}": (method: "PUT" | "DELETE") => {
      const mapMethodsFunctions = {
        PUT: async () => {
          const productUpdated = await productRepository.updateProduct({
            productId: productId!,
            ...body,
          });
          return {
            statusCode: 200,
            body: JSON.stringify({
              message:
                "Hello from Products Fetch Lambda! PUT /products/" + productId,
              product: productUpdated,
            }),
          };
        },
        DELETE: async () => {
          const productDeleted = await productRepository.deleteProduct(
            productId!
          );
          return {
            statusCode: 200,
            body: JSON.stringify({
              message:
                "Hello from Products Fetch Lambda! DELETE /products/" +
                productId,
              product: productDeleted,
            }),
          };
        },
      };

      return mapMethodsFunctions[method]();
    },
  };

  // @ts-ignore - TS doesn't know that resource is a key of mapEventsResources object
  // that method is a key of the object returned by mapEventsResources[resource]
  try {
    const response = mapEventsResources[resource](method as never);

    return response || defaultResponseError;
  } catch (error) {
    console.error("Error fetching products", error);
    return {
      ...defaultResponseError,
      body: JSON.stringify({
        message: "Error fetching products",
        error: error,
      }),
    };
  }
}
