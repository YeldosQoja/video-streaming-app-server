import { CreateJobCommand, MediaConvertClient, ServiceInputTypes, ServiceOutputTypes } from "@aws-sdk/client-mediaconvert";
import { AwsService } from "./AWSService.js";
import { awsConfig } from "../../config/aws.js";
import AppError from "../../utils/AppError.js";
import { HttpStatusCode } from "../../utils/HttpStatusCode.js";

export class MediaConvertService extends AwsService<MediaConvertClient, ServiceInputTypes, ServiceOutputTypes> {
  override client: MediaConvertClient;

  constructor() {
    super();
    this.client = new MediaConvertClient();
  }

  async startTranscodingJob(
    input: string,
    destination: string,
  ) {
    const jobTemplateJson = process.env["MEDIACONVERT_JOB_CONFIG"];

    if (jobTemplateJson === undefined) {
      throw new AppError("Couldn't access transcoding job configs!", HttpStatusCode.SERVER_ERROR, true);
    }

    const job = Object.create(JSON.parse(jobTemplateJson));
  
    job.Settings.Inputs[0].FileInput = "s3://" + awsConfig.s3.bucketName + "/" + input;
    job.Settings.OutputGroups[0].OutputGroupSettings.HlsGroupSettings.Destination = "s3://" + awsConfig.s3.bucketName + "/" + destination;

    const command = new CreateJobCommand(job);

    const output = await this.sendCommand(command);

    return output;
  }
}

class TranscodingJobBuilder {
    addDestination(destination: string) {
        return this;
    }

    addOutput() {
        return this;
    }

    start() {

    }
}
