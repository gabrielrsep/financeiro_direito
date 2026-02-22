/**
 * Determines if a process or service is fully paid
 * @param valueCharged - The total amount charged
 * @param totalPaid - The total amount paid
 * @returns boolean - true if fully paid, false otherwise
 */
export const isFullyPaid = (valueCharged: number, totalPaid: number): boolean => {
  return valueCharged > 0 && totalPaid >= valueCharged;
};

/**
 * Calculates the remaining balance for a process or service
 * @param valueCharged - The total amount charged
 * @param totalPaid - The total amount paid
 * @returns number - The remaining balance
 */
export const calculateBalance = (valueCharged: number, totalPaid: number): number => {
  return Math.max(0, valueCharged - totalPaid);
};

/**
 * Calculates the payment progress as a percentage
 * @param valueCharged - The total amount charged
 * @param totalPaid - The total amount paid
 * @returns number - The progress percentage (0-100)
 */
export const calculateProgress = (valueCharged: number, totalPaid: number): number => {
  if (valueCharged === 0) return 0;
  return Math.min(Math.round((totalPaid / valueCharged) * 100), 100);
};
