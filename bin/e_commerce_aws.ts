#!/usr/bin/env node
import { App, aws_dynamodb, Environment } from "aws-cdk-lib";
import "source-map-support/register";
import { ECommerceApiStack } from "../lib/ecommerce-api.stack";
import { ProductsAppStack } from "../lib/products-app.stack";
import { ProductsAppLayerStack } from "../lib/products-app.layer";
import DynamoDB = require("aws-sdk/clients/dynamodb");

const app = new App();

const env: Environment = {
  account: "PUT ACCOUNT ID HER",
  region: "us-east-1",
};

const tags = {
  cost: "ECommerce",
  team: "Updevs",
};

const productsAppLayerLayerStack = new ProductsAppLayerStack(
  app,
  "ProductsAppLayerLayerStack",
  {
    env,
    tags,
  }
);

const productsAppStack = new ProductsAppStack(app, "ProductsAppStack", {
  env,
  tags,
  eventsDdb: {} as aws_dynamodb.Table,
});

// Prevents the ProductsAppStack from being created before the ProductsAppLayerStack
productsAppStack.addDependency(productsAppLayerLayerStack);

const eCommerceApiStack = new ECommerceApiStack(app, "ECommerceApiStack", {
  env,
  tags,
  productsFetchHandler: productsAppStack.productsFetchHandler,
  productsAdminHandler: productsAppStack.productsAdminHandler,
});

eCommerceApiStack.addDependency(productsAppStack);
