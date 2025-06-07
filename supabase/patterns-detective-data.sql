-- Patterns Detective Data Insert Script
-- Generated data for all levels with sequences under 50000

-- Clear existing data
TRUNCATE TABLE patterns_detective.sequences CASCADE;
TRUNCATE TABLE patterns_detective.pattern_types CASCADE;

-- Insert pattern types for all levels
INSERT INTO patterns_detective.pattern_types (level_id, name, description, formula, difficulty_within_level) VALUES
-- Level 1: Basic Arithmetic
(1, 'plus_any_number', 'Add the same number each time', 'a(n) = a(1) + (n-1)×d', 1),
(1, 'minus_any_number', 'Subtract the same number each time', 'a(n) = a(1) - (n-1)×d', 2),
(1, 'doubling', 'Multiply by 2 each time', 'a(n) = a(1) × 2^(n-1)', 3),
(1, 'skip_counting', 'Count by specific intervals', 'a(n) = a(1) + (n-1)×step', 4),

-- Level 2: Intermediate Patterns
(2, 'square_numbers', 'Perfect squares sequence', 'a(n) = n²', 1),
(2, 'divide_by_2', 'Halve each term', 'a(n) = a(1) ÷ 2^(n-1)', 2),
--(2, 'tripling', 'Multiply by 3 each time', 'a(n) = a(1) × 3^(n-1)', 3),
(2, 'alternating_add_subtract', 'Pattern switches between operations', 'Alternates +a, -b', 3),
(2, 'add_consecutive_numbers', 'Add 1, then 2, then 3, etc', 'a(n) = a(1) + triangular(n-1)', 4),
(2, 'fibonacci_sequence', 'Each number is sum of previous two', 'a(n) = a(n-1) + a(n-2)', 5),

-- Level 3: Advanced Patterns
(3, 'powers_of_numbers', 'Various exponential patterns', 'a(n) = base^f(n)', 1),
(3, 'triangular_numbers', 'n(n+1)/2 formula', 'a(n) = n(n+1)/2', 2),
(3, 'increasing_patterns', 'Differences increase by 1 each time', 'Second differences = 1', 3),
(3, 'quadratic_sequences', 'Second differences are constant', 'a(n) = an² + bn + c', 4),
(3, 'arithmetic_geometric_mix', 'Alternates between add and multiply', 'Mixed operations', 5),

-- Level 4: Expert Patterns
(4, 'prime_numbers', 'Numbers divisible only by 1 and themselves', 'Prime sequence', 1),
(4, 'cube_numbers', 'Perfect cubes sequence', 'a(n) = n³', 2),
(4, 'perfect_squares_complex', 'More complex square patterns', 'Complex square relationships', 3),
(4, 'catalan_numbers', 'Mathematical sequence C_n', 'C(n) = (2n)!/(n!(n+1)!)', 4),
(4, 'powers_of_2_operations', 'Complex exponential patterns', '2^n with operations', 5),

-- Level 5: Master Patterns
(5, 'factorial_sequence', 'n! factorial numbers', 'a(n) = n!', 1),
(5, 'pentagonal_numbers', 'n(3n-1)/2 formula', 'a(n) = n(3n-1)/2', 2),
(5, 'tribonacci', 'Sum of previous three numbers', 'a(n) = a(n-1) + a(n-2) + a(n-3)', 3),
(5, 'lucas_numbers', 'Similar to Fibonacci but starts 2,1', 'Lucas sequence', 4),
(5, 'complex_geometric', 'Multiple operations combined', 'Complex mixed operations', 5),

-- Level 6: Olympic Level
(6, 'powers_of_2_minus_1', '2^n-1 Mersenne-type', 'a(n) = 2^n - 1', 1),
(6, 'sum_of_first_n_integers', 'n(n+1)/2 triangular revisited', 'a(n) = n(n+1)/2', 2),
(6, 'sum_of_first_n_odd', 'n² pattern', 'a(n) = n²', 3),
(6, 'differences_consecutive_squares', '(n+1)²-n² = 2n+1', 'a(n) = 2n+1', 4),
(6, 'tetrahedral_numbers', 'n(n+1)(n+2)/6', 'a(n) = n(n+1)(n+2)/6', 5),
(6, 'bell_numbers', 'Number of ways to partition a set', 'Bell sequence', 6),
(6, 'fibonacci_variants', 'Fibonacci with different starting values', 'Fibonacci variants', 7),
(6, 'powers_alternating_signs', '(-1)^n × a^n', 'Alternating powers', 8),
(6, 'centered_polygonal', '1 + n(n-1)×k/2 for k-gon', 'Centered polygonal', 9),
(6, 'stirling_numbers', 'Stirling numbers of second kind', 'S(n,k)', 10),
(6, 'polynomial_sequences', 'Higher degree polynomials', 'Polynomial patterns', 11),
(6, 'modular_arithmetic', 'a^n mod m patterns', 'Modular arithmetic', 12),
(6, 'recursive_sequences', 'Multiple operations recursively', 'Complex recursion', 13),
(6, 'partition_sequences', 'Partition-related sequences', 'Partition numbers', 14),
(6, 'competition_specific', 'Competition-specific sequences', 'Advanced competition', 15);

-- Insert sequence data for Level 1: Basic Arithmetic
-- Plus any number (9 sequences max)
INSERT INTO patterns_detective.sequences (pattern_type_id, sequence_numbers, sequence_rule) VALUES
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'plus_any_number'), ARRAY[3, 8, 13, 18, 23, 28, 33], '{"operation": "add", "step": 5}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'plus_any_number'), ARRAY[12, 17, 22, 27, 32, 37, 42], '{"operation": "add", "step": 5}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'plus_any_number'), ARRAY[5, 12, 19, 26, 33, 40, 47], '{"operation": "add", "step": 7}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'plus_any_number'), ARRAY[10, 13, 16, 19, 22, 25, 28], '{"operation": "add", "step": 3}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'plus_any_number'), ARRAY[7, 15, 23, 31, 39, 47, 55], '{"operation": "add", "step": 8}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'plus_any_number'), ARRAY[20, 26, 32, 38, 44, 50, 56], '{"operation": "add", "step": 6}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'plus_any_number'), ARRAY[1, 5, 9, 13, 17, 21, 25], '{"operation": "add", "step": 4}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'plus_any_number'), ARRAY[15, 24, 33, 42, 51, 60, 69], '{"operation": "add", "step": 9}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'plus_any_number'), ARRAY[2, 12, 22, 32, 42, 52, 62], '{"operation": "add", "step": 10}');

