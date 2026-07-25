export function calculateTimeToGoal(
  target: number,
  current: number,
  monthlyContribution: number
): { months: number; date: Date } | null {
  if (monthlyContribution <= 0) return null;
  
  const remaining = target - current;
  if (remaining <= 0) return { months: 0, date: new Date() };

  const months = Math.ceil(remaining / monthlyContribution);
  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() + months);

  return { months, date: targetDate };
}