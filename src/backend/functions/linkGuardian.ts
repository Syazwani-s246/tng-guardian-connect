import { PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo, TABLES } from "../lib/dynamodb";
import { v4 as uuidv4 } from "uuid";

export async function linkGuardian(event: {
  protectedUserId: string;
  guardianPhone: string;
  guardianName: string;
  guardianMode: "FAMILY" | "COMMUNITY" | "AI";
}) {
  const { protectedUserId, guardianPhone, guardianName, guardianMode } = event;
  const linkId = uuidv4();
  const timestamp = new Date().toISOString();
  const guardianId = `GUARDIAN#${guardianPhone}`;

  // 1. create guardian link record
  await dynamo.send(
    new PutCommand({
      TableName: TABLES.GUARDIAN_LINKS,
      Item: {
        guardianId,
        protectedUserId,
        linkId,
        guardianPhone,
        guardianName,
        guardianMode,
        status: "ACTIVE",
        createdAt: timestamp,
      },
    })
  );

  // 2. update protected user record with guardian info
  await dynamo.send(
    new UpdateCommand({
      TableName: TABLES.USERS,
      Key: { userId: protectedUserId },
      UpdateExpression:
        "SET guardianId = :gid, guardianMode = :gm, guardianPhone = :gp, guardianName = :gn",
      ExpressionAttributeValues: {
        ":gid": guardianId,
        ":gm": guardianMode,
        ":gp": guardianPhone,
        ":gn": guardianName,
      },
    })
  );

  // 3. initialize rewards record for guardian if not exists
  await dynamo.send(
    new PutCommand({
      TableName: TABLES.REWARDS,
      Item: {
        guardianId,
        points: 0,
        guardianName,
        guardianPhone,
        createdAt: timestamp,
        lastActivity: timestamp,
      },
      ConditionExpression: "attribute_not_exists(guardianId)",
    }).catch(() => {}) as any
  );

  return {
    success: true,
    linkId,
    guardianId,
    message: `Guardian ${guardianName} linked successfully`,
  };
}