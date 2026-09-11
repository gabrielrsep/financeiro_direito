
function toCents(value: number) {
  return Math.round(Number(value) * 100)
}

/**
 * Determines if a process or service is fully paid
 * @param valueCharged - The total amount charged
 * @param totalPaid - The total amount paid
 * @returns boolean - true if fully paid, false otherwise
 */
export const isFullyPaid = (valueCharged: number, totalPaid: number): boolean => {
  return valueCharged > 0 && toCents(totalPaid) >= toCents(valueCharged);
};

export const financialSub = (a: number, b: number) => (toCents(a) - toCents(b)) / 100
