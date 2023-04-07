# CloudFront-S3 Hosting Infrastructure
The purpose of this repository is to provide the infrastructure for deploying a basic host that can be used to deploy frontend applications made with popular frameworks such as React, Angular, or Vue. Additionally, this infrastructure allows you to assign a custom domain for each hosting.

Architecture Overview
The infrastructure consists of two main components:

- **Amazon S3 Bucket**: This is where the frontend assets are stored. It's a simple object storage service that can host static content, such as HTML, CSS, JavaScript, and image files. In this infrastructure, the S3 bucket is set to be publicly accessible.

- **Amazon CloudFront**: This is a content delivery network (CDN) that caches the static content stored in the S3 bucket and delivers it to end-users from the nearest edge location. By using CloudFront, you can significantly improve the latency and speed of your application.

## Deploy
- Before to deploy, make sure you complete the `/environments/development.json` file with the proper information (aws acc, aws region, ACM cert)
- command: `npx cdk deploy -c env=development`