-- Supabase Database Schema for Sezora Live
-- Run this SQL in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name VARCHAR(255) NOT NULL CHECK (length(name) >= 2 AND length(name) <= 255),
  email VARCHAR(255) NOT NULL UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  role VARCHAR(50) NOT NULL CHECK (role IN ('Student', 'Employer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(200) NOT NULL CHECK (length(title) >= 3 AND length(title) <= 200),
  date DATE NOT NULL CHECK (date >= CURRENT_DATE),
  pay VARCHAR(100) NOT NULL CHECK (length(pay) >= 1 AND length(pay) <= 100),
  employer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create applications table (for future job applications feature)
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message TEXT,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, student_id)
);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view all users" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin can manage all users" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = COALESCE(current_setting('app.admin_email', true), 'admin@app.com')
    )
  );

-- Jobs table policies
CREATE POLICY "Everyone can view jobs" ON public.jobs
  FOR SELECT USING (true);

CREATE POLICY "Employers can create jobs" ON public.jobs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'Employer'
    )
    AND auth.uid() = employer_id
  );

CREATE POLICY "Employers can update their own jobs" ON public.jobs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'Employer'
    )
    AND auth.uid() = employer_id
  );

CREATE POLICY "Employers can delete their own jobs" ON public.jobs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'Employer'
    )
    AND auth.uid() = employer_id
  );

CREATE POLICY "Admin can manage all jobs" ON public.jobs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = COALESCE(current_setting('app.admin_email', true), 'admin@app.com')
    )
  );

-- Applications table policies
CREATE POLICY "Students can view their own applications" ON public.applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'Student'
    )
    AND auth.uid() = student_id
  );

CREATE POLICY "Employers can view applications for their jobs" ON public.applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.jobs j ON j.employer_id = u.id
      WHERE u.id = auth.uid() 
      AND u.role = 'Employer'
      AND j.id = job_id
    )
  );

CREATE POLICY "Students can create applications" ON public.applications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'Student'
    )
    AND auth.uid() = student_id
  );

CREATE POLICY "Students can update their own applications" ON public.applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'Student'
    )
    AND auth.uid() = student_id
  );

CREATE POLICY "Employers can update applications for their jobs" ON public.applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.jobs j ON j.employer_id = u.id
      WHERE u.id = auth.uid() 
      AND u.role = 'Employer'
      AND j.id = job_id
    )
  );

CREATE POLICY "Admin can manage all applications" ON public.applications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = COALESCE(current_setting('app.admin_email', true), 'admin@app.com')
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_jobs_employer_id ON public.jobs(employer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_date ON public.jobs(date);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON public.applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_student_id ON public.applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);

-- Create a function to get user stats (for admin dashboard)
CREATE OR REPLACE FUNCTION public.get_user_stats()
RETURNS TABLE (
  total_users BIGINT,
  total_students BIGINT,
  total_employers BIGINT,
  total_jobs BIGINT,
  total_applications BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COUNT(*) FILTER (WHERE role IN ('Student', 'Employer')) AS total_users,
    COUNT(*) FILTER (WHERE role = 'Student') AS total_students,
    COUNT(*) FILTER (WHERE role = 'Employer') AS total_employers,
    (SELECT COUNT(*) FROM public.jobs) AS total_jobs,
    (SELECT COUNT(*) FROM public.applications) AS total_applications
  FROM public.users;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;
GRANT ALL ON public.jobs TO anon, authenticated;
GRANT ALL ON public.applications TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_stats TO authenticated;

-- Insert admin user if it doesn't exist (run this after setting up auth)
-- This should be done manually through Supabase Auth, not via SQL

COMMENT ON TABLE public.users IS 'User profiles extending auth.users';
COMMENT ON TABLE public.jobs IS 'Job postings by employers';
COMMENT ON TABLE public.applications IS 'Job applications by students';
COMMENT ON FUNCTION public.get_user_stats IS 'Returns aggregated user and job statistics for admin dashboard';