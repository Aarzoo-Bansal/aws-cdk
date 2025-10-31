import * as cdk from 'aws-cdk-lib/core';
import {Construct} from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';


// Creating interface to get table name from environment
export interface LambdaStackProps extends cdk.StackProps {
    bucket: s3.IBucket;
    table: dynamodb.ITable;
}

export class LambdaStack extends cdk.Stack {
    // exporting the plotting lambda so that API lambda can get it
    public readonly plottingLambda: lambda.Function;
    /**
     * In this stack, I will be creating the following two resources
     * 1. A LambdaFunction to add the Logic of size tracking lambda
     * 2. A LambdaFunction to add the logic of plotting lambda
     */

    constructor(scope: Construct, id: string, props: LambdaStackProps) {
        super(scope, id, props);

        /***************************************************************************************** */
        // Size tracking lambda
        const sizeTrackingLambda = new lambda.Function(this, 'SizeTrackingLambdaConstruct', {
            runtime: lambda.Runtime.PYTHON_3_9,
            handler: 'size_tracking_handler.lambda_handler',
            code: lambda.Code.fromAsset('lambda-handlers'),
            environment: {'TABLE_NAME' : props.table.tableName}
        })

        // Giving S3 read access to Size Tracking Lambda 
        props.bucket.grantRead(sizeTrackingLambda);

        // Giving DynamoDb write access to Size Tracking Lambda
        props.table.grantWriteData(sizeTrackingLambda);

        // Adding policy so that s3 can trigger event, when an object is created, on size tracking lambda
        props.bucket.addEventNotification(
            s3.EventType.OBJECT_CREATED,
            new s3n.LambdaDestination(sizeTrackingLambda)
        )

        // Adding policy so that s3 can trigger event to size tracking lambda when object is deleted or updated
        props.bucket.addEventNotification(
            s3.EventType.OBJECT_REMOVED,
            new s3n.LambdaDestination(sizeTrackingLambda)
        )

        /***************************************************************************************** */
        // Plotting Lambda
        this.plottingLambda = new lambda.Function(this, 'PlottingLambdaConstruct', {
            runtime: lambda.Runtime.PYTHON_3_9,
            handler: 'plotting_handler.lambda_handler',
            code: lambda.Code.fromAsset('lambda-handlers'),
            environment : {
                'BUCKET_NAME' : props.bucket.bucketName,
                'TABLE_NAME' : props.table.tableName,
                'INDEX_NAME' : 'MaxSizeIndex'
            }
        })

        // Giving the write permission to plotting lambda so that it is able to write in the s3 bucket
        props.bucket.grantWrite(this.plottingLambda)

        // Giving read permission to plotting lambda so that it can read from dynamodb table
        props.table.grantReadData(this.plottingLambda);







    }

}