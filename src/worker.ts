import { fileURLToPath } from "node:url";
import {
  DeleteMessageBatchCommand,
  DeleteMessageCommand,
  Message,
  ReceiveMessageCommand,
  SQSClient,
  SQSServiceException,
} from "@aws-sdk/client-sqs";
import dotenv from "dotenv";
import { getAwsConfig } from "./config/aws.js";
import {
  updateStatusForMultipleVideos,
  updateVideoStatus,
} from "./db/queries.js";

dotenv.config();

const awsConfig = getAwsConfig();
const SQS_QUEUE_URL = awsConfig.sqs.queueUrl || "";

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

const processMessages = async (messages: Message[]) => {
  if (messages.length === 1) {
    console.log("MessageId:", messages[0]?.MessageId);
    const body = JSON.parse(messages[0]?.Body ?? "");
    const {
      s3: { object: { key } },
    } = body.Records[0];
    const storageKey = (key as string).split("/")[2] as string;
    console.log({ storageKey });
    await updateVideoStatus(storageKey, "UPLOADED");
  } else {
    const keys = messages.map((message) => {
      const body = JSON.parse(message.Body ?? "");
      const {
        s3: {
          object: { key },
        },
      } = body.Records[0];
      const storageKey = (key as string).split("/")[2] as string;
      return storageKey;
    });
    await updateStatusForMultipleVideos([...new Set(keys)], "UPLOADED");
  }
};

export const main = async (queueUrl: string = SQS_QUEUE_URL) => {
  try {
    while (true) {
      const { Messages } = await receiveMessage(queueUrl);

      if (!Messages) {
        continue;
      }

      await processMessages(Messages);

      if (Messages.length === 1) {
        await sqsClient.send(
          new DeleteMessageCommand({
            QueueUrl: queueUrl,
            ReceiptHandle: Messages[0]?.ReceiptHandle,
          })
        );
      } else {
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
    console.log(err);
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
