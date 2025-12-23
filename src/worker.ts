import { fileURLToPath } from "node:url";
import {
  DeleteMessageBatchCommand,
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
  SQSServiceException,
} from "@aws-sdk/client-sqs";
import dotenv from "dotenv";
import { getAwsConfig } from "./config/aws.js";

dotenv.config();

const awsConfig = getAwsConfig();
const SQS_QUEUE_URL = awsConfig.sqs.queueUrl || "";
console.log({ SQS_QUEUE_URL });

const sqsClient = new SQSClient({});

const receiveMessage = (queueUrl: string) =>
  sqsClient.send(
    new ReceiveMessageCommand({
      MaxNumberOfMessages: 3,
      MessageAttributeNames: ["All"],
      QueueUrl: queueUrl,
      WaitTimeSeconds: 5,
    })
  );

export const main = async (queueUrl: string = SQS_QUEUE_URL) => {
  try {
    while (true) {
      const { Messages } = await receiveMessage(queueUrl);

      if (!Messages) {
        continue;
      }

      if (Messages.length === 1) {
        console.log(Messages[0]?.Body);
        await sqsClient.send(
          new DeleteMessageCommand({
            QueueUrl: queueUrl,
            ReceiptHandle: Messages[0]?.ReceiptHandle,
          })
        );
      } else {
        console.log({ Messages });
        await sqsClient.send(
          new DeleteMessageBatchCommand({
            QueueUrl: queueUrl,
            Entries: Messages.map((message) => ({
              Id: message.MessageId,
              ReceiptHandle: message.ReceiptHandle,
            })),
          })
        );
      }
    }
  } catch (err) {
    console.log(`AWS SQS Error: ${(err as SQSServiceException).message}`);
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
