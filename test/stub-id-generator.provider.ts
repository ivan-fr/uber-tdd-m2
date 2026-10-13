import { IDGenerator } from "@/id-generator.provider";

export class StubIDGenerator implements IDGenerator {
  id: string = "";
  generate(): string {
    return this.id;
  }
}