-- Minus any number (9 sequences max)
INSERT INTO patterns_detective.sequences (pattern_type_id, sequence_numbers, sequence_rule) VALUES
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'minus_any_number'), ARRAY[50, 45, 40, 35, 30, 25, 20], '{"operation": "subtract", "step": 5}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'minus_any_number'), ARRAY[100, 91, 82, 73, 64, 55, 46], '{"operation": "subtract", "step": 9}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'minus_any_number'), ARRAY[77, 71, 65, 59, 53, 47, 41], '{"operation": "subtract", "step": 6}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'minus_any_number'), ARRAY[60, 53, 46, 39, 32, 25, 18], '{"operation": "subtract", "step": 7}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'minus_any_number'), ARRAY[80, 72, 64, 56, 48, 40, 32], '{"operation": "subtract", "step": 8}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'minus_any_number'), ARRAY[45, 41, 37, 33, 29, 25, 21], '{"operation": "subtract", "step": 4}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'minus_any_number'), ARRAY[90, 80, 70, 60, 50, 40, 30], '{"operation": "subtract", "step": 10}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'minus_any_number'), ARRAY[33, 30, 27, 24, 21, 18, 15], '{"operation": "subtract", "step": 3}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'minus_any_number'), ARRAY[120, 108, 96, 84, 72, 60, 48], '{"operation": "subtract", "step": 12}');

-- Doubling (9 sequences max)
INSERT INTO patterns_detective.sequences (pattern_type_id, sequence_numbers, sequence_rule) VALUES
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'doubling'), ARRAY[2, 4, 8, 16, 32, 64, 128], '{"operation": "multiply", "factor": 2}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'doubling'), ARRAY[3, 6, 12, 24, 48, 96, 192], '{"operation": "multiply", "factor": 2}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'doubling'), ARRAY[1, 2, 4, 8, 16, 32, 64], '{"operation": "multiply", "factor": 2}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'doubling'), ARRAY[5, 10, 20, 40, 80, 160, 320], '{"operation": "multiply", "factor": 2}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'doubling'), ARRAY[7, 14, 28, 56, 112, 224, 448], '{"operation": "multiply", "factor": 2}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'doubling'), ARRAY[6, 12, 24, 48, 96, 192, 384], '{"operation": "multiply", "factor": 2}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'doubling'), ARRAY[4, 8, 16, 32, 64, 128, 256], '{"operation": "multiply", "factor": 2}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'doubling'), ARRAY[9, 18, 36, 72, 144, 288, 576], '{"operation": "multiply", "factor": 2}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'doubling'), ARRAY[25, 50, 100, 200, 400, 800, 1600], '{"operation": "multiply", "factor": 2}');

-- Skip counting (9 sequences max)
INSERT INTO patterns_detective.sequences (pattern_type_id, sequence_numbers, sequence_rule) VALUES
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'skip_counting'), ARRAY[6, 9, 12, 15, 18, 21, 24], '{"operation": "count_by", "step": 3}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'skip_counting'), ARRAY[15, 20, 25, 30, 35, 40, 45], '{"operation": "count_by", "step": 5}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'skip_counting'), ARRAY[14, 18, 22, 26, 30, 34, 38], '{"operation": "count_by", "step": 4}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'skip_counting'), ARRAY[7, 14, 21, 28, 35, 42, 49], '{"operation": "count_by", "step": 7}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'skip_counting'), ARRAY[12, 18, 24, 30, 36, 42, 48], '{"operation": "count_by", "step": 6}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'skip_counting'), ARRAY[16, 24, 32, 40, 48, 56, 64], '{"operation": "count_by", "step": 8}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'skip_counting'), ARRAY[18, 27, 36, 45, 54, 63, 72], '{"operation": "count_by", "step": 9}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'skip_counting'), ARRAY[20, 30, 40, 50, 60, 70, 80], '{"operation": "count_by", "step": 10}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'skip_counting'), ARRAY[22, 33, 44, 55, 66, 77, 88], '{"operation": "count_by", "step": 11}');

-- Insert sequence data for Level 2: Intermediate Patterns
-- Alternating add/subtract (9 sequences max)
INSERT INTO patterns_detective.sequences (pattern_type_id, sequence_numbers, sequence_rule) VALUES
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'alternating_add_subtract'), ARRAY[10, 15, 12, 17, 14, 19, 16], '{"operations": ["+5", "-3"]}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'alternating_add_subtract'), ARRAY[20, 24, 21, 25, 22, 26, 23], '{"operations": ["+4", "-3"]}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'alternating_add_subtract'), ARRAY[8, 12, 9, 13, 10, 14, 11], '{"operations": ["+4", "-3"]}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'alternating_add_subtract'), ARRAY[5, 11, 7, 13, 9, 15, 11], '{"operations": ["+6", "-4"]}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'alternating_add_subtract'), ARRAY[15, 18, 16, 19, 17, 20, 18], '{"operations": ["+3", "-2"]}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'alternating_add_subtract'), ARRAY[30, 37, 32, 39, 34, 41, 36], '{"operations": ["+7", "-5"]}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'alternating_add_subtract'), ARRAY[12, 20, 14, 22, 16, 24, 18], '{"operations": ["+8", "-6"]}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'alternating_add_subtract'), ARRAY[25, 30, 27, 32, 29, 34, 31], '{"operations": ["+5", "-3"]}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'alternating_add_subtract'), ARRAY[40, 46, 42, 48, 44, 50, 46], '{"operations": ["+6", "-4"]}');

