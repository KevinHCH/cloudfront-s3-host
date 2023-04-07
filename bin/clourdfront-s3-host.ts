#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ClourdfrontS3HostStack } from '../lib/clourdfront-s3-host-stack';
import { loadEnvironmentConfiguration } from '../utils/load-env-configuration';

const app = new cdk.App();
const envName = app.node.tryGetContext('env')?.toLowerCase();
if (!envName) {
  throw new Error('Must specify environment name in context, use -c env=<ENV_NAME>');
}
const envConfig = loadEnvironmentConfiguration(envName);
const stackName = `ClourdfrontS3HostStack-${envName}`;
new ClourdfrontS3HostStack(app, stackName, {
  stackName,
  env: {
    account: envConfig.env.account,
    region: envConfig.env.region,
  },
  organizationName: envConfig.organizationName,
  domainName: envConfig.domainName,
  domainArnCert: envConfig.domainArnCert,
  envName: envName,
  s3BucketName: envConfig.s3BucketName ?? '',
  prefix: envConfig.prefix ?? '',
});