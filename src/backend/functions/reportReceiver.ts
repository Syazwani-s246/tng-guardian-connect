import { GetCommand, UpdateCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo, TABLES } from "../lib/dynamodb";

export async function reportReceiver(event: {
  txnId: string;
  timestamp: string;
  reporterId: string;
  isScam: boolean;
}) {
  const { txnId, timestamp, reporterId, isScam } = event;
  const reportedAt = new Date().toISOString();

  // 1. get transaction
  const txnResult = await dynamo.send(
    new GetCommand({
      TableName: TABLES.TRANSACTIONS,
      Key: { txnId, timestamp },
    })
  );
  const txn = txnResult.Item;
  if (!txn) throw new Error("Transaction not found");

  // 2. check 7 day window
  const txnDate = new Date(txn.timestamp);
  const now = new Date();
  const diffDays =
    (now.getTime() - txnDate.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays > 7) throw new Error("Reporting window has expired (7 days)");

  // 3. check not already reported
  if (txn.reported) throw new Error("Transaction already reported");

  // 4. mark transaction as reported
  await dynamo.send(
    new UpdateCommand({
      TableName: TABLES.TRANSACTIONS,
      Key: { txnId, timestamp },
      UpdateExpression:
        "SET reported = :r, isScam = :s, reportedAt = :ra, reportedBy = :rb",
      ExpressionAttributeValues: {
        ":r": true,
        ":s": isScam,
        ":ra": reportedAt,
        ":rb": reporterId,
      },
    })
  );

  // 5. if scam — update receiver reputation strike count
  if (isScam) {
    const existing = await dynamo.send(
      new GetCommand({
        TableName: TABLES.RECEIVER_REPUTATION,
        Key: { receiverPhone: txn.receiverPhone },
      })
    );

    if (existing.Item) {
      await dynamo.send(
        new UpdateCommand({
          TableName: TABLES.RECEIVER_REPUTATION,
          Key: { receiverPhone: txn.receiverPhone },
          UpdateExpression:
            "ADD strikeCount :s, reporters :r SET lastReportedAt = :la, flagStatus = :fs",
          ExpressionAttributeValues: {
            ":s": 1,
            ":r": dynamo.send as any,
            ":la": reportedAt,
            ":fs":
              (existing.Item.strikeCount ?? 0) + 1 >= 3
                ? "HIGH_RISK"
                : "FLAGGED",
          },
        })
      );
    } else {
      await dynamo.send(
        new PutCommand({
          TableName: TABLES.RECEIVER_REPUTATION,
          Item: {
            receiverPhone: txn.receiverPhone,
            strikeCount: 1,
            reporters: [reporterId],
            lastReportedAt: reportedAt,
            flagStatus: "FLAGGED",
          },
        })
      );
    }

    // award points to guardian for catching a scam
    if (txn.guardianId) {
      await dynamo.send(
        new UpdateCommand({
          TableName: TABLES.REWARDS,
          Key: { guardianId: txn.guardianId },
          UpdateExpression: "ADD points :p",
          ExpressionAttributeValues: { ":p": 50 },
        })
      );
    }
  }

  return {
    success: true,
    txnId,
    isScam,
    message: isScam
      ? "Scam reported. Receiver reputation updated. Guardian rewarded."
      : "Transaction marked as safe.",
  };
}