-- Square numbers (9 sequences max)
INSERT INTO patterns_detective.sequences (pattern_type_id, sequence_numbers, sequence_rule) VALUES
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'square_numbers'), ARRAY[1, 4, 9, 16, 25, 36, 49], '{"operation": "square", "formula": "n²"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'square_numbers'), ARRAY[4, 9, 16, 25, 36, 49, 64], '{"operation": "square", "formula": "(n+1)²"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'square_numbers'), ARRAY[9, 16, 25, 36, 49, 64, 81], '{"operation": "square", "formula": "(n+2)²"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'square_numbers'), ARRAY[16, 25, 36, 49, 64, 81, 100], '{"operation": "square", "formula": "(n+3)²"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'square_numbers'), ARRAY[25, 36, 49, 64, 81, 100, 121], '{"operation": "square", "formula": "(n+4)²"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'square_numbers'), ARRAY[36, 49, 64, 81, 100, 121, 144], '{"operation": "square", "formula": "(n+5)²"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'square_numbers'), ARRAY[49, 64, 81, 100, 121, 144, 169], '{"operation": "square", "formula": "(n+6)²"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'square_numbers'), ARRAY[64, 81, 100, 121, 144, 169, 196], '{"operation": "square", "formula": "(n+7)²"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'square_numbers'), ARRAY[81, 100, 121, 144, 169, 196, 225], '{"operation": "square", "formula": "(n+8)²"}');

-- Divide by 2 (7 sequences - limited by 50000 constraint)
INSERT INTO patterns_detective.sequences (pattern_type_id, sequence_numbers, sequence_rule) VALUES
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'divide_by_2'), ARRAY[512, 256, 128, 64, 32, 16, 8], '{"operation": "divide", "factor": 2}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'divide_by_2'), ARRAY[1024, 512, 256, 128, 64, 32, 16], '{"operation": "divide", "factor": 2}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'divide_by_2'), ARRAY[2048, 1024, 512, 256, 128, 64, 32], '{"operation": "divide", "factor": 2}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'divide_by_2'), ARRAY[4096, 2048, 1024, 512, 256, 128, 64], '{"operation": "divide", "factor": 2}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'divide_by_2'), ARRAY[8192, 4096, 2048, 1024, 512, 256, 128], '{"operation": "divide", "factor": 2}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'divide_by_2'), ARRAY[16384, 8192, 4096, 2048, 1024, 512, 256], '{"operation": "divide", "factor": 2}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'divide_by_2'), ARRAY[32768, 16384, 8192, 4096, 2048, 1024, 512], '{"operation": "divide", "factor": 2}');

-- Tripling (5 sequences - limited by 50000 constraint)
-- INSERT INTO patterns_detective.sequences (pattern_type_id, sequence_numbers, sequence_rule) VALUES
-- ((SELECT id FROM patterns_detective.pattern_types WHERE name = 'tripling'), ARRAY[2, 6, 18, 54, 162, 486, 1458], '{"operation": "multiply", "factor": 3}'),
-- ((SELECT id FROM patterns_detective.pattern_types WHERE name = 'tripling'), ARRAY[1, 3, 9, 27, 81, 243, 729], '{"operation": "multiply", "factor": 3}'),
-- ((SELECT id FROM patterns_detective.pattern_types WHERE name = 'tripling'), ARRAY[3, 9, 27, 81, 243, 729, 2187], '{"operation": "multiply", "factor": 3}'),
-- ((SELECT id FROM patterns_detective.pattern_types WHERE name = 'tripling'), ARRAY[4, 12, 36, 108, 324, 972, 2916], '{"operation": "multiply", "factor": 3}'),
-- ((SELECT id FROM patterns_detective.pattern_types WHERE name = 'tripling'), ARRAY[5, 15, 45, 135, 405, 1215, 3645], '{"operation": "multiply", "factor": 3}');

-- Add consecutive numbers (9 sequences max)
INSERT INTO patterns_detective.sequences (pattern_type_id, sequence_numbers, sequence_rule) VALUES
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'add_consecutive_numbers'), ARRAY[5, 6, 8, 11, 15, 20, 26], '{"operation": "add_consecutive", "pattern": "+1,+2,+3,+4,+5,+6"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'add_consecutive_numbers'), ARRAY[10, 11, 13, 16, 20, 25, 31], '{"operation": "add_consecutive", "pattern": "+1,+2,+3,+4,+5,+6"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'add_consecutive_numbers'), ARRAY[3, 4, 6, 9, 13, 18, 24], '{"operation": "add_consecutive", "pattern": "+1,+2,+3,+4,+5,+6"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'add_consecutive_numbers'), ARRAY[7, 8, 10, 13, 17, 22, 28], '{"operation": "add_consecutive", "pattern": "+1,+2,+3,+4,+5,+6"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'add_consecutive_numbers'), ARRAY[12, 13, 15, 18, 22, 27, 33], '{"operation": "add_consecutive", "pattern": "+1,+2,+3,+4,+5,+6"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'add_consecutive_numbers'), ARRAY[15, 16, 18, 21, 25, 30, 36], '{"operation": "add_consecutive", "pattern": "+1,+2,+3,+4,+5,+6"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'add_consecutive_numbers'), ARRAY[20, 21, 23, 26, 30, 35, 41], '{"operation": "add_consecutive", "pattern": "+1,+2,+3,+4,+5,+6"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'add_consecutive_numbers'), ARRAY[1, 2, 4, 7, 11, 16, 22], '{"operation": "add_consecutive", "pattern": "+1,+2,+3,+4,+5,+6"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'add_consecutive_numbers'), ARRAY[25, 26, 28, 31, 35, 40, 46], '{"operation": "add_consecutive", "pattern": "+1,+2,+3,+4,+5,+6"}');

-- Fibonacci sequence (9 sequences max)
INSERT INTO patterns_detective.sequences (pattern_type_id, sequence_numbers, sequence_rule) VALUES
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'fibonacci_sequence'), ARRAY[1, 1, 2, 3, 5, 8, 13], '{"operation": "fibonacci", "formula": "F(n) = F(n-1) + F(n-2)"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'fibonacci_sequence'), ARRAY[2, 3, 5, 8, 13, 21, 34], '{"operation": "fibonacci", "formula": "F(n) = F(n-1) + F(n-2)"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'fibonacci_sequence'), ARRAY[3, 5, 8, 13, 21, 34, 55], '{"operation": "fibonacci", "formula": "F(n) = F(n-1) + F(n-2)"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'fibonacci_sequence'), ARRAY[1, 2, 3, 5, 8, 13, 21], '{"operation": "fibonacci", "start": [1,2]}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'fibonacci_sequence'), ARRAY[2, 2, 4, 6, 10, 16, 26], '{"operation": "fibonacci", "start": [2,2]}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'fibonacci_sequence'), ARRAY[5, 8, 13, 21, 34, 55, 89], '{"operation": "fibonacci", "formula": "F(n) = F(n-1) + F(n-2)"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'fibonacci_sequence'), ARRAY[8, 13, 21, 34, 55, 89, 144], '{"operation": "fibonacci", "formula": "F(n) = F(n-1) + F(n-2)"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'fibonacci_sequence'), ARRAY[13, 21, 34, 55, 89, 144, 233], '{"operation": "fibonacci", "formula": "F(n) = F(n-1) + F(n-2)"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'fibonacci_sequence'), ARRAY[4, 7, 11, 18, 29, 47, 76], '{"operation": "fibonacci", "start": [4,7]}');

