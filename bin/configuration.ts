import { type Environment } from 'aws-cdk-lib'
export interface Configuration {
  readonly env: Environment
  // env: {
  //   account: string
  //   region: string
  // }
  organizationName: string
  domainName: string
  domainArnCert: string,
  s3BucketName?: string
  prefix?: string
}
