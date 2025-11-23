import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AddBookDialogProps {
  onBookAdded: () => void;
}

export function AddBookDialog({ onBookAdded }: AddBookDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    borrower_name: '',
    borrowed_date: new Date().toISOString().split('T')[0],
    return_deadline: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('books').insert({
        owner_id: user.id,
        title: formData.title,
        borrower_name: formData.borrower_name,
        borrowed_date: formData.borrowed_date,
        return_deadline: formData.return_deadline,
        status: 'borrowed',
      });

      if (error) throw error;

      toast.success('Book added successfully');
      setOpen(false);
      setFormData({
        title: '',
        borrower_name: '',
        borrowed_date: new Date().toISOString().split('T')[0],
        return_deadline: '',
      });
      onBookAdded();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add book');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="shadow-lg">
          <Plus className="h-5 w-5 mr-2" />
          Add Book
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Book</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Book Title</Label>
            <Input
              id="title"
              placeholder="Enter book title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="borrower">Borrower Name</Label>
            <Input
              id="borrower"
              placeholder="Enter borrower name"
              value={formData.borrower_name}
              onChange={(e) => setFormData({ ...formData, borrower_name: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="borrowed">Borrowed Date</Label>
              <Input
                id="borrowed"
                type="date"
                value={formData.borrowed_date}
                onChange={(e) => setFormData({ ...formData, borrowed_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Return Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.return_deadline}
                onChange={(e) => setFormData({ ...formData, return_deadline: e.target.value })}
                required
                min={formData.borrowed_date}
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Adding...' : 'Add Book'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