-- Insert sequence data for Level 3: Advanced Patterns
-- Powers of numbers (6 sequences - limited by 50000 constraint)
INSERT INTO patterns_detective.sequences (pattern_type_id, sequence_numbers, sequence_rule) VALUES
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'powers_of_numbers'), ARRAY[3, 9, 27, 81, 243, 729, 2187], '{"operation": "power", "base": 3, "formula": "3^n"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'powers_of_numbers'), ARRAY[2, 8, 32, 128, 512, 2048, 8192], '{"operation": "power", "formula": "2^(2n-1)"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'powers_of_numbers'), ARRAY[1, 16, 81, 256, 625, 1296, 2401], '{"operation": "power", "formula": "n^4"}'),
-- ((SELECT id FROM patterns_detective.pattern_types WHERE name = 'powers_of_numbers'), ARRAY[4, 16, 64, 256, 1024, 4096, 16384], '{"operation": "power", "formula": "4^n"}'),
-- ((SELECT id FROM patterns_detective.pattern_types WHERE name = 'powers_of_numbers'), ARRAY[5, 25, 125, 625, 3125, 15625, 78125], '{"operation": "power", "formula": "5^n"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'powers_of_numbers'), ARRAY[2, 8, 32, 128, 512, 2048, 8192], '{"operation": "power", "formula": "2^(2n+1)"}');

-- Triangular numbers (9 sequences max)
INSERT INTO patterns_detective.sequences (pattern_type_id, sequence_numbers, sequence_rule) VALUES
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'triangular_numbers'), ARRAY[1, 3, 6, 10, 15, 21, 28], '{"operation": "triangular", "formula": "n(n+1)/2"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'triangular_numbers'), ARRAY[3, 6, 10, 15, 21, 28, 36], '{"operation": "triangular", "formula": "n(n+1)/2, start n=2"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'triangular_numbers'), ARRAY[6, 10, 15, 21, 28, 36, 45], '{"operation": "triangular", "formula": "n(n+1)/2, start n=3"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'triangular_numbers'), ARRAY[10, 15, 21, 28, 36, 45, 55], '{"operation": "triangular", "formula": "n(n+1)/2, start n=4"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'triangular_numbers'), ARRAY[15, 21, 28, 36, 45, 55, 66], '{"operation": "triangular", "formula": "n(n+1)/2, start n=5"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'triangular_numbers'), ARRAY[21, 28, 36, 45, 55, 66, 78], '{"operation": "triangular", "formula": "n(n+1)/2, start n=6"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'triangular_numbers'), ARRAY[28, 36, 45, 55, 66, 78, 91], '{"operation": "triangular", "formula": "n(n+1)/2, start n=7"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'triangular_numbers'), ARRAY[36, 45, 55, 66, 78, 91, 105], '{"operation": "triangular", "formula": "n(n+1)/2, start n=8"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'triangular_numbers'), ARRAY[45, 55, 66, 78, 91, 105, 120], '{"operation": "triangular", "formula": "n(n+1)/2, start n=9"}');

-- Increasing patterns (9 sequences max)
INSERT INTO patterns_detective.sequences (pattern_type_id, sequence_numbers, sequence_rule) VALUES
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'increasing_patterns'), ARRAY[2, 4, 7, 11, 16, 22, 29], '{"operation": "increasing_diff", "pattern": "+2,+3,+4,+5,+6,+7"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'increasing_patterns'), ARRAY[5, 7, 10, 14, 19, 25, 32], '{"operation": "increasing_diff", "pattern": "+2,+3,+4,+5,+6,+7"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'increasing_patterns'), ARRAY[1, 3, 6, 10, 15, 21, 28], '{"operation": "increasing_diff", "pattern": "+2,+3,+4,+5,+6,+7"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'increasing_patterns'), ARRAY[10, 12, 15, 19, 24, 30, 37], '{"operation": "increasing_diff", "pattern": "+2,+3,+4,+5,+6,+7"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'increasing_patterns'), ARRAY[3, 5, 8, 12, 17, 23, 30], '{"operation": "increasing_diff", "pattern": "+2,+3,+4,+5,+6,+7"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'increasing_patterns'), ARRAY[8, 10, 13, 17, 22, 28, 35], '{"operation": "increasing_diff", "pattern": "+2,+3,+4,+5,+6,+7"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'increasing_patterns'), ARRAY[12, 14, 17, 21, 26, 32, 39], '{"operation": "increasing_diff", "pattern": "+2,+3,+4,+5,+6,+7"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'increasing_patterns'), ARRAY[7, 9, 12, 16, 21, 27, 34], '{"operation": "increasing_diff", "pattern": "+2,+3,+4,+5,+6,+7"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'increasing_patterns'), ARRAY[15, 17, 20, 24, 29, 35, 42], '{"operation": "increasing_diff", "pattern": "+2,+3,+4,+5,+6,+7"}');

-- Quadratic sequences (9 sequences max)
INSERT INTO patterns_detective.sequences (pattern_type_id, sequence_numbers, sequence_rule) VALUES
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'quadratic_sequences'), ARRAY[2, 5, 10, 17, 26, 37, 50], '{"operation": "quadratic", "second_diff": 2}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'quadratic_sequences'), ARRAY[1, 6, 15, 28, 45, 66, 91], '{"operation": "quadratic", "second_diff": 4}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'quadratic_sequences'), ARRAY[4, 9, 16, 25, 36, 49, 64], '{"operation": "quadratic", "formula": "n²"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'quadratic_sequences'), ARRAY[3, 8, 15, 24, 35, 48, 63], '{"operation": "quadratic", "second_diff": 2}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'quadratic_sequences'), ARRAY[5, 12, 23, 38, 57, 80, 107], '{"operation": "quadratic", "second_diff": 4}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'quadratic_sequences'), ARRAY[7, 14, 25, 40, 59, 82, 109], '{"operation": "quadratic", "second_diff": 4}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'quadratic_sequences'), ARRAY[6, 11, 20, 33, 50, 71, 96], '{"operation": "quadratic", "second_diff": 4}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'quadratic_sequences'), ARRAY[9, 16, 27, 42, 61, 84, 111], '{"operation": "quadratic", "second_diff": 4}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'quadratic_sequences'), ARRAY[1, 4, 9, 16, 25, 36, 49], '{"operation": "quadratic", "formula": "n²"}');

