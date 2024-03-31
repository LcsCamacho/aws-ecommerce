import {
  aws_apigateway as apigw,
  aws_logs,
  aws_lambda_nodejs as lambdaNodeJs,
  Stack,
  StackProps,
} from "aws-cdk-lib";

import { Construct } from "constructs";

interface ECommerceApiStackProps extends StackProps {
  readonly productsFetchHandler: lambdaNodeJs.NodejsFunction;
  readonly productsAdminHandler: lambdaNodeJs.NodejsFunction;
}

export class ECommerceApiStack extends Stack {
  constructor(scope: Construct, id: string, props: ECommerceApiStackProps) {
    super(scope, id, props);

    const logGroup = new aws_logs.LogGroup(this, "ECommerceApiLogGroup", {});

    const api = new apigw.RestApi(this, "ECommerceApi", {
      restApiName: "ECommerceApi",
      description: "This service serves E-Commerce API.",
      cloudWatchRole: true,

      deployOptions: {
        accessLogDestination: new apigw.LogGroupLogDestination(logGroup),
        accessLogFormat: apigw.AccessLogFormat.jsonWithStandardFields({
          caller: true,
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          user: true,
        }),
      },
    });

    // Add a lambda function for the list products handling GET
    const productsFetchIntegration = new apigw.LambdaIntegration(
      props.productsFetchHandler
    );

    // Add a lambda function for write, delete, edit products handling POST PUT DELETE
    const productsAdminIntegration = new apigw.LambdaIntegration(
      props.productsAdminHandler
    );

    const productsResource = api.root.addResource("products");

    // Add a resource for the admin - Route POST /products
    productsResource.addMethod("POST", productsAdminIntegration);

    // Add a resource for the products - Route GET /products
    productsResource.addMethod("GET", productsFetchIntegration);

    const productIdResource = productsResource.addResource("{id}");

    // Add a resource for the admin - Route GET /products/{id}
    productIdResource.addMethod("GET", productsFetchIntegration);

    // Add a resource for the admin - Route PUT /products/{id}
    productIdResource.addMethod("PUT", productsAdminIntegration);

    // Add a resource for the admin - Route DELETE /products/{id}
    productIdResource.addMethod("DELETE", productsAdminIntegration);
  }
}
