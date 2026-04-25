# Tasks

## Task 1: Create shared TypeScript types
- [x] 1.1 Create `src/types/transaction.ts` with `TransactionRecord` interface including all fields: txnId, receiverName, receiverPhone, amount, decision, decisionBy, reason, reasonBM, riskScore, confidence, timestamp, reported, canReport, auditVerdict, auditReason, auditReasonBM, consistencyScore
- [x] 1.2 Create `AuditResult` interface with fields: auditVerdict ("CONFIRMED" | "OVERRIDDEN" | "FLAGGED"), auditReason, auditReasonBM, consistencyScore
- [x] 1.3 Create `AuditContext` interface with fields: txnId, transactionDetails (amount, receiverPhone, receiverName, xgboostScore, strikeCount), layer2Decision (BedrockDecision)

## Task 2: Implement Layer 3 Auditor in backend
- [x] 2.1 Add `invokeAuditorLLM` function to `src/backend/lib/bedrock.ts` that accepts `AuditContext` and returns `Promise<AuditResult>`
- [x] 2.2 Implement the auditor prompt that sends transaction context and Layer 2 decision to Bedrock, asking it to verify factual grounding and logical consistency
- [x] 2.3 Implement error handling: on Bedrock failure, return default AuditResult with verdict FLAGGED, reason "Audit service unavailable", and consistencyScore 0.0
- [x] 2.4 [PBT] Write property-based test: for any valid AuditContext input, `invokeAuditorLLM` (with mocked Bedrock client) returns an AuditResult where auditVerdict is in {"CONFIRMED", "OVERRIDDEN", "FLAGGED"}, consistencyScore is in [0.0, 1.0], and auditReason and auditReasonBM are non-empty strings

## Task 3: Integrate Layer 3 into transaction check flow
- [x] 3.1 Modify `checkTransaction.ts` AI_GUARDIAN branch: after receiving Layer 2 decision, call `invokeAuditorLLM()` with transaction context and Layer 2 output
- [x] 3.2 Store Layer 3 audit fields (auditVerdict, auditReason, auditReasonBM, consistencyScore) in the transaction record written to DynamoDB
- [x] 3.3 For BYPASS and XGBOOST decision paths, store null values for all Layer 3 audit fields in the transaction record
- [x] 3.4 [PBT] Write property-based test: for any stored transaction, auditVerdict is null if and only if decisionBy is "BYPASS" or "XGBOOST"; auditVerdict is non-null if and only if decisionBy is "AI_GUARDIAN"

## Task 4: Extend Audit Log API response
- [x] 4.1 Modify `getAuditLog.ts` to include auditVerdict, auditReason, auditReasonBM, and consistencyScore in the transaction response mapping
- [x] 4.2 Modify `getAuditLog.ts` to include the confidence field in the transaction response mapping

## Task 5: Build Transaction Log UI with live data
- [x] 5.1 Remove hardcoded `log` array from `ai-monitor.tsx`
- [x] 5.2 Add TanStack Query hook to fetch transactions from `GET /audit/:userId` endpoint
- [x] 5.3 Implement loading skeleton state displayed while the API request is in progress
- [x] 5.4 Implement error state with error message and retry button
- [x] 5.5 Implement empty state message when zero transactions are returned
- [x] 5.6 Render each transaction row showing: receiver name, amount (RM format), relative timestamp, and decision status icon/color (APPROVED=green check, BLOCKED=orange warning, PENDING=gray clock)
- [x] 5.7 Add "Review" button to each transaction row
- [x] 5.8 [PBT] Write property-based test: for any array of TransactionRecord objects, after sorting by timestamp descending, each element's timestamp is >= the next element's timestamp

## Task 6: Build Transaction Review Sheet component
- [x] 6.1 Create `src/components/TransactionReview.tsx` using shadcn/ui Sheet component with props: transaction, open, onOpenChange
- [x] 6.2 Implement Transaction Info section showing receiver name, amount, timestamp, and risk score
- [x] 6.3 Implement Layer 2 Decision section with decision badge (color-coded), English reason, BM reason, confidence percentage, and decisionBy field
- [x] 6.4 Implement Layer 3 Audit section with verdict badge (color-coded), English audit reason, BM audit reason, and consistency score percentage
- [x] 6.5 Implement conditional rendering: when decisionBy is BYPASS or XGBOOST, show "Not applicable" messages for both Layer 2 and Layer 3 sections
- [x] 6.6 Implement override alert: when auditVerdict is OVERRIDDEN, display a highlighted alert showing the discrepancy between Layer 2 and Layer 3
- [x] 6.7 [PBT] Write property-based test: for any score value in [0.0, 1.0], the formatted percentage equals Math.round(score * 100) and is between 0 and 100 inclusive

## Task 7: Update status card with real transaction counts
- [x] 7.1 Replace hardcoded "checked 24 transactions today" text with actual total transaction count from the API response
- [x] 7.2 Display the count of blocked transactions in the status card
- [x] 7.3 [PBT] Write property-based test: for any array of TransactionRecord objects, the computed blocked count equals the number of records where decision equals "BLOCKED"

## Task 8: Wire up Review Sheet to Transaction Log
- [x] 8.1 Add state management in `ai-monitor.tsx` for selected transaction and sheet open/close
- [x] 8.2 Connect "Review" button click to open the TransactionReview sheet with the selected transaction data
- [x] 8.3 Ensure the sheet closes properly and returns focus to the transaction log
