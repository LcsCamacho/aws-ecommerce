import {
  Duration,
  aws_dynamodb as dynamodb,
  aws_lambda as lambda,
  aws_lambda_nodejs as lambdaNodeJs,
  RemovalPolicy,
  Stack,
  StackProps,
  aws_ssm as ssm,
} from "aws-cdk-lib";
import { NodejsFunctionProps } from "aws-cdk-lib/aws-lambda-nodejs";


import { Construct } from "constructs";

interface ProductsAppStackProps extends StackProps {
  eventsDdb:  dynamodb.Table;
}

export class ProductsAppStack extends Stack {
  readonly productsFetchHandler: lambdaNodeJs.NodejsFunction;
  readonly productsDynamoDBTable: dynamodb.Table;
  readonly productsAdminHandler: lambdaNodeJs.NodejsFunction;


  constructor(scope: Construct, id: string, props: ProductsAppStackProps) {
    super(scope, id, props);



    const configPadraoLambda: NodejsFunctionProps = {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      handler: "handler",
      timeout: Duration.seconds(10),
      bundling: {
        minify: true,
        sourceMap: false,
      },
      tracing: lambda.Tracing.ACTIVE,
      insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_229_0,
    };

    this.productsDynamoDBTable = new dynamodb.Table(this, "ProductsTable", {
      tableName: "ProductsTable",
      partitionKey: { name: "productId", type: dynamodb.AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1,
    });

    const productsLayerArn = ssm.StringParameter.valueForStringParameter(
      this,
      "ProductsLayerArn"
    );

    const productsLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      "ProductsLayer",
      productsLayerArn
    );

    const productEventsLayerArn = ssm.StringParameter.valueForStringParameter(
      this,
      "ProductsEventsLayerArn"
    );

    const productEventsLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      "ProductEventsLayer",
      productEventsLayerArn
    );
    

    const productEventsHandler = new lambdaNodeJs.NodejsFunction(
      this,
      "ProductEventsFunction",
      {
        ...configPadraoLambda,
        timeout: Duration.seconds(2),
        entry: "lambda/products/product-events.ts",
        functionName: "ProductEventsFunction",
        environment: {
          EVENTS_DDB_TABLE_NAME: props.eventsDdb.tableName
        },
        layers: [productEventsLayer],
      }
    );

    props.eventsDdb.grantWriteData(productEventsHandler);
    productEventsHandler.grantInvoke(this.productsAdminHandler)

    this.productsFetchHandler = new lambdaNodeJs.NodejsFunction(
      this,
      "ProductsFetchFunction",
      {
        ...configPadraoLambda,
        entry: "lambda/products/products-fetch.ts",
        functionName: "ProductsFetchFunction",
        environment: {
          PRODUCTS_DDB_TABLE_NAME: this.productsDynamoDBTable.tableName,
        },
        layers: [productsLayer],
      insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_229_0,
      }
    );

    this.productsDynamoDBTable.grantReadData(this.productsFetchHandler);

    this.productsAdminHandler = new lambdaNodeJs.NodejsFunction(
      this,
      "ProductsAdminFunction",
      {
        ...configPadraoLambda,
        entry: "lambda/products/products-admin.ts",
        functionName: "ProductsAdminFunction",
        environment: {
          PRODUCTS_DDB_TABLE_NAME: this.productsDynamoDBTable.tableName,
          PRODUCTS_EVENTS_FUNCTION_NAME: productEventsHandler.functionName, 
        },
        layers: [productsLayer, productEventsLayer],
      }
    );

    this.productsDynamoDBTable.grantWriteData(this.productsAdminHandler);
  }
}
