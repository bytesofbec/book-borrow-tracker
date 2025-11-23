export function calculatePenalty(returnDeadline: string, asOfDate: Date = new Date()): number {
  const deadline = new Date(returnDeadline);
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysOverdue = Math.floor((asOfDate.getTime() - deadline.getTime()) / msPerDay);

  if (daysOverdue <= 0) return 0;

  const firstTierDays = Math.min(daysOverdue, 5);
  const remainingDays = Math.max(0, daysOverdue - 5);

  return firstTierDays * 5 + remainingDays * 10;
}

export function getBookStatus(returnDeadline: string, status: string): {
  label: string;
  variant: 'default' | 'success' | 'warning' | 'destructive';
} {
  if (status === 'returned') {
    return { label: 'Returned', variant: 'success' };
  }

  const deadline = new Date(returnDeadline);
  const today = new Date();
  const daysUntilDue = Math.ceil((deadline.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

  if (daysUntilDue < 0) {
    return { label: 'Overdue', variant: 'destructive' };
  } else if (daysUntilDue <= 3) {
    return { label: 'Due Soon', variant: 'warning' };
  } else {
    return { label: 'Borrowed', variant: 'default' };
  }
}

export function getDaysDisplay(returnDeadline: string, status: string): string {
  if (status === 'returned') {
    return 'Returned';
  }

  const deadline = new Date(returnDeadline);
  const today = new Date();
  const daysUntilDue = Math.ceil((deadline.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

  if (daysUntilDue < 0) {
    const daysOverdue = Math.abs(daysUntilDue);
    return `Overdue by ${daysOverdue} day${daysOverdue === 1 ? '' : 's'}`;
  } else {
    return `${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'} left`;
  }
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
