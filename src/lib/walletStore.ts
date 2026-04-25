export const walletStore = {
  balance: 1250.00,
  deduct(amount: number) {
    this.balance = Math.max(0, this.balance - amount);
  },
};
