import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: "ap-southeast-1",
});

export const dynamo = DynamoDBDocumentClient.from(client);

export const TABLES = {
  USERS: "goguardian-users",
  TRANSACTIONS: "goguardian-transactions",
  GUARDIAN_LINKS: "goguardian-guardian-links",
  RECEIVER_REPUTATION: "goguardian-receiver-reputation",
  AUDIT_LOG: "goguardian-audit-log",
  REWARDS: "goguardian-rewards",
} as const;