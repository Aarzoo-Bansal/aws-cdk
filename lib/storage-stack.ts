import * as cdk from 'aws-cdk-lib/core';
import {Construct} from 'constructs';
import { RemovalPolicy } from 'aws-cdk-lib'; // to delete the S3 bucket when I destroy the stack
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { S3EventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

export class StorageStack extends cdk.Stack {

    /**
     * In the storage stack I will be creating the following resources:
     * 1. S3 bucket
     * 2. DynamoDB table
     */

    public readonly s3Bucket: s3.Bucket;
    public readonly dynamodbTable: dynamodb.Table;
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // creating an S3 bucket
        this.s3Bucket = new s3.Bucket(this, 'Assignment3Bucket',
            {
                removalPolicy: RemovalPolicy.DESTROY
            });
          
        // creating dynamodb table
        this.dynamodbTable = new dynamodb.Table(this, 'Assignment3Table',
            {
                partitionKey: {
                    name: 'bucket_name',
                    type: dynamodb.AttributeType.STRING
                },
                sortKey: {
                    name: 'timestamp',
                    type: dynamodb.AttributeType.NUMBER
                },
                removalPolicy: RemovalPolicy.DESTROY,
            })

        // to fulfill the requirement of finding the maxium size any bucket has reached at any time, creating an index
        this.dynamodbTable.addGlobalSecondaryIndex({
            indexName: 'MaxSizeIndex',
            partitionKey: {
                name: 'record_type',
                type: dynamodb.AttributeType.STRING
            },
            sortKey: {
                name: 'total_size',
                type: dynamodb.AttributeType.NUMBER
            },
            projectionType: dynamodb.ProjectionType.ALL
        })

        /**************************************************************************************************************************************/

        // Size tracking lambda
        const sizeTrackingLambda = new lambda.Function(this, 'SizeTrackingLambdaConstruct', {
                    runtime: lambda.Runtime.PYTHON_3_9,
                    handler: 'size_tracking_handler.lambda_handler',
                    code: lambda.Code.fromAsset('lambda-handlers'),
                    timeout: cdk.Duration.seconds(30), 
                    environment: { 'TABLE_NAME': this.dynamodbTable.tableName }
                })
        
                // Giving S3 read access to Size Tracking Lambda 
                this.s3Bucket.grantRead(sizeTrackingLambda);
        
                // Giving DynamoDb write access to Size Tracking Lambda
                this.dynamodbTable.grantWriteData(sizeTrackingLambda);
        
                // Adding policy so that s3 can trigger event, when an object is created, on size tracking lambda
                sizeTrackingLambda.addEventSource(new S3EventSource(this.s3Bucket, {
                    events: [
                        s3.EventType.OBJECT_CREATED,
                        s3.EventType.OBJECT_REMOVED
                    ]
                }));

    }

}