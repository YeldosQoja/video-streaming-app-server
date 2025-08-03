import { CreateJobCommand, MediaConvertClient } from "@aws-sdk/client-mediaconvert";
import mediaConvertJobTemplate from "../../../aws-mediaconvert-job-desc.json" with { type: "json" };

export class MediaConvertService {
  private client: MediaConvertClient;

  constructor() {
    this.client = new MediaConvertClient();
  }

  async startTranscodingJob(
    input: string,
    destination: string,
  ) {
    const job = Object.create(mediaConvertJobTemplate);
  
    job.Settings.Inputs[0].FileInput = input;
    job.Settings.OutputGroups[0].OutputGroupSettings.HlsGroupSettings.Destination = destination;

    const command = new CreateJobCommand(job);

    await this.client.send(command);

    return command;
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
