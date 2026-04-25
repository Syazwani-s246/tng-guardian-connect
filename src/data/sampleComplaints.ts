export interface ComplaintRecord {
  complaintId: string;
  receiverPhone: string;
  reporterId: string;
  reason: string;
  createdAt: string;
}

export const sampleComplaints: ComplaintRecord[] = [
  {
    complaintId: "uuid-1",
    receiverPhone: "+60 11-2345 6789",
    reporterId: "user-001",
    reason: "Promised investment returns, never delivered",
    createdAt: "2026-04-01T10:00:00.000Z",
  },
  {
    complaintId: "uuid-2",
    receiverPhone: "+60 11-2345 6789",
    reporterId: "user-002",
    reason: "Fake product sale",
    createdAt: "2026-04-05T14:30:00.000Z",
  },
  {
    complaintId: "uuid-3",
    receiverPhone: "+60 11-2345 6789",
    reporterId: "user-003",
    reason: "Impersonated bank officer",
    createdAt: "2026-04-10T09:15:00.000Z",
  },
  {
    complaintId: "uuid-4",
    receiverPhone: "+60 11-2345 6789",
    reporterId: "user-004",
    reason: "Loan scam",
    createdAt: "2026-04-12T16:45:00.000Z",
  },
  {
    complaintId: "uuid-5",
    receiverPhone: "+60 13-9876 5432",
    reporterId: "user-005",
    reason: "Fake lottery winnings",
    createdAt: "2026-03-20T11:00:00.000Z",
  },
  {
    complaintId: "uuid-6",
    receiverPhone: "+60 13-9876 5432",
    reporterId: "user-006",
    reason: "Romance scam",
    createdAt: "2026-03-25T08:20:00.000Z",
  },
  {
    complaintId: "uuid-7",
    receiverPhone: "+60 14-5555 1234",
    reporterId: "user-007",
    reason: "Phishing attempt",
    createdAt: "2026-04-08T13:10:00.000Z",
  },
  {
    complaintId: "uuid-8",
    receiverPhone: "+60 11-2345 6789",
    reporterId: "user-008",
    reason: "Job scam",
    createdAt: "2026-04-15T17:30:00.000Z",
  },
  {
    complaintId: "uuid-9",
    receiverPhone: "+60 13-9876 5432",
    reporterId: "user-009",
    reason: "Fake charity",
    createdAt: "2026-04-02T12:00:00.000Z",
  },
  {
    complaintId: "uuid-10",
    receiverPhone: "+60 14-5555 1234",
    reporterId: "user-010",
    reason: "Unauthorized charges",
    createdAt: "2026-04-11T15:45:00.000Z",
  },
];
