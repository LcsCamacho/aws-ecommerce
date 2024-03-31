import { App, Stack, aws_lambda as lambda } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { Code, Runtime } from "aws-cdk-lib/aws-lambda";
import { ProductRepository } from "../lambda/products/layers/productsLayer/nodejs/productsRepository";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

test("should get all products", () => {});
