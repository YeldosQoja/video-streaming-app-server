export const awsConfig = {
    s3: {
      bucketName: process.env["AWS_S3_BUCKET_NAME"]!,
      region: process.env["AWS_REGION"] || 'eu-central-1',
    },
    mediaConvert: {
      jobTemplate: process.env["MEDIACONVERT_JOB_TEMPLATE"]!,
      queue: process.env["MEDIACONVERT_QUEUE"]!,
      role: process.env["MEDIACONVERT_ROLE"]!,
    },
    cloudFront: {
      baseUrl: process.env["S3_CDN"]!,
      keyGroupId: process.env["CDN_KEY_GROUP_ID"]!,
    },
  } as const;