-- Arithmetic-Geometric mix (9 sequences max)
INSERT INTO patterns_detective.sequences (pattern_type_id, sequence_numbers, sequence_rule) VALUES
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'arithmetic_geometric_mix'), ARRAY[2, 7, 14, 19, 38, 43, 86], '{"operation": "alt_add_mult", "pattern": "+5,×2"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'arithmetic_geometric_mix'), ARRAY[3, 9, 12, 36, 39, 117, 120], '{"operation": "alt_mult_add", "pattern": "×3,+3"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'arithmetic_geometric_mix'), ARRAY[5, 10, 13, 26, 29, 58, 61], '{"operation": "alt_mult_add", "pattern": "×2,+3"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'arithmetic_geometric_mix'), ARRAY[4, 12, 16, 48, 52, 156, 160], '{"operation": "alt_mult_add", "pattern": "×3,+4"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'arithmetic_geometric_mix'), ARRAY[6, 11, 22, 27, 54, 59, 118], '{"operation": "alt_add_mult", "pattern": "+5,×2"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'arithmetic_geometric_mix'), ARRAY[1, 4, 8, 11, 22, 25, 50], '{"operation": "alt_add_mult", "pattern": "+3,×2"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'arithmetic_geometric_mix'), ARRAY[7, 21, 28, 84, 91, 273, 280], '{"operation": "alt_mult_add", "pattern": "×3,+7"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'arithmetic_geometric_mix'), ARRAY[8, 13, 26, 31, 62, 67, 134], '{"operation": "alt_add_mult", "pattern": "+5,×2"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'arithmetic_geometric_mix'), ARRAY[9, 18, 21, 42, 45, 90, 93], '{"operation": "alt_mult_add", "pattern": "×2,+3"}');

-- Insert sequence data for Level 4: Expert Patterns
-- Prime numbers (9 sequences max)
INSERT INTO patterns_detective.sequences (pattern_type_id, sequence_numbers, sequence_rule) VALUES
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'prime_numbers'), ARRAY[2, 3, 5, 7, 11, 13, 17], '{"operation": "prime", "sequence": "first_primes"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'prime_numbers'), ARRAY[3, 5, 7, 11, 13, 17, 19], '{"operation": "prime", "sequence": "primes_from_3"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'prime_numbers'), ARRAY[7, 11, 13, 17, 19, 23, 29], '{"operation": "prime", "sequence": "primes_from_7"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'prime_numbers'), ARRAY[11, 13, 17, 19, 23, 29, 31], '{"operation": "prime", "sequence": "primes_from_11"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'prime_numbers'), ARRAY[13, 17, 19, 23, 29, 31, 37], '{"operation": "prime", "sequence": "primes_from_13"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'prime_numbers'), ARRAY[17, 19, 23, 29, 31, 37, 41], '{"operation": "prime", "sequence": "primes_from_17"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'prime_numbers'), ARRAY[19, 23, 29, 31, 37, 41, 43], '{"operation": "prime", "sequence": "primes_from_19"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'prime_numbers'), ARRAY[23, 29, 31, 37, 41, 43, 47], '{"operation": "prime", "sequence": "primes_from_23"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'prime_numbers'), ARRAY[29, 31, 37, 41, 43, 47, 53], '{"operation": "prime", "sequence": "primes_from_29"}');

-- Cube numbers (9 sequences max)
INSERT INTO patterns_detective.sequences (pattern_type_id, sequence_numbers, sequence_rule) VALUES
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'cube_numbers'), ARRAY[1, 8, 27, 64, 125, 216, 343], '{"operation": "cube", "formula": "n³"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'cube_numbers'), ARRAY[8, 27, 64, 125, 216, 343, 512], '{"operation": "cube", "formula": "(n+1)³"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'cube_numbers'), ARRAY[27, 64, 125, 216, 343, 512, 729], '{"operation": "cube", "formula": "(n+2)³"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'cube_numbers'), ARRAY[64, 125, 216, 343, 512, 729, 1000], '{"operation": "cube", "formula": "(n+3)³"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'cube_numbers'), ARRAY[125, 216, 343, 512, 729, 1000, 1331], '{"operation": "cube", "formula": "(n+4)³"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'cube_numbers'), ARRAY[216, 343, 512, 729, 1000, 1331, 1728], '{"operation": "cube", "formula": "(n+5)³"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'cube_numbers'), ARRAY[343, 512, 729, 1000, 1331, 1728, 2197], '{"operation": "cube", "formula": "(n+6)³"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'cube_numbers'), ARRAY[512, 729, 1000, 1331, 1728, 2197, 2744], '{"operation": "cube", "formula": "(n+7)³"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'cube_numbers'), ARRAY[729, 1000, 1331, 1728, 2197, 2744, 3375], '{"operation": "cube", "formula": "(n+8)³"}');

-- Perfect squares complex (9 sequences max)
INSERT INTO patterns_detective.sequences (pattern_type_id, sequence_numbers, sequence_rule) VALUES
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'perfect_squares_complex'), ARRAY[4, 16, 36, 64, 100, 144, 196], '{"operation": "even_squares", "formula": "(2n)²"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'perfect_squares_complex'), ARRAY[9, 25, 49, 81, 121, 169, 225], '{"operation": "odd_squares", "formula": "(2n+1)²"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'perfect_squares_complex'), ARRAY[1, 9, 25, 49, 81, 121, 169], '{"operation": "odd_squares", "formula": "(2n-1)²"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'perfect_squares_complex'), ARRAY[16, 36, 64, 100, 144, 196, 256], '{"operation": "even_squares", "formula": "(2n+2)²"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'perfect_squares_complex'), ARRAY[25, 49, 81, 121, 169, 225, 289], '{"operation": "odd_squares", "formula": "(2n+3)²"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'perfect_squares_complex'), ARRAY[36, 64, 100, 144, 196, 256, 324], '{"operation": "even_squares", "formula": "(2n+4)²"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'perfect_squares_complex'), ARRAY[49, 81, 121, 169, 225, 289, 361], '{"operation": "odd_squares", "formula": "(2n+5)²"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'perfect_squares_complex'), ARRAY[64, 100, 144, 196, 256, 324, 400], '{"operation": "even_squares", "formula": "(2n+6)²"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'perfect_squares_complex'), ARRAY[81, 121, 169, 225, 289, 361, 441], '{"operation": "odd_squares", "formula": "(2n+7)²"}');

