import { Command, Client, MetadataBearer } from "@aws-sdk/types";

export interface AwsCommand extends Command<any, any, any, any, MetadataBearer> {}

export abstract class AwsService<
  TClient extends Client<ClientInput, ClientOutput, any>,
  ClientInput extends object,
  ClientOutput extends MetadataBearer
> {
  readonly client!: TClient;

  async sendCommand<
    InputType extends ClientInput,
    OutputType extends ClientOutput
  >(command: Command<ClientInput, InputType, ClientOutput, OutputType, any>) {
    return this.client.send(command);
  }
}
