import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { DashboardCard } from '@/components/DashboardCard';
import { BookCard } from '@/components/BookCard';
import { AddBookDialog } from '@/components/AddBookDialog';
import { supabase } from '@/integrations/supabase/client';
import { Book, BookOpen, AlertCircle, Clock, IndianRupee } from 'lucide-react';
import { calculatePenalty, getBookStatus } from '@/utils/penalty';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface BookData {
  id: string;
  title: string;
  borrower_name: string;
  borrowed_date: string;
  return_deadline: string;
  returned_date?: string;
  status: string;
}

interface ProfileData {
  name: string;
}

export default function Dashboard() {
  const [books, setBooks] = useState<BookData[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();

      setProfile(profileData);

      // Load books
      const { data: booksData, error } = await supabase
        .from('books')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBooks(booksData || []);
    } catch (error: any) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReturned = async (bookId: string) => {
    try {
      const { error } = await supabase
        .from('books')
        .update({
          status: 'returned',
          returned_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', bookId);

      if (error) throw error;

      toast.success('Book marked as returned');
      loadData();
    } catch (error: any) {
      toast.error('Failed to update book');
    }
  };

  const handleDelete = async (bookId: string) => {
    if (!confirm('Are you sure you want to delete this book?')) return;

    try {
      const { error } = await supabase.from('books').delete().eq('id', bookId);

      if (error) throw error;

      toast.success('Book deleted');
      loadData();
    } catch (error: any) {
      toast.error('Failed to delete book');
    }
  };

  const totalBooks = books.length;
  const borrowedBooks = books.filter((b) => b.status === 'borrowed');
  const returnedBooks = books.filter((b) => b.status === 'returned');
  
  const overdueBooks = borrowedBooks.filter((b) => {
    const status = getBookStatus(b.return_deadline, b.status);
    return status.label === 'Overdue';
  });

  const dueSoonBooks = borrowedBooks.filter((b) => {
    const status = getBookStatus(b.return_deadline, b.status);
    return status.label === 'Due Soon';
  });

  const totalDebt = borrowedBooks.reduce((sum, book) => {
    return sum + calculatePenalty(book.return_deadline);
  }, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header userName={profile?.name} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold">Your Library</h2>
            <p className="text-muted-foreground mt-1">Track and manage borrowed books</p>
          </div>
          <AddBookDialog onBookAdded={loadData} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <DashboardCard
            title="Total Books"
            value={totalBooks}
            icon={Book}
            description="All entries"
          />
          <DashboardCard
            title="Borrowed"
            value={borrowedBooks.length}
            icon={BookOpen}
            description="Currently out"
          />
          <DashboardCard
            title="Due Soon"
            value={dueSoonBooks.length}
            icon={Clock}
            description="Within 3 days"
            className="border-warning/50"
          />
          <DashboardCard
            title="Overdue"
            value={overdueBooks.length}
            icon={AlertCircle}
            description="Past deadline"
            className="border-destructive/50"
          />
          <DashboardCard
            title="Total Debt"
            value={`₹${totalDebt}`}
            icon={IndianRupee}
            description="Penalties"
            className="border-secondary/50"
          />
        </div>

        {/* Books List */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All ({totalBooks})</TabsTrigger>
            <TabsTrigger value="borrowed">Borrowed ({borrowedBooks.length})</TabsTrigger>
            <TabsTrigger value="returned">Returned ({returnedBooks.length})</TabsTrigger>
            <TabsTrigger value="overdue">Overdue ({overdueBooks.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {loading ? (
              <p className="text-center text-muted-foreground py-12">Loading...</p>
            ) : books.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <BookOpen className="mx-auto h-16 w-16 text-muted-foreground/50" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">No books yet</h3>
                  <p className="text-muted-foreground">Add your first book to start tracking</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {books.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onMarkReturned={book.status === 'borrowed' ? handleMarkReturned : undefined}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="borrowed" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {borrowedBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onMarkReturned={handleMarkReturned}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="returned" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {returnedBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="overdue" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {overdueBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onMarkReturned={handleMarkReturned}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
