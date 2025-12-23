import fs from "fs/promises";
import { getSignedUrl } from "@aws-sdk/cloudfront-signer";
import { getAwsConfig } from "../../config/aws.js";

export class CloudFrontService {
  async generateSignedUrl(
    username: string,
    storageKey: string,
    expirationDate: number | string | Date
  ) {
    const {
      cloudFront: { baseUrl, keyGroupId },
    } = getAwsConfig();
    const privateKey = await fs.readFile("../../tmp/private_key.pem");

    const url = getSignedUrl({
      url: `${baseUrl}/outputs/${username}/${storageKey}/output.m3u8`,
      keyPairId: keyGroupId,
      privateKey,
      dateLessThan: expirationDate, // Video will be available for the next hour
    });

    return url;
  }
}
