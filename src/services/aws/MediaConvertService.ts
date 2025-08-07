import { CreateJobCommand, MediaConvertClient, ServiceInputTypes, ServiceOutputTypes } from "@aws-sdk/client-mediaconvert";
import mediaConvertJobTemplate from "../../../aws-mediaconvert-job-desc.json" with { type: "json" };
import { AwsService } from "./AWSService.js";
import { awsConfig } from "../../config/aws.js";

export class MediaConvertService extends AwsService<MediaConvertClient, ServiceInputTypes, ServiceOutputTypes> {
  protected override client: MediaConvertClient;

  constructor() {
    super();
    this.client = new MediaConvertClient();
  }

  async startTranscodingJob(
    input: string,
    destination: string,
  ) {
    const job = Object.create(mediaConvertJobTemplate);
  
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
