-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles are viewable by everyone (for borrower name display)
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Create books table
CREATE TABLE public.books (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  borrower_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  borrower_name TEXT NOT NULL,
  borrowed_date DATE NOT NULL,
  return_deadline DATE NOT NULL,
  returned_date DATE,
  status TEXT NOT NULL CHECK (status IN ('borrowed', 'returned')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on books
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Owners can view their own books
CREATE POLICY "Owners can view their own books" 
ON public.books 
FOR SELECT 
USING (auth.uid() = owner_id);

-- Borrowers can view books they borrowed
CREATE POLICY "Borrowers can view their borrowed books" 
ON public.books 
FOR SELECT 
USING (auth.uid() = borrower_id);

-- Owners can create their own books
CREATE POLICY "Owners can create books" 
ON public.books 
FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

-- Owners can update their own books
CREATE POLICY "Owners can update their own books" 
ON public.books 
FOR UPDATE 
USING (auth.uid() = owner_id);

-- Owners can delete their own books
CREATE POLICY "Owners can delete their own books" 
ON public.books 
FOR DELETE 
USING (auth.uid() = owner_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for books updated_at
CREATE TRIGGER update_books_updated_at
BEFORE UPDATE ON public.books
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();