# GOGuardian

**TNG Digital FinHack 2026 — Security and Fraud Track**

> AI-powered scam prevention for TNG eWallet — protecting vulnerable Malaysians before money leaves their wallet.

---

## Overview

GOGuardian is a real-time fraud prevention layer built on top of the TNG eWallet transfer flow. When a user initiates a transfer to an unknown recipient, GOGuardian intercepts the transaction and runs it through a 3-layer AI risk pipeline before any money moves. Trusted family members (Guardians) can approve or block suspicious transactions in real time via Telegram. The system is designed specifically for elderly, B40, and digitally vulnerable users.

---

## The Problem

- Malaysia loses **RM54 billion annually** to scams — approximately 3% of GDP
- Elderly Malaysians lost over **RM552 million between 2021 and 2023**
- B40 and unbanked users are frequently targeted through fake government aid scams via TNG eWallet
- Existing protections are **reactive** — they alert users after money is already gone

GOGuardian intervenes **before** a transaction completes, combining machine learning, large language models, and human oversight in a single flow.

---

## Key Features

### Transfer Protection Flow
- Multi-stage transfer UI: form entry → recipient verification → AI scan → result
- Verified recipients (known contacts and businesses with keywords like `sdn bhd`, `kedai`, `farmasi`) bypass the AI scan entirely and go straight to confirmation
- Unknown recipients trigger the full 3-layer risk pipeline before any transfer is processed

### 3-Layer AI Risk Pipeline
- **Layer 1 — XGBoost Simulation:** Computes a risk score (0–1) based on transaction amount vs. user average and receiver strike count. Auto-approves below 0.3, auto-blocks above 0.8, escalates the grey zone (0.3–0.8) to Layer 2
- **Layer 2 — AWS Bedrock Nova Micro:** LLM analysis of grey-zone transactions. Produces a decision (APPROVE / BLOCK / HOLD), a confidence score, and an explanation in both English and Bahasa Malaysia
- **Layer 3 — Alibaba Cloud Qwen Guardrail:** Audits Layer 2 output for factual grounding, logic consistency, and confidence calibration. Can override Bedrock's decision to HOLD if any check fails

### Guardian (Trustee) System
- Users designate one trusted family member as their Guardian
- When a risky transaction is detected, the Guardian receives a real-time Telegram message with Approve/Block inline buttons
- A 60-second countdown runs on the user's side; if the Guardian responds in time, their decision overrides the AI
- Frontend polls the backend every 3 seconds for the Guardian's response

### GORewards
- Guardians earn 10 points per transaction decision and 50 points when a reported transaction is confirmed as a scam
- Points stored in the `goguardian-rewards` DynamoDB table

### Receiver Reputation
- Any approved transaction can be reported as a scam from transaction history (within a 7-day window)
- Each report increments the receiver's `strikeCount` in the `goguardian-receiver-reputation` table
- Receivers with 3 or more strikes are flagged HIGH_RISK and add +0.5 to the XGBoost score for future transactions

### Transparency
- Risk Score screen shows a circular gauge (0–100), risk level label, and a full AI Pipeline Breakdown panel displaying each layer's verdict, score, confidence, and reason
- All AI explanations include a Bahasa Malaysia version (`reasonBM`) for accessibility

### Trustee Management
- Add, view, and remove trustees (name, phone, relationship)
- TAC (6-digit OTP) required to remove a trustee, with shake animation on wrong input

### Notification Inbox
- Three notification types: alert, trustee decision, transfer confirmation
- Unread indicators and clear-all

### Always-On Protection
- GOGuardian AI toggle is permanently enabled and cannot be disabled by the user

---

## AI Risk Scoring Logic

### Bypass (no AI called)
If the receiver is in the user's verified contacts or the receiver name contains a business keyword (`sdn bhd`, `berhad`, `enterprise`, `trading`, `shop`, `store`, `mart`, `restaurant`, `cafe`, `kedai`, `holdings`, `group`, `services`, `solution`, `tech`, `pharmacy`, `clinic`, `hospital`, `farmasi`):
- Decision: `APPROVED`, `decisionBy: BYPASS`, risk score: 0.05

### Layer 1 — XGBoost Simulation

```
base score = 0.10

amount / userAvgTransaction:
  > 5x  → +0.40
  > 3x  → +0.25
  > 2x  → +0.10

receiver strike count:
  ≥ 3   → +0.50
  ≥ 1   → +0.20

known contact  → -0.30
business name  → -0.20

score clamped to [0, 1]
```

| Score | Verdict | Action |
|---|---|---|
| < 0.30 | SAFE | Auto-approved |
| 0.30 – 0.80 | GREY_ZONE | Escalate to Layer 2 |
| > 0.80 | RISKY | Auto-blocked; Telegram alert sent to Guardian |

### Layer 2 — AWS Bedrock Nova Micro (`apac.amazon.nova-micro-v1:0`)

Called only for grey-zone transactions. Prompt includes: transaction amount, receiver phone and name, XGBoost score, strike count, sender age and income tier, and recent transaction history.

Returns: `decision` (APPROVE / BLOCK / HOLD), `confidence` (0–1), `evidence_used[]`, `reason` (English), `reasonBM` (Bahasa Malaysia).

Fallback on error: decision = `HOLD`, confidence = 0.5.

### Layer 3 — Alibaba Cloud Qwen Guardrail (`qwen-turbo`)

