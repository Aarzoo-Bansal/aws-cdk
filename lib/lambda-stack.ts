import * as cdk from 'aws-cdk-lib/core';
import {Construct} from 'constructs';

export class LambdaStack extends cdk.Stack {
    /**
     * In this stack, I will be creating the following two resources
     * 1. A LambdaFunction to add the Logic of size tracking lambda
     * 2. A LambdaFunction to add the logic of plotting lambda
     */

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
    }

}