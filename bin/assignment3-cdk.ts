#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { LambdaStack } from '../lib/lambda-stack';
import { StorageStack} from '../lib/storage-stack';
import { APIStack } from '../lib/api-stack';


const app = new cdk.App();

const storageStack = new StorageStack(app, 'StorageStack', {});

const lambdaStack = new LambdaStack(app, 'LambdaStack', {
  bucket: storageStack.s3Bucket,
  table: storageStack.dynamodbTable
});

new APIStack(app, 'APIStack', {});

