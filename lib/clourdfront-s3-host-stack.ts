import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { CfnOutput, Duration, RemovalPolicy } from 'aws-cdk-lib'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as route53targets from 'aws-cdk-lib/aws-route53-targets'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront'

export interface ClourdfrontS3HostStackProps extends StackProps {
  organizationName: string
  domainName: string
  domainArnCert: string
  envName: string
  s3BucketName?: string
  prefix?: string
}
export class ClourdfrontS3HostStack extends Stack {
  public constructor(scope: Construct, id: string, props: ClourdfrontS3HostStackProps) {
    super(scope, id)

    const domainName = props.domainName
    
    let subdomain = `${props.envName}.${props.domainName}`
    if (props.prefix !== undefined) subdomain = `${props.prefix}.${props.envName}.${props.domainName}`
    

    const s3BucketName = props.s3BucketName ?? `${props.organizationName}-static-${props.envName}`
    const assetsBucket = new s3.Bucket(this, s3BucketName, {
      bucketName: s3BucketName,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.RETAIN,
      accessControl: s3.BucketAccessControl.PRIVATE,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      encryption: s3.BucketEncryption.S3_MANAGED
    })

    const cloudfrontOriginAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'CloudFrontOriginAccessIdentity')

    assetsBucket.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [assetsBucket.arnForObjects('*')],
      principals: [new iam.CanonicalUserPrincipal(cloudfrontOriginAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId)]
    }))

    const zone = route53.HostedZone.fromLookup(this, `${props.organizationName}-hosted-zone`, { domainName })

    const certificate = acm.Certificate.fromCertificateArn(this, `${props.organizationName}-cert-${props.envName}`, props.domainArnCert)

    let cloudfrontDistributionName = `${props.organizationName}-distribution-${props.envName}`
    if (props.prefix !== undefined) cloudfrontDistributionName = `${props.organizationName}-${props.prefix}-distribution-${props.envName}`
    const cloudfrontDistribution = new cloudfront.Distribution(this, cloudfrontDistributionName, {
      certificate,
      domainNames: [subdomain],
      defaultRootObject: '/index.html',
      defaultBehavior: {
        origin: new origins.S3Origin(assetsBucket, {
          originAccessIdentity: cloudfrontOriginAccessIdentity
        }),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS
      },
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: Duration.minutes(30)
        }
      ]
    })

    new route53.ARecord(this, 'ARecord', {
      recordName: subdomain,
      target: route53.RecordTarget.fromAlias(new route53targets.CloudFrontTarget(cloudfrontDistribution)),
      zone
    })
    new CfnOutput(this, 'CloudFrontDistributionId', { value: cloudfrontDistribution.distributionId })
    new CfnOutput(this, 'CloudFrontDistributionDomainName', { value: cloudfrontDistribution.domainName })
    new CfnOutput(this, 'S3BucketName', { value: assetsBucket.bucketName })
    new CfnOutput(this, 'Domain', { value: `https://${subdomain}` })
  }
}
