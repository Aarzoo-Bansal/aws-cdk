#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { LambdaStack } from '../lib/lambda-stack';
import { StorageStack} from '../lib/storage-stack';
import { APIStack } from '../lib/api-stack';


const app = new cdk.App();

new StorageStack(app, 'StorageStack', {});
new LambdaStack(app, 'LambdaStack', {});
new APIStack(app, 'APIStack', {});

