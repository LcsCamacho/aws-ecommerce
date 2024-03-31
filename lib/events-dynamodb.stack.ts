import {
aws_dynamodb as dynamodb,
Stack,
RemovalPolicy,
StackProps,
} from "aws-cdk-lib"

import { Construct } from "constructs"

export class EventsDynamodbStack extends Stack {
    readonly eventsTable: dynamodb.Table;
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id,props);

    new dynamodb.Table(this, "EventsTable", {
      tableName: "EventsTable",
      timeToLiveAttribute: "ttl",
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1,
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }
}



