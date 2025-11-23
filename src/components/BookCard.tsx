import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { calculatePenalty, getBookStatus, formatDate, getDaysDisplay } from '@/utils/penalty';
import { Calendar, User, IndianRupee, CheckCircle, Trash2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface BookCardProps {
  book: {
    id: string;
    title: string;
    borrower_name: string;
    borrowed_date: string;
    return_deadline: string;
    returned_date?: string;
    status: string;
  };
  onMarkReturned?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function BookCard({ book, onMarkReturned, onDelete }: BookCardProps) {
  const status = getBookStatus(book.return_deadline, book.status);
  const penalty = calculatePenalty(book.return_deadline);
  const daysDisplay = getDaysDisplay(book.return_deadline, book.status);
  const borrowedDate = new Date(book.borrowed_date);
  const deadlineDate = new Date(book.return_deadline);
  const today = new Date();
  
  const totalDays = Math.ceil((deadlineDate.getTime() - borrowedDate.getTime()) / (24 * 60 * 60 * 1000));
  const daysElapsed = Math.ceil((today.getTime() - borrowedDate.getTime()) / (24 * 60 * 60 * 1000));
  const progress = book.status === 'returned' ? 100 : Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100));

  return (
    <Card className="transition-smooth hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg leading-tight mb-2">{book.title}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{book.borrower_name}</span>
            </div>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Borrowed:</span>
            </div>
            <span className="font-medium">{formatDate(book.borrowed_date)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Due Date:</span>
            </div>
            <span className="font-medium">{formatDate(book.return_deadline)}</span>
          </div>
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>Status:</span>
            <span className={status.variant === 'destructive' ? 'text-destructive' : status.variant === 'warning' ? 'text-warning' : 'text-foreground'}>
              {daysDisplay}
            </span>
          </div>
        </div>

        {penalty > 0 && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
            <IndianRupee className="h-4 w-4 text-destructive" />
            <div className="flex-1">
              <div className="text-xs text-muted-foreground">Penalty</div>
              <div className="font-bold text-destructive">₹{penalty}</div>
            </div>
          </div>
        )}
      </CardContent>

      {book.status === 'borrowed' && (onMarkReturned || onDelete) && (
        <CardFooter className="flex gap-2 pt-3">
          {onMarkReturned && (
            <Button
              onClick={() => onMarkReturned(book.id)}
              size="sm"
              variant="default"
              className="flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Mark Returned
            </Button>
          )}
          {onDelete && (
            <Button
              onClick={() => onDelete(book.id)}
              size="sm"
              variant="destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