-- Catalan numbers (4 sequences - limited by 50000 constraint)
INSERT INTO patterns_detective.sequences (pattern_type_id, sequence_numbers, sequence_rule) VALUES
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'catalan_numbers'), ARRAY[1, 1, 2, 5, 14, 42, 132], '{"operation": "catalan", "formula": "C(n) = (2n)!/(n!(n+1)!)"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'catalan_numbers'), ARRAY[1, 2, 5, 14, 42, 132, 429], '{"operation": "catalan", "start": 1}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'catalan_numbers'), ARRAY[2, 5, 14, 42, 132, 429, 1430], '{"operation": "catalan", "start": 2}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'catalan_numbers'), ARRAY[5, 14, 42, 132, 429, 1430, 4862], '{"operation": "catalan", "start": 3}');

-- Powers of 2 with operations (9 sequences max)
INSERT INTO patterns_detective.sequences (pattern_type_id, sequence_numbers, sequence_rule) VALUES
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'powers_of_2_operations'), ARRAY[1, 3, 7, 15, 31, 63, 127], '{"operation": "2^n_minus_1", "formula": "2^n - 1"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'powers_of_2_operations'), ARRAY[3, 7, 15, 31, 63, 127, 255], '{"operation": "2^n_minus_1", "start": 2}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'powers_of_2_operations'), ARRAY[2, 6, 14, 30, 62, 126, 254], '{"operation": "2^n_plus_pattern"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'powers_of_2_operations'), ARRAY[7, 15, 31, 63, 127, 255, 511], '{"operation": "2^n_minus_1", "start": 3}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'powers_of_2_operations'), ARRAY[15, 31, 63, 127, 255, 511, 1023], '{"operation": "2^n_minus_1", "start": 4}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'powers_of_2_operations'), ARRAY[31, 63, 127, 255, 511, 1023, 2047], '{"operation": "2^n_minus_1", "start": 5}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'powers_of_2_operations'), ARRAY[63, 127, 255, 511, 1023, 2047, 4095], '{"operation": "2^n_minus_1", "start": 6}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'powers_of_2_operations'), ARRAY[127, 255, 511, 1023, 2047, 4095, 8191], '{"operation": "2^n_minus_1", "start": 7}');
-- ((SELECT id FROM patterns_detective.pattern_types WHERE name = 'powers_of_2_operations'), ARRAY[255, 511, 1023, 2047, 4095, 8191, 16383], '{"operation": "2^n_minus_1", "start": 8}');

-- Insert sequence data for Level 5: Master Patterns
-- Factorial sequence (8 sequences - limited by 50000 constraint)
INSERT INTO patterns_detective.sequences (pattern_type_id, sequence_numbers, sequence_rule) VALUES
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'factorial_sequence'), ARRAY[1, 2, 6, 24, 120, 720, 5040], '{"operation": "factorial", "formula": "n!"}'),
-- ((SELECT id FROM patterns_detective.pattern_types WHERE name = 'factorial_sequence'), ARRAY[2, 6, 24, 120, 720, 5040, 40320], '{"operation": "factorial", "start": 2}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'factorial_sequence'), ARRAY[1, 1, 2, 6, 24, 120, 720], '{"operation": "factorial", "start": 0}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'factorial_sequence'), ARRAY[2, 2, 4, 12, 48, 240, 1440], '{"operation": "factorial_mult", "multiplier": 2}');
-- ((SELECT id FROM patterns_detective.pattern_types WHERE name = 'factorial_sequence'), ARRAY[3, 6, 18, 72, 360, 2160, 15120], '{"operation": "factorial_mult", "multiplier": 3}');

-- Pentagonal numbers (9 sequences max)
INSERT INTO patterns_detective.sequences (pattern_type_id, sequence_numbers, sequence_rule) VALUES
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'pentagonal_numbers'), ARRAY[1, 5, 12, 22, 35, 51, 70], '{"operation": "pentagonal", "formula": "n(3n-1)/2"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'pentagonal_numbers'), ARRAY[5, 12, 22, 35, 51, 70, 92], '{"operation": "pentagonal", "start": 2}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'pentagonal_numbers'), ARRAY[12, 22, 35, 51, 70, 92, 117], '{"operation": "pentagonal", "start": 3}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'pentagonal_numbers'), ARRAY[22, 35, 51, 70, 92, 117, 145], '{"operation": "pentagonal", "start": 4}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'pentagonal_numbers'), ARRAY[35, 51, 70, 92, 117, 145, 176], '{"operation": "pentagonal", "start": 5}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'pentagonal_numbers'), ARRAY[51, 70, 92, 117, 145, 176, 210], '{"operation": "pentagonal", "start": 6}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'pentagonal_numbers'), ARRAY[70, 92, 117, 145, 176, 210, 247], '{"operation": "pentagonal", "start": 7}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'pentagonal_numbers'), ARRAY[92, 117, 145, 176, 210, 247, 287], '{"operation": "pentagonal", "start": 8}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'pentagonal_numbers'), ARRAY[117, 145, 176, 210, 247, 287, 330], '{"operation": "pentagonal", "start": 9}');

