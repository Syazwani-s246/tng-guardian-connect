# Design Document

## Overview

This design extends the AI Guardian feature with a real transaction log, a review detail view showing the full 3-layer AI verification pipeline, and a new backend Layer 3 Auditor. The frontend replaces hardcoded data with live API data via TanStack Query, and the backend is extended with a new Bedrock invocation for auditing Layer 2 decisions.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (React + TanStack Router/Query)                │
│                                                          │
│  ┌──────────────────────┐   ┌─────────────────────────┐ │
│  │  AI Guardian Page    │   │  Review Detail Sheet     │ │
│  │  (ai-monitor.tsx)    │──▶│  (TransactionReview)     │ │
│  │  - Transaction Log   │   │  - Layer 2 Decision      │ │
│  │  - Summary Header    │   │  - Layer 3 Audit         │ │
│  │  - Loading/Error     │   │  - Transaction Info      │ │
│  └──────────┬───────────┘   └─────────────────────────┘ │
│             │                                            │
│             │ TanStack Query: GET /audit/:userId         │
└─────────────┼────────────────────────────────────────────┘
              │
┌─────────────▼────────────────────────────────────────────┐
│  Backend (AWS Lambda via Cloudflare Workers)              │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │ checkTxn.ts  │─▶│ bedrock.ts   │─▶│ bedrock.ts     │ │
│  │ (Layer 1:    │  │ (Layer 2:    │  │ (Layer 3:      │ │
│  │  XGBoost)    │  │  Claude LLM) │  │  Auditor AI)   │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬─────────┘ │
│         │                 │                  │           │
│         └─────────────────┴──────────────────┘           │
│                           │                              │
│                    ┌──────▼───────┐                      │
│                    │  DynamoDB    │                      │
│                    │  Transactions│                      │
│                    └──────────────┘                      │
│                                                          │
│  ┌──────────────────┐                                    │
│  │ getAuditLog.ts   │ ◀── GET /audit/:userId             │
│  │ (returns txns    │                                    │
│  │  + Layer 3 data) │                                    │
│  └──────────────────┘                                    │
└──────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Transaction Check Flow (Extended)**:
   - Layer 1 (XGBoost) scores the transaction
   - Grey-zone cases (0.3–0.8) go to Layer 2 (Claude via Bedrock)
   - Layer 2 returns a decision → Layer 3 (Auditor AI) verifies it
   - Both Layer 2 and Layer 3 results are stored in DynamoDB

2. **Transaction Log Display Flow**:
   - AI Guardian page mounts → TanStack Query fetches `GET /audit/:userId`
   - Response includes transaction data + Layer 3 audit fields
   - Transaction Log renders with decision-based styling
   - User taps "Review" → Sheet opens with full verification details

## Components

### Backend Changes

#### 1. New Function: `invokeAuditorLLM` in `bedrock.ts`

**Purpose**: Invoke a separate Bedrock model call to audit Layer 2's decision.

**Interface**:
```typescript
interface AuditContext {
  txnId: string;
  transactionDetails: {
    amount: number;
    receiverPhone: string;
    receiverName: string;
    xgboostScore: number;
    strikeCount: number;
  };
  layer2Decision: BedrockDecision;
}

interface AuditResult {
  auditVerdict: "CONFIRMED" | "OVERRIDDEN" | "FLAGGED";
  auditReason: string;
  auditReasonBM: string;
  consistencyScore: number;
}

async function invokeAuditorLLM(context: AuditContext): Promise<AuditResult>
```

**Behavior**:
- Sends a prompt to Bedrock with the transaction context and Layer 2's full output
- Asks the auditor to verify factual grounding (does the reasoning match the data?) and logical consistency (does the conclusion follow from the reasoning?)
- Returns structured `AuditResult`
- On Bedrock failure, returns a safe default: `{ auditVerdict: "FLAGGED", auditReason: "Audit service unavailable", auditReasonBM: "Perkhidmatan audit tidak tersedia.", consistencyScore: 0.0 }`

#### 2. Modified: `checkTransaction.ts`

**Changes**:
- After receiving Layer 2 decision in the AI guardian mode branch, call `invokeAuditorLLM()` with the transaction context and Layer 2 output
- Store the `AuditResult` fields (`auditVerdict`, `auditReason`, `auditReasonBM`, `consistencyScore`) in the transaction record written to DynamoDB
- For BYPASS and XGBOOST decisions, store `null` for all audit fields

#### 3. Modified: `getAuditLog.ts`

**Changes**:
- Include the Layer 3 audit fields in the transaction response mapping: `auditVerdict`, `auditReason`, `auditReasonBM`, `consistencyScore`

### Frontend Changes

#### 4. Modified: `ai-monitor.tsx` — Transaction Log with Live Data

**Changes**:
- Remove hardcoded `log` array
- Add TanStack Query hook to fetch from `GET /audit/:userId`
- Render loading skeleton, error state, or transaction list based on query state
- Each transaction row shows: receiver name, amount (RM), relative timestamp, decision badge, and a "Review" button
- Status card header shows real transaction counts (total, blocked)
- Add state management for selected transaction (for Review Detail View)

**Decision-based styling**:
- APPROVED/APPROVE: green check icon, success background
- BLOCKED/BLOCK: orange warning icon, warning background
- PENDING/HOLD: gray clock icon, neutral background

#### 5. New Component: `TransactionReview.tsx`

**Purpose**: Sheet component displaying full AI verification details for a selected transaction.

**Location**: `src/components/TransactionReview.tsx`

**Props**:
```typescript
interface TransactionReviewProps {
  transaction: TransactionRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

**Structure**:
- Uses shadcn/ui `Sheet` component (slides up from bottom, mobile-friendly)
- **Transaction Info Section**: Receiver name, amount, timestamp, risk score
- **Layer 2 Decision Section**: Decision badge, English reason, BM reason, confidence percentage
- **Layer 3 Audit Section**: Verdict badge, English audit reason, BM audit reason, consistency percentage
- **Conditional rendering**: When `decisionBy` is BYPASS or XGBOOST, both Layer 2 and Layer 3 sections show "Not applicable" messages
- **Override alert**: When `auditVerdict` is OVERRIDDEN, display a highlighted alert showing the discrepancy

### Shared Types

#### 6. New File: `src/types/transaction.ts`

**Purpose**: Shared TypeScript interfaces for transaction data used by both the API response and UI components.

```typescript
interface TransactionRecord {
  txnId: string;
  receiverName: string;
  receiverPhone: string;
  amount: number;
  decision: string;
  decisionBy: string;
  reason: string;
  reasonBM: string;
  riskScore: number;
  confidence?: number;
  timestamp: string;
  reported: boolean;
  canReport: boolean;
  auditVerdict: "CONFIRMED" | "OVERRIDDEN" | "FLAGGED" | null;
  auditReason: string | null;
  auditReasonBM: string | null;
  consistencyScore: number | null;
}
```

## Correctness Properties

### Property 1: Transaction list sort order is preserved
- **Requirement**: 1.5
- **Criteria**: 1.5 — Sort Transaction_Records by timestamp newest first
- **Property**: For any array of TransactionRecord objects, after sorting by timestamp descending, each element's timestamp is greater than or equal to the next element's timestamp
- **Type**: Invariant

### Property 2: Confidence and consistency scores display as valid percentages
- **Requirement**: 3.5, 4.5
- **Criteria**: 3.5 — Display confidence score as percentage; 4.5 — Display consistency score as percentage
- **Property**: For any score value in the range [0.0, 1.0], the formatted percentage output equals `Math.round(score * 100)` and is between 0 and 100 inclusive
- **Type**: Metamorphic

### Property 3: Audit result structure is always valid
- **Requirement**: 5.3
- **Criteria**: 5.3 — Return structured Audit_Result
- **Property**: For any input to `invokeAuditorLLM`, the returned AuditResult always has: auditVerdict in {"CONFIRMED", "OVERRIDDEN", "FLAGGED"}, consistencyScore in [0.0, 1.0], non-empty auditReason, and non-empty auditReasonBM
- **Type**: Invariant

### Property 4: Blocked transaction count is consistent with filtered data
- **Requirement**: 7.2
- **Criteria**: 7.2 — Display blocked transaction count
- **Property**: For any array of TransactionRecord objects, the displayed blocked count equals the number of records where decision equals "BLOCKED"
- **Type**: Metamorphic

### Property 5: Layer 3 audit fields are null if and only if decisionBy is BYPASS or XGBOOST
- **Requirement**: 6.3
- **Criteria**: 6.3 — Store null for BYPASS/XGBOOST transactions
- **Property**: For any stored transaction, auditVerdict is null if and only if decisionBy is "BYPASS" or "XGBOOST"; conversely, auditVerdict is non-null if and only if decisionBy is "AI_GUARDIAN"
- **Type**: Invariant

## Handling Ambiguity

1. **User ID source**: The current codebase doesn't have authentication. The design assumes a hardcoded or context-provided user ID (e.g., from a query parameter or app state). The implementation will use a default user ID consistent with the existing demo pattern.

2. **Layer 3 model selection**: The requirement says "Amazon Bedrock" for Layer 3. The design uses the same Bedrock client but can use a different model ID (e.g., Claude Haiku for cost efficiency since it's doing verification, not primary decision-making).

3. **OVERRIDDEN behavior**: When Layer 3 overrides Layer 2, the design stores both decisions but does NOT change the transaction's primary decision. The override is informational — displayed in the review detail for transparency. Changing the actual decision would require additional business logic and approval flows.

4. **Sheet vs Dialog**: The design uses a Sheet (bottom slide-up) rather than a Dialog because it's more natural for mobile-first UI within the PhoneShell component and allows for scrollable content.

5. **API endpoint reuse**: Rather than creating a new endpoint for transaction details, the design extends the existing `GET /audit/:userId` response to include Layer 3 fields. This avoids an additional API call when opening the review detail.
