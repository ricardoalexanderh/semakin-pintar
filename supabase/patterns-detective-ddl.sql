-- Supabase DDL for Patterns Detective Game
-- Schema-based Organization

-- Create dedicated schema for Patterns Detective
CREATE SCHEMA IF NOT EXISTS patterns_detective;

-- 1. Create levels table
CREATE TABLE patterns_detective.levels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    difficulty_order INTEGER NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create pattern_types table
CREATE TABLE patterns_detective.pattern_types (
    id SERIAL PRIMARY KEY,
    level_id INTEGER NOT NULL REFERENCES patterns_detective.levels(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    formula TEXT,
    difficulty_within_level INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(level_id, difficulty_within_level),
    UNIQUE(level_id, name)
);

-- 3. Create sequences table
CREATE TABLE patterns_detective.sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_type_id INTEGER NOT NULL REFERENCES patterns_detective.pattern_types(id) ON DELETE CASCADE,
    sequence_numbers INTEGER[] NOT NULL,
    sequence_rule JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT sequences_array_length CHECK (array_length(sequence_numbers, 1) = 7)
);





-- Create indexes for better performance
CREATE INDEX idx_pd_sequences_pattern_type ON patterns_detective.sequences(pattern_type_id);
CREATE INDEX idx_pd_pattern_types_level ON patterns_detective.pattern_types(level_id);
CREATE INDEX idx_pd_levels_difficulty_order ON patterns_detective.levels(difficulty_order);

-- Create updated_at trigger function in patterns_detective schema
CREATE OR REPLACE FUNCTION patterns_detective.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_levels_updated_at 
    BEFORE UPDATE ON patterns_detective.levels 
    FOR EACH ROW EXECUTE FUNCTION patterns_detective.update_updated_at_column();

CREATE TRIGGER update_pattern_types_updated_at 
    BEFORE UPDATE ON patterns_detective.pattern_types 
    FOR EACH ROW EXECUTE FUNCTION patterns_detective.update_updated_at_column();

CREATE TRIGGER update_sequences_updated_at 
    BEFORE UPDATE ON patterns_detective.sequences 
    FOR EACH ROW EXECUTE FUNCTION patterns_detective.update_updated_at_column();

-- Insert initial level data
INSERT INTO patterns_detective.levels (name, display_name, difficulty_order, description) VALUES
('basic_arithmetic', 'Level 1: Basic Arithmetic', 1, 'Simple addition, subtraction, multiplication patterns'),
('intermediate_patterns', 'Level 2: Intermediate Patterns', 2, 'Square numbers, division, powers, and mixed operations'),
('advanced_patterns', 'Level 3: Advanced Patterns', 3, 'Fibonacci, triangular numbers, quadratic sequences'),
('expert_patterns', 'Level 4: Expert Patterns', 4, 'Prime numbers, cube numbers, Catalan numbers'),
('master_patterns', 'Level 5: Master Patterns', 5, 'Factorial, pentagonal, tribonacci, complex patterns'),
('olympic_level', 'Olympic Level: Competition Patterns', 6, 'Math competition sequences for advanced students');



-- Create view for easy querying with level and pattern info in public schema
CREATE OR REPLACE VIEW public.sequences_with_details AS
SELECT 
    s.id,
    s.sequence_numbers,
    s.sequence_rule,
    s.created_at,
    pt.name as pattern_name,
    pt.description as pattern_description,
    pt.formula as pattern_formula,
    pt.difficulty_within_level,
    l.name as level_name,
    l.display_name as level_display_name,
    l.difficulty_order as level_order
FROM patterns_detective.sequences s
JOIN patterns_detective.pattern_types pt ON s.pattern_type_id = pt.id
JOIN patterns_detective.levels l ON pt.level_id = l.id
ORDER BY l.difficulty_order, pt.difficulty_within_level;

-- Create function to get random sequence by level and pattern in public schema
CREATE OR REPLACE FUNCTION public.get_random_sequence(
    p_level_name VARCHAR DEFAULT NULL,
    p_pattern_name VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    sequence_id UUID,
    sequence_numbers INTEGER[],
    pattern_name VARCHAR,
    level_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.sequence_numbers,
        pt.name,
        l.name
    FROM patterns_detective.sequences s
    JOIN patterns_detective.pattern_types pt ON s.pattern_type_id = pt.id
    JOIN patterns_detective.levels l ON pt.level_id = l.id
    WHERE 
        (p_level_name IS NULL OR l.name = p_level_name)
        AND (p_pattern_name IS NULL OR pt.name = p_pattern_name)
    ORDER BY RANDOM()
    LIMIT 1;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

-- Create function to get sequences by difficulty range in public schema
CREATE OR REPLACE FUNCTION public.get_sequences_by_difficulty(
    p_min_level INTEGER DEFAULT 1,
    p_max_level INTEGER DEFAULT 6,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    sequence_id UUID,
    sequence_numbers INTEGER[],
    pattern_name VARCHAR,
    level_display_name VARCHAR,
    difficulty_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.sequence_numbers,
        pt.name,
        l.display_name,
        l.difficulty_order
    FROM patterns_detective.sequences s
    JOIN patterns_detective.pattern_types pt ON s.pattern_type_id = pt.id
    JOIN patterns_detective.levels l ON pt.level_id = l.id
    WHERE l.difficulty_order BETWEEN p_min_level AND p_max_level
    ORDER BY RANDOM()
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

-- Grant permissions following best practices
-- Grant access to patterns_detective schema (for internal data access)
GRANT USAGE ON SCHEMA patterns_detective TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA patterns_detective TO authenticated;

-- Grant access to public functions and views (client-facing)
GRANT SELECT ON public.sequences_with_details TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_random_sequence(VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_sequences_by_difficulty(INTEGER, INTEGER, INTEGER) TO authenticated;

-- Ensure future objects get the same permissions
-- ALTER DEFAULT PRIVILEGES IN SCHEMA patterns_detective GRANT SELECT ON TABLES TO authenticated;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO authenticated;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO authenticated;

-- ====================================================================
-- USAGE EXAMPLES
-- ====================================================================

/*
-- Query examples using schema:
SELECT * FROM patterns_detective.get_random_sequence('basic_arithmetic');
SELECT * FROM patterns_detective.sequences_with_details WHERE level_order = 1;
SELECT * FROM patterns_detective.levels;

-- In your application, you can set the search path:
SET search_path = patterns_detective, public;
-- Then use tables without schema prefix:
SELECT * FROM levels;
SELECT * FROM sequences_with_details;
*/