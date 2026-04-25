# Requirements Document

## Introduction

This feature enhances the AI Guardian page (`ai-monitor.tsx`) to display a real transaction log fetched from the backend, replacing the current hardcoded activity list. Each transaction includes a "Review" button that opens a detailed view showing the full AI verification pipeline: Layer 2 (Claude via Amazon Bedrock) decision and reasoning, and Layer 3 (Auditor AI) verification output and reasoning. The backend is extended with a new Layer 3 auditor that validates Layer 2's output for factual grounding and logical consistency, and the audit results are stored alongside the transaction data.

## Glossary

- **Transaction_Log**: The scrollable list of transaction records displayed on the AI Guardian page, fetched from the backend API
- **Transaction_Record**: A single entry in the Transaction_Log representing one financial transaction and its AI verification results
- **Review_Detail_View**: A UI overlay (Sheet or Dialog) that displays the full AI verification details for a selected Transaction_Record
- **Layer_1_Screening**: The XGBoost model that assigns an initial risk score (0–1) to each transaction and routes grey-zone cases (score 0.3–0.8) to Layer 2
- **Layer_2_Decision**: The fraud decision produced by Anthropic Claude 3.5 Sonnet via Amazon Bedrock, including a decision (APPROVE/BLOCK/HOLD), English reason, Bahasa Malaysia reason, and confidence score
- **Layer_3_Audit**: The guardrail verification performed by a separate Amazon Bedrock invocation that audits Layer_2_Decision output for factual grounding and logical consistency
- **Audit_Result**: The structured output of Layer_3_Audit containing a verdict (CONFIRMED/OVERRIDDEN/FLAGGED), English audit reason, Bahasa Malaysia audit reason, and a consistency score
- **AI_Guardian_Page**: The React page at route `/ai-monitor` wrapped in the PhoneShell component
- **Audit_Log_API**: The backend endpoint `GET /audit/:userId` that returns transaction history for a user
- **Transaction_Table**: The DynamoDB table `goguardian-transactions` that stores all transaction records

## Requirements

### Requirement 1: Fetch and Display Transaction Log

**User Story:** As a user, I want to see my real transaction history on the AI Guardian page, so that I can review actual AI-monitored transactions instead of hardcoded sample data.

#### Acceptance Criteria

1. WHEN the AI_Guardian_Page loads, THE Transaction_Log SHALL fetch transaction records from the Audit_Log_API using the current user's identifier
2. WHILE the Audit_Log_API request is in progress, THE AI_Guardian_Page SHALL display a loading skeleton in place of the Transaction_Log
3. IF the Audit_Log_API request fails, THEN THE AI_Guardian_Page SHALL display an error message with a retry option
4. WHEN transaction records are returned, THE Transaction_Log SHALL display each Transaction_Record showing the receiver name, transaction amount in RM, relative timestamp, and decision status (APPROVED, BLOCKED, or PENDING)
5. THE Transaction_Log SHALL sort Transaction_Records by timestamp with the most recent transaction first
6. WHEN a Transaction_Record has a decision of BLOCKED, THE Transaction_Log SHALL display a warning icon and warning-colored background for that record
7. WHEN a Transaction_Record has a decision of APPROVED, THE Transaction_Log SHALL display a check icon and success-colored background for that record
8. WHEN a Transaction_Record has a decision of PENDING, THE Transaction_Log SHALL display a clock icon and neutral-colored background for that record
9. IF the Audit_Log_API returns zero transaction records, THEN THE Transaction_Log SHALL display an empty state message indicating no transactions have been monitored yet

### Requirement 2: Transaction Review Button

**User Story:** As a user, I want a "Review" button on each transaction, so that I can view the full AI verification details for any transaction.

#### Acceptance Criteria

1. THE Transaction_Log SHALL display a "Review" button on each Transaction_Record
2. WHEN the user taps the "Review" button, THE AI_Guardian_Page SHALL open the Review_Detail_View for the selected Transaction_Record
3. WHEN the Review_Detail_View is open, THE AI_Guardian_Page SHALL prevent interaction with the underlying Transaction_Log
4. WHEN the user taps the close control on the Review_Detail_View, THE Review_Detail_View SHALL close and return focus to the Transaction_Log

### Requirement 3: Review Detail View — Layer 2 Decision Display

**User Story:** As a user, I want to see the AI's fraud decision and reasoning in the review detail, so that I understand why the AI approved, blocked, or held my transaction.

#### Acceptance Criteria

1. THE Review_Detail_View SHALL display a section labeled "AI Decision (Layer 2)" containing the Layer_2_Decision details
2. THE Review_Detail_View SHALL display the Layer_2_Decision decision value (APPROVE, BLOCK, or HOLD) with a corresponding color-coded badge
3. THE Review_Detail_View SHALL display the Layer_2_Decision English reason text
4. THE Review_Detail_View SHALL display the Layer_2_Decision Bahasa Malaysia reason text
5. THE Review_Detail_View SHALL display the Layer_2_Decision confidence score as a percentage value
6. THE Review_Detail_View SHALL display the Layer_1_Screening risk score that triggered the Layer_2_Decision
7. THE Review_Detail_View SHALL display the decisionBy field indicating which system component made the decision (BYPASS, XGBOOST, AI_GUARDIAN, or AWAITING_GUARDIAN)
8. WHEN the decisionBy value is BYPASS or XGBOOST, THE Review_Detail_View SHALL indicate that Layer 2 AI analysis was not performed for this transaction

### Requirement 4: Review Detail View — Layer 3 Audit Display

**User Story:** As a user, I want to see the Auditor AI's verification of the fraud decision, so that I can trust that the AI's decision was checked for accuracy and consistency.

#### Acceptance Criteria

1. THE Review_Detail_View SHALL display a section labeled "Audit Verification (Layer 3)" containing the Audit_Result details
2. THE Review_Detail_View SHALL display the Audit_Result verdict (CONFIRMED, OVERRIDDEN, or FLAGGED) with a corresponding color-coded badge
3. THE Review_Detail_View SHALL display the Audit_Result English audit reason explaining the verification outcome
4. THE Review_Detail_View SHALL display the Audit_Result Bahasa Malaysia audit reason
5. THE Review_Detail_View SHALL display the Audit_Result consistency score as a percentage value
6. WHEN the Audit_Result verdict is OVERRIDDEN, THE Review_Detail_View SHALL visually highlight the discrepancy between Layer_2_Decision and Layer_3_Audit using a distinct alert style
7. WHEN a Transaction_Record was decided by BYPASS or XGBOOST (no Layer 2 invocation), THE Review_Detail_View SHALL indicate that Layer 3 audit was not applicable for this transaction

### Requirement 5: Backend Layer 3 Auditor Implementation

**User Story:** As a system operator, I want a Layer 3 Auditor AI that verifies Layer 2 decisions, so that every AI-made fraud decision is independently checked for factual grounding and logical consistency.

#### Acceptance Criteria

1. WHEN Layer_2_Decision produces a decision for a grey-zone transaction, THE Layer_3_Audit SHALL invoke a separate Amazon Bedrock model call to audit the Layer_2_Decision output
2. THE Layer_3_Audit SHALL receive the original transaction context and the complete Layer_2_Decision output as input
3. THE Layer_3_Audit SHALL return an Audit_Result containing: verdict (CONFIRMED, OVERRIDDEN, or FLAGGED), auditReason (English), auditReasonBM (Bahasa Malaysia), and consistencyScore (0.0–1.0)
4. WHEN the Layer_3_Audit determines the Layer_2_Decision is factually grounded and logically consistent, THE Layer_3_Audit SHALL return a verdict of CONFIRMED
5. WHEN the Layer_3_Audit determines the Layer_2_Decision contains logical inconsistencies or unsupported claims, THE Layer_3_Audit SHALL return a verdict of FLAGGED
6. WHEN the Layer_3_Audit determines the Layer_2_Decision is incorrect and provides a corrected decision, THE Layer_3_Audit SHALL return a verdict of OVERRIDDEN
7. IF the Layer_3_Audit Bedrock invocation fails, THEN THE Layer_3_Audit SHALL return a default Audit_Result with verdict FLAGGED, a reason indicating audit failure, and a consistencyScore of 0.0

### Requirement 6: Store Layer 3 Audit Results

**User Story:** As a system operator, I want Layer 3 audit results stored alongside transaction records, so that the full AI verification pipeline is available for review and compliance.

#### Acceptance Criteria

1. WHEN Layer_3_Audit completes, THE Transaction_Table SHALL store the Audit_Result fields (auditVerdict, auditReason, auditReasonBM, consistencyScore) alongside the existing transaction record
2. WHEN the Audit_Log_API returns transaction records, THE Audit_Log_API SHALL include the Layer_3_Audit fields (auditVerdict, auditReason, auditReasonBM, consistencyScore) in each Transaction_Record response
3. WHEN a transaction was decided by BYPASS or XGBOOST, THE Transaction_Table SHALL store null values for all Layer_3_Audit fields

### Requirement 7: Transaction Summary Header

**User Story:** As a user, I want to see a summary of my transaction monitoring activity, so that I have a quick overview of how many transactions the AI has processed.

#### Acceptance Criteria

1. THE AI_Guardian_Page SHALL display the total count of transactions monitored in the status card
2. THE AI_Guardian_Page SHALL display the count of transactions that were blocked in the status card
3. WHEN the transaction data is loaded, THE AI_Guardian_Page SHALL replace the hardcoded "checked 24 transactions today" text with the actual transaction count