-- Tribonacci (6 sequences - limited by 50000 constraint)
INSERT INTO patterns_detective.sequences (pattern_type_id, sequence_numbers, sequence_rule) VALUES
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'tribonacci'), ARRAY[1, 1, 2, 4, 7, 13, 24], '{"operation": "tribonacci", "formula": "F(n) = F(n-1) + F(n-2) + F(n-3)"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'tribonacci'), ARRAY[2, 3, 5, 10, 18, 33, 61], '{"operation": "tribonacci", "start": [2,3,5]}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'tribonacci'), ARRAY[1, 2, 4, 7, 13, 24, 44], '{"operation": "tribonacci", "start": [1,2,4]}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'tribonacci'), ARRAY[3, 5, 8, 16, 29, 53, 98], '{"operation": "tribonacci", "start": [3,5,8]}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'tribonacci'), ARRAY[4, 7, 13, 24, 44, 81, 149], '{"operation": "tribonacci", "start": [4,7,13]}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'tribonacci'), ARRAY[1, 3, 6, 10, 19, 35, 64], '{"operation": "tribonacci", "start": [1,3,6]}');

-- Lucas numbers (9 sequences max)
INSERT INTO patterns_detective.sequences (pattern_type_id, sequence_numbers, sequence_rule) VALUES
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'lucas_numbers'), ARRAY[2, 1, 3, 4, 7, 11, 18], '{"operation": "lucas", "formula": "Lucas sequence"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'lucas_numbers'), ARRAY[1, 3, 4, 7, 11, 18, 29], '{"operation": "lucas", "start": 1}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'lucas_numbers'), ARRAY[3, 4, 7, 11, 18, 29, 47], '{"operation": "lucas", "start": 2}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'lucas_numbers'), ARRAY[4, 7, 11, 18, 29, 47, 76], '{"operation": "lucas", "start": 3}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'lucas_numbers'), ARRAY[7, 11, 18, 29, 47, 76, 123], '{"operation": "lucas", "start": 4}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'lucas_numbers'), ARRAY[11, 18, 29, 47, 76, 123, 199], '{"operation": "lucas", "start": 5}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'lucas_numbers'), ARRAY[18, 29, 47, 76, 123, 199, 322], '{"operation": "lucas", "start": 6}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'lucas_numbers'), ARRAY[29, 47, 76, 123, 199, 322, 521], '{"operation": "lucas", "start": 7}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'lucas_numbers'), ARRAY[47, 76, 123, 199, 322, 521, 843], '{"operation": "lucas", "start": 8}');

-- Complex geometric (6 sequences - limited by 50000 constraint)
INSERT INTO patterns_detective.sequences (pattern_type_id, sequence_numbers, sequence_rule) VALUES
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'complex_geometric'), ARRAY[1, 4, 13, 40, 121, 364, 1093], '{"operation": "3x_plus_1", "formula": "3n+1"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'complex_geometric'), ARRAY[2, 7, 22, 67, 202, 607, 1822], '{"operation": "3x_plus_1", "formula": "3n+1"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'complex_geometric'), ARRAY[3, 10, 31, 94, 283, 850, 2551], '{"operation": "3x_plus_1", "formula": "3n+1"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'complex_geometric'), ARRAY[4, 13, 40, 121, 364, 1093, 3280], '{"operation": "3x_plus_1", "formula": "3n+1"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'complex_geometric'), ARRAY[5, 16, 49, 148, 445, 1336, 4009], '{"operation": "3x_plus_1", "formula": "3n+1"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'complex_geometric'), ARRAY[6, 19, 58, 175, 526, 1579, 4738], '{"operation": "3x_plus_1", "formula": "3n+1"}');

-- Insert sequence data for Level 6: Olympic Level (only 3 sequences per pattern)
-- Powers of 2 minus 1 (3 sequences)
INSERT INTO patterns_detective.sequences (pattern_type_id, sequence_numbers, sequence_rule) VALUES
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'powers_of_2_minus_1'), ARRAY[1, 3, 7, 15, 31, 63, 127], '{"operation": "mersenne", "formula": "2^n - 1"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'powers_of_2_minus_1'), ARRAY[3, 7, 15, 31, 63, 127, 255], '{"operation": "mersenne", "start": 2}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'powers_of_2_minus_1'), ARRAY[7, 15, 31, 63, 127, 255, 511], '{"operation": "mersenne", "start": 3}');

-- Sum of first n integers (3 sequences)
INSERT INTO patterns_detective.sequences (pattern_type_id, sequence_numbers, sequence_rule) VALUES
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'sum_of_first_n_integers'), ARRAY[1, 3, 6, 10, 15, 21, 28], '{"operation": "triangular", "formula": "n(n+1)/2"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'sum_of_first_n_integers'), ARRAY[3, 6, 10, 15, 21, 28, 36], '{"operation": "triangular", "start": 2}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'sum_of_first_n_integers'), ARRAY[10, 15, 21, 28, 36, 45, 55], '{"operation": "triangular", "start": 4}');

-- Sum of first n odd numbers (3 sequences)
INSERT INTO patterns_detective.sequences (pattern_type_id, sequence_numbers, sequence_rule) VALUES
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'sum_of_first_n_odd'), ARRAY[1, 4, 9, 16, 25, 36, 49], '{"operation": "perfect_squares", "formula": "n²"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'sum_of_first_n_odd'), ARRAY[4, 9, 16, 25, 36, 49, 64], '{"operation": "perfect_squares", "start": 2}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'sum_of_first_n_odd'), ARRAY[9, 16, 25, 36, 49, 64, 81], '{"operation": "perfect_squares", "start": 3}');

-- Differences of consecutive squares (3 sequences)
INSERT INTO patterns_detective.sequences (pattern_type_id, sequence_numbers, sequence_rule) VALUES
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'differences_consecutive_squares'), ARRAY[3, 5, 7, 9, 11, 13, 15], '{"operation": "consecutive_square_diff", "formula": "2n+1"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'differences_consecutive_squares'), ARRAY[5, 7, 9, 11, 13, 15, 17], '{"operation": "consecutive_square_diff", "start": 2}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'differences_consecutive_squares'), ARRAY[7, 9, 11, 13, 15, 17, 19], '{"operation": "consecutive_square_diff", "start": 3}');

-- Tetrahedral numbers (3 sequences)
INSERT INTO patterns_detective.sequences (pattern_type_id, sequence_numbers, sequence_rule) VALUES
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'tetrahedral_numbers'), ARRAY[1, 4, 10, 20, 35, 56, 84], '{"operation": "tetrahedral", "formula": "n(n+1)(n+2)/6"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'tetrahedral_numbers'), ARRAY[4, 10, 20, 35, 56, 84, 120], '{"operation": "tetrahedral", "start": 2}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'tetrahedral_numbers'), ARRAY[10, 20, 35, 56, 84, 120, 165], '{"operation": "tetrahedral", "start": 3}');

