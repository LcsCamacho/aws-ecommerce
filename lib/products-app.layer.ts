import {
  aws_lambda as lambda,
  RemovalPolicy,
  aws_ssm as ssm,
  Stack,
  StackProps,
} from "aws-cdk-lib";

import { Construct } from "constructs";

export class ProductsAppLayerStack extends Stack {

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const productsLayer = new lambda.LayerVersion(this, "ProductsLayer", {
      code: lambda.Code.fromAsset("lambda/products/layers/productsLayer", {}),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      description: "A layer with shared code for the products app",
      layerVersionName: "ProductsLayer",
      removalPolicy: RemovalPolicy.RETAIN,
    });

    new ssm.StringParameter(this, "ProductsLayerArn", {
      parameterName: "ProductsLayerArn",
      stringValue: productsLayer.layerVersionArn,
      description: "The ARN of the products layer",
    });


    const productEventsLayer = new lambda.LayerVersion(this, "ProductEventsLayer", {
      code: lambda.Code.fromAsset("lambda/products/layers/ProductEventsLayer", {}),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      description: "A layer with shared code for the products events app",
      layerVersionName: "ProductEventsLayer",
      removalPolicy: RemovalPolicy.RETAIN,
    });

    new ssm.StringParameter(this, "ProductsLayerArn", {
      parameterName: "ProductsEventsLayerArn",
      stringValue: productEventsLayer.layerVersionArn,
      description: "The ARN of the products events layer",
    });
  }
}
