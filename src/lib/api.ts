import mockData from "@/data/mockData.json";

// Mock API layer — swap the import above for a fetch() call to connect to a real backend

export async function getUser() {
  return mockData.user;
}

export async function getDemoTransaction() {
  return mockData.demo_transaction;
}

export async function getRecentTransactions() {
  return mockData.recent_transactions;
}

export async function getVerifiedRecipients() {
  return mockData.verified_recipients;
}