Audits the Bedrock output against three checks:
1. **Factual Grounding** — every item in `evidence_used` must be traceable to the actual context data
2. **Logic Consistency** — the decision must follow from the stated reason, no contradictions
3. **Confidence Calibration** — confidence must be proportional to evidence strength

| Qwen Verdict | Outcome |
|---|---|
| `PASS` | `finalDecision` = Bedrock's decision |
| `OVERRIDE` | `finalDecision` forced to `HOLD` |
| `ESCALATE` | `finalDecision` forced to `HOLD` |

Fallback on error: verdict = `ESCALATE`, finalDecision = `HOLD`.

### Final Mapping (frontend)

```
riskScore = round(xgboostScore × 100)   // 0–100

≤ 30  → Low   / green  — "Safe to proceed"
31–60 → Medium / amber — "Proceed with caution"
> 60  → High  / red   — "High probability of scam"
```

---

## System Architecture

### Frontend → Backend

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/transaction/check` | Submit transaction for 3-layer AI risk analysis |
| GET | `/audit/{senderId}` | Fetch user's full transaction audit log |
| POST | `/receiver/report` | Report a receiver as a scammer |
| GET | `/transaction/status/{txnId}` | Poll for Guardian decision on a pending transaction |

**API Gateway base URL:** `https://vmctgel4cf.execute-api.ap-southeast-1.amazonaws.com/prod`

### Backend Lambda Routes

| Method | Path | Purpose |
|---|---|---|
| POST | `/transaction/check` | Full 3-layer AI pipeline |
| POST | `/transaction/decision` | Guardian approves or blocks a pending transaction |
| POST | `/guardian/link` | Link a Guardian to a protected user |
| GET | `/audit/:userId` | Get all transactions for a user |
| POST | `/receiver/report` | Report scam and update receiver reputation |
| POST | `/webhook/telegram` | Receive Telegram callback_query (Guardian taps Approve/Block) |
| GET | `/transaction/status/:txnId` | Return transaction Guardian decision status |

### Cloud Services

| Service | Region / Endpoint | Usage |
|---|---|---|
| AWS API Gateway | `ap-southeast-1` | REST API entry point |
| AWS DynamoDB | `ap-southeast-1` | 6 tables (users, transactions, guardian-links, receiver-reputation, audit-log, rewards) |
| AWS Bedrock | `ap-southeast-1`, model `apac.amazon.nova-micro-v1:0` | Layer 2 LLM risk analysis |
| Alibaba Cloud Qwen | `dashscope-intl.aliyuncs.com`, model `qwen-turbo` | Layer 3 guardrail |
| Telegram Bot API | `api.telegram.org` | Guardian alert delivery with inline Approve/Block buttons |
| Cloudflare Workers | — | Frontend deployment target |

---

## Tech Stack

| Category | Technology |
|---|---|
| Framework | TanStack Start (SSR), TanStack Router (file-based routing) |
| UI | React 19, Tailwind CSS v4, Radix UI primitives, Lucide React icons |
| Data Fetching | TanStack Query |
| Forms | React Hook Form, Zod |
| Charts | Recharts |
| Notifications | Sonner |
| Backend Runtime | AWS Lambda (via Cloudflare Workers) |
| AI — Layer 2 | AWS Bedrock (`@aws-sdk/client-bedrock-runtime`) |
| AI — Layer 3 | Alibaba Cloud Qwen (`openai` SDK, compatible endpoint) |
| Database | AWS DynamoDB (`@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`) |
| Messaging | Telegram Bot API |
| Deployment | Cloudflare Workers (`@cloudflare/vite-plugin`, `wrangler.jsonc`) |
| Build | Vite 7, TypeScript 5, esbuild |
| Linting / Formatting | ESLint 9, Prettier 3 |

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- npm or pnpm

### Install

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

The app runs at **http://localhost:8080**

### Other Scripts

```bash
npm run build       # production build
npm run build:dev   # development build
npm run preview     # preview production build
npm run lint        # ESLint
npm run format      # Prettier
```

---

## Demo Flow

The app simulates a TNG eWallet on a mobile phone shell (max-width 390px). Navigate through the following screens:

| Step | Route | What to do |
|---|---|---|
| 1 | `/login` | Enter any Malaysian phone number with the +60 prefix and tap Login |
| 2 | `/home` | View the eWallet dashboard (RM 1,250.00 balance). Tap **Transfer** |
| 3 | `/transfer` | Enter an unknown recipient phone number, optional name, and an amount (e.g. RM 500). Tap Send |
| 4 | `/transfer` (checking) | App checks if recipient is known (1.5s animation) |
| 5 | `/transfer` (first-time) | Alert: first-time transfer detected. Guardian is notified via Telegram |
| 6 | `/transfer` (trustee-wait) | 60-second countdown. Guardian can Approve/Block via Telegram. If countdown expires, AI decides |
| 7 | `/transfer` (analysing) | Animated display of XGBoost → Bedrock → Qwen pipeline running |
| 8 | `/risk-score` | View risk gauge, risk level, pipeline breakdown, and final decision (Auto-Blocked / On Hold / Approved) |
| 9 | `/blocked` or `/payment-success` | Blocked: no money moved. Success: receipt with Transaction ID and push notification overlay |
| 10 | `/me` | View transaction history. Tap **Mark as Scam** on an approved transaction to report the receiver |
| 11 | `/trustees` | Add or remove a Guardian (TAC required to remove) |
| 12 | `/inbox` | View guardian alerts, transfer notifications, and scam alerts |
| 13 | `/settings` | GOGuardian protection is always on and cannot be disabled |
