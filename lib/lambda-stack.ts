import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

// Creating interface to get table name from environment
export interface LambdaStackProps extends cdk.StackProps {
    bucket: s3.Bucket;
    table: dynamodb.Table;
}

export class LambdaStack extends cdk.Stack {
    // exporting the plotting lambda so that API lambda can get it
    public readonly plottingLambda: lambda.Function;
    /**
     * This stack, contains the following resource
      * 1. Plotting Lambda
      * 2. REST API Gateway
      * 3. Driver Lambda
     */

    constructor(scope: Construct, id: string, props: LambdaStackProps) {
        super(scope, id, props);

        /***************************************************************************************** */
        // Size tracking lambda
        // const sizeTrackingLambda = new lambda.Function(this, 'SizeTrackingLambdaConstruct', {
        //     runtime: lambda.Runtime.PYTHON_3_9,
        //     handler: 'size_tracking_handler.lambda_handler',
        //     code: lambda.Code.fromAsset('lambda-handlers'),
        //     environment: { 'TABLE_NAME': props.table.tableName }
        // })

        // // Giving S3 read access to Size Tracking Lambda 
        // props.bucket.grantRead(sizeTrackingLambda);

        // // Giving DynamoDb write access to Size Tracking Lambda
        // props.table.grantWriteData(sizeTrackingLambda);

        // // Adding policy so that s3 can trigger event, when an object is created, on size tracking lambda
        // sizeTrackingLambda.addEventSource(new S3EventSource(props.bucket, {
        //     events: [
        //         s3.EventType.OBJECT_CREATED,
        //         s3.EventType.OBJECT_REMOVED
        //     ]
        // }));

        /******************************************************************************************************************************/
        // Create matplotlib layer
        const matplotlibLayer = new lambda.LayerVersion(this, 'MatplotlibLayer', {
            code: lambda.Code.fromAsset('layers/matplotlib'),
            compatibleRuntimes: [lambda.Runtime.PYTHON_3_9],
            description: 'Matplotlib and dependencies for Python 3.9'
        });

        /******************************************************************************************************************************/
        // Plotting Lambda
        this.plottingLambda = new lambda.Function(this, 'PlottingLambdaConstruct', {
            runtime: lambda.Runtime.PYTHON_3_9,
            handler: 'plotting_handler.lambda_handler',
            code: lambda.Code.fromAsset('lambda-handlers'),
            environment: {
                'BUCKET_NAME': props.bucket.bucketName,
                'TABLE_NAME': props.table.tableName,
                'INDEX_NAME': 'MaxSizeIndex'
            },
            // adding matplotlib layer to the plotting lambda
            layers: [matplotlibLayer] 
        });
        // Giving the write permission to plotting lambda so that it is able to write in the s3 bucket
        props.bucket.grantWrite(this.plottingLambda)

        // Giving read permission to plotting lambda so that it can read from dynamodb table
        props.table.grantReadData(this.plottingLambda);

        /******************************************************************************************************************************/
        // Creating API for plotting lambda
        const api = new apigateway.RestApi(this, 'PlottingAPI', {
            restApiName: 'Plotting Service',
            description: 'API for trigerring plotting lambda'
        });

        // Adding Get method that invokes the plotting lambda
        api.root.addMethod('GET', new apigateway.LambdaIntegration(this.plottingLambda));

        /******************************************************************************************************************************/
        // Creating driver lambda

        const driverLambda = new lambda.Function(this, 'DriverLambdaConstruct', {
            runtime: lambda.Runtime.PYTHON_3_9,
            handler: 'driver_handler.lambda_handler',
            code: lambda.Code.fromAsset('lambda-handlers'),
            timeout: cdk.Duration.seconds(60),
            environment: {
                'BUCKET_NAME': props.bucket.bucketName,
                'PLOTTING_API': api.url
            }
        });

        // Adding write access to s3 for driver lambda
        props.bucket.grantWrite(driverLambda);
    }

}