-- Bell numbers (3 sequences)
INSERT INTO patterns_detective.sequences (pattern_type_id, sequence_numbers, sequence_rule) VALUES
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'bell_numbers'), ARRAY[1, 1, 2, 5, 15, 52, 203], '{"operation": "bell", "formula": "Bell numbers"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'bell_numbers'), ARRAY[1, 2, 5, 15, 52, 203, 877], '{"operation": "bell", "start": 1}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'bell_numbers'), ARRAY[2, 5, 15, 52, 203, 877, 4140], '{"operation": "bell", "start": 2}');

-- Fibonacci variants (3 sequences)
INSERT INTO patterns_detective.sequences (pattern_type_id, sequence_numbers, sequence_rule) VALUES
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'fibonacci_variants'), ARRAY[0, 1, 1, 2, 3, 5, 8], '{"operation": "fibonacci_classic", "start": [0,1]}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'fibonacci_variants'), ARRAY[1, 3, 4, 7, 11, 18, 29], '{"operation": "lucas_type", "start": [1,3]}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'fibonacci_variants'), ARRAY[2, 2, 4, 6, 10, 16, 26], '{"operation": "fibonacci_variant", "start": [2,2]}');

-- Powers with alternating signs (3 sequences)
INSERT INTO patterns_detective.sequences (pattern_type_id, sequence_numbers, sequence_rule) VALUES
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'powers_alternating_signs'), ARRAY[1, -2, 4, -8, 16, -32, 64], '{"operation": "alternating_power", "base": -2}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'powers_alternating_signs'), ARRAY[-1, 3, -9, 27, -81, 243, -729], '{"operation": "alternating_power", "base": -3}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'powers_alternating_signs'), ARRAY[2, -6, 18, -54, 162, -486, 1458], '{"operation": "alternating_mult", "multiplier": -3}');

-- Centered polygonal (3 sequences)
INSERT INTO patterns_detective.sequences (pattern_type_id, sequence_numbers, sequence_rule) VALUES
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'centered_polygonal'), ARRAY[1, 7, 19, 37, 61, 91, 127], '{"operation": "centered_hexagonal", "formula": "3n²-3n+1"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'centered_polygonal'), ARRAY[1, 4, 13, 28, 49, 76, 109], '{"operation": "centered_square", "formula": "2n²-2n+1"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'centered_polygonal'), ARRAY[1, 6, 16, 31, 51, 76, 106], '{"operation": "centered_pentagonal", "formula": "5n²-5n+2/2"}');

-- Stirling numbers (3 sequences)
INSERT INTO patterns_detective.sequences (pattern_type_id, sequence_numbers, sequence_rule) VALUES
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'stirling_numbers'), ARRAY[1, 1, 3, 7, 25, 90, 350], '{"operation": "stirling_second", "k": 2}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'stirling_numbers'), ARRAY[1, 3, 7, 25, 90, 350, 1701], '{"operation": "stirling_second", "k": 3}');
-- ((SELECT id FROM patterns_detective.pattern_types WHERE name = 'stirling_numbers'), ARRAY[1, 7, 25, 90, 350, 1701, 10206], '{"operation": "stirling_second", "k": 4}');

-- Polynomial sequences (3 sequences)
INSERT INTO patterns_detective.sequences (pattern_type_id, sequence_numbers, sequence_rule) VALUES
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'polynomial_sequences'), ARRAY[0, 1, 16, 81, 256, 625, 1296], '{"operation": "fourth_power", "formula": "n⁴"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'polynomial_sequences'), ARRAY[0, 1, 32, 243, 1024, 3125, 7776], '{"operation": "fifth_power", "formula": "n⁵"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'polynomial_sequences'), ARRAY[1, 17, 97, 257, 577, 1057, 1729], '{"operation": "polynomial_sum", "formula": "n⁴+n³+n²+n+1"}');

-- Modular arithmetic (3 sequences)
INSERT INTO patterns_detective.sequences (pattern_type_id, sequence_numbers, sequence_rule) VALUES
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'modular_arithmetic'), ARRAY[1, 2, 4, 1, 2, 4, 1], '{"operation": "mod_power", "base": 2, "mod": 7}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'modular_arithmetic'), ARRAY[1, 3, 4, 2, 1, 3, 4], '{"operation": "mod_power", "base": 3, "mod": 5}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'modular_arithmetic'), ARRAY[2, 4, 3, 1, 2, 4, 3], '{"operation": "mod_power", "base": 2, "mod": 5}');

-- Recursive sequences (3 sequences)
INSERT INTO patterns_detective.sequences (pattern_type_id, sequence_numbers, sequence_rule) VALUES
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'recursive_sequences'), ARRAY[1, 2, 5, 13, 34, 89, 233], '{"operation": "recursive_linear", "formula": "a(n)=3a(n-1)-a(n-2)-1"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'recursive_sequences'), ARRAY[3, 5, 13, 31, 75, 181, 437], '{"operation": "recursive_linear", "formula": "a(n)=2a(n-1)+a(n-2)"}');

-- Partition sequences (3 sequences)
INSERT INTO patterns_detective.sequences (pattern_type_id, sequence_numbers, sequence_rule) VALUES
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'partition_sequences'), ARRAY[1, 2, 3, 5, 7, 11, 15], '{"operation": "partition_count", "formula": "Number of partitions"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'partition_sequences'), ARRAY[1, 1, 2, 3, 5, 8, 13], '{"operation": "distinct_partitions", "formula": "Partitions into distinct parts"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'partition_sequences'), ARRAY[1, 2, 2, 4, 5, 8, 12], '{"operation": "odd_partitions", "formula": "Partitions into odd parts"}');

-- Competition specific (3 sequences)
INSERT INTO patterns_detective.sequences (pattern_type_id, sequence_numbers, sequence_rule) VALUES
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'competition_specific'), ARRAY[3, 6, 14, 30, 62, 126, 254], '{"operation": "power_formula", "formula": "2^(n+1) + 2^(n-1) - 2"}'),
((SELECT id FROM patterns_detective.pattern_types WHERE name = 'competition_specific'), ARRAY[2, 5, 17, 65, 257, 1025, 4097], '{"operation": "power_plus_one", "formula": "4^n + 1"}');