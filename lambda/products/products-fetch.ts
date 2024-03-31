import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { ProductRepository } from "/opt/nodejs/productsLayer";
import {
  captureAWS,
} from "aws-xray-sdk";

captureAWS(require("aws-sdk"));

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
  const allowedMethods = ["GET"];

  const allowedResources = ["/products"];

  const method = event.httpMethod as "GET";

  const resource = event.resource as "/products";

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

  const lambdaRequestId = context.awsRequestId;

  const apiRequestId = event.requestContext.requestId;

  console.log(
    "Lambda Request Id:",
    lambdaRequestId +
      " - " +
      resource +
      " - " +
      method +
      " - " +
      "API Request Id:",
    apiRequestId
  );

  const defaultResponseError = {
    statusCode: 500,
    body: JSON.stringify({
      message: "Internal Server Error",
    }),
  };

  const mapEventsResources = {
    "/products": (method: "GET") => {
      const mapMethodsFunctions = {
        GET: async () => {
          const products = await productRepository.getProducts();
          return {
            statusCode: 200,
            body: JSON.stringify({
              message: "Hello from Products Fetch Lambda! GET /products",
              products,
            }),
          };
        },
      };

      return mapMethodsFunctions[method]();
    },
    "/products/{id}": (method: "GET") => {
      const mapMethodsFunctions = {
        GET: async () => {
          const product = await productRepository.getProductById(
            event.pathParameters?.id!
          );
          return {
            statusCode: 200,
            body: JSON.stringify({
              message: `Hello from Products Fetch Lambda! GET /products/${event.pathParameters?.id}`,
              product,
            }),
          };
        },
      };

      return mapMethodsFunctions[method]();
    },
  };
  try {
    const response = mapEventsResources[resource](method);
    return response || defaultResponseError;
  } catch (error: any) {
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
