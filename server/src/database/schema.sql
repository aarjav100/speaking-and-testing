-- ============================================
-- AI Interview Platform - Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Users profile (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Communication challenges (paragraphs to read)
CREATE TABLE IF NOT EXISTS communication_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    paragraph TEXT NOT NULL,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
    category TEXT DEFAULT 'general',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Practice sessions (stores IMMUTABLE raw transcript)
CREATE TABLE IF NOT EXISTS communication_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES communication_challenges(id),
    expected_text TEXT NOT NULL,
    raw_transcript TEXT NOT NULL,  -- NEVER MODIFY THIS FIELD
    duration INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analysis results
CREATE TABLE IF NOT EXISTS communication_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES communication_sessions(id) ON DELETE CASCADE,
    overall_score INTEGER CHECK (overall_score BETWEEN 0 AND 100),
    speech_accuracy INTEGER CHECK (speech_accuracy BETWEEN 0 AND 100),
    pronunciation_score INTEGER CHECK (pronunciation_score BETWEEN 0 AND 100),
    fluency_score INTEGER CHECK (fluency_score BETWEEN 0 AND 100),
    word_accuracy INTEGER CHECK (word_accuracy BETWEEN 0 AND 100),
    communication_score INTEGER CHECK (communication_score BETWEEN 0 AND 100),
    word_comparison JSONB,
    feedback JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pronunciation issues
CREATE TABLE IF NOT EXISTS pronunciation_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    result_id UUID NOT NULL REFERENCES communication_results(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    expected_pronunciation TEXT,
    detected_form TEXT,
    ipa TEXT,
    severity TEXT CHECK (severity IN ('low', 'medium', 'high')) DEFAULT 'medium',
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Row Level Security Policies
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE pronunciation_issues ENABLE ROW LEVEL SECURITY;

-- Profiles: users can manage their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Challenges: public read access
CREATE POLICY "Anyone can view challenges" ON communication_challenges FOR SELECT USING (true);

-- Sessions: users can manage their own sessions
CREATE POLICY "Users can view own sessions" ON communication_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own sessions" ON communication_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Results: users can view their own results
CREATE POLICY "Users can view own results" ON communication_results FOR SELECT
    USING (session_id IN (SELECT id FROM communication_sessions WHERE user_id = auth.uid()));

-- Pronunciation issues: users can view their own issues
CREATE POLICY "Users can view own pronunciation issues" ON pronunciation_issues FOR SELECT
    USING (result_id IN (
        SELECT cr.id FROM communication_results cr
        JOIN communication_sessions cs ON cr.session_id = cs.id
        WHERE cs.user_id = auth.uid()
    ));

-- Service role can insert into all tables (for backend operations)
CREATE POLICY "Service role insert results" ON communication_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role insert sessions" ON communication_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role insert issues" ON pronunciation_issues FOR INSERT WITH CHECK (true);

-- ============================================
-- Seed Data: Sample Challenges
-- ============================================

INSERT INTO communication_challenges (title, paragraph, difficulty, category) VALUES
(
    'Professional Communication',
    'Effective communication is one of the most important skills for a successful professional career. It allows people to express their ideas clearly, collaborate with others, and build strong relationships.',
    'easy',
    'professional'
),
(
    'Technology Innovation',
    'Technology continues to transform the way we work and communicate. From artificial intelligence to cloud computing, modern innovations are reshaping industries and creating new opportunities for growth and development.',
    'medium',
    'technology'
),
(
    'Leadership Skills',
    'Great leaders inspire others through their actions and words. They demonstrate integrity, empathy, and a clear vision for the future. Leadership is not about authority but about empowering others to achieve their full potential.',
    'medium',
    'leadership'
),
(
    'Problem Solving',
    'Problem solving is a critical skill in every profession. It involves identifying challenges, analyzing possible solutions, and implementing the most effective approach. Strong problem solvers combine creativity with logical thinking to overcome obstacles.',
    'hard',
    'skills'
),
(
    'Team Collaboration',
    'Successful teams are built on trust, open communication, and shared goals. When team members respect each other and contribute their unique strengths, they can accomplish far more than any individual working alone.',
    'easy',
    'teamwork'
);
