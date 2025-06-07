import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface PatternSequence {
  id: string
  sequence_numbers: number[]
  pattern_name: string
  level_name: string
  level_display_name: string
  level_order: number
}

export const getSequencesByLevel = async (levelOrder: number): Promise<PatternSequence[]> => {
  try {
    const { data, error } = await supabase
      .from('sequences_with_details')
      .select('*')
      .eq('level_order', levelOrder)
      .order('pattern_name')
    
    if (error) {
      console.error('Error fetching sequences:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Error in getSequencesByLevel:', error)
    return []
  }
}

export const getRandomSequencesByLevel = async (levelOrder: number, limit: number = 3): Promise<PatternSequence[]> => {
  try {
    // For levels 1-3, ensure at least 1 question from each pattern type
    if (levelOrder <= 3 && limit > 1) {
      return await getStratifiedSequencesByLevel(levelOrder, limit)
    }
    
    // For levels 4-6, use original random selection
    const { data, error } = await supabase
      .rpc('get_sequences_by_difficulty', {
        p_min_level: levelOrder,
        p_max_level: levelOrder,
        p_limit: limit
      })
    
    if (error) {
      console.error('Error fetching random sequences:', error)
      return []
    }
    
    return data?.map((item: {
      sequence_id: string;
      sequence_numbers: number[];
      pattern_name: string;
      level_display_name: string;
      difficulty_order: number;
    }) => ({
      id: item.sequence_id,
      sequence_numbers: item.sequence_numbers,
      pattern_name: item.pattern_name,
      level_name: '',
      level_display_name: item.level_display_name,
      level_order: item.difficulty_order
    })) || []
  } catch (error) {
    console.error('Error in getRandomSequencesByLevel:', error)
    return []
  }
}

// Smart shuffle to prevent consecutive questions with same pattern type
const shuffleAvoidingConsecutivePatterns = (sequences: PatternSequence[]): PatternSequence[] => {
  if (sequences.length <= 1) return sequences
  
  const result: PatternSequence[] = []
  const remaining = [...sequences]
  
  // Start with a random sequence
  const firstIndex = Math.floor(Math.random() * remaining.length)
  result.push(remaining.splice(firstIndex, 1)[0])
  
  // For each subsequent position, try to pick a different pattern type
  while (remaining.length > 0) {
    const lastPattern = result[result.length - 1].pattern_name
    
    // Find sequences with different pattern types
    const differentPatterns = remaining.filter(seq => seq.pattern_name !== lastPattern)
    
    let nextSequence: PatternSequence
    if (differentPatterns.length > 0) {
      // Pick randomly from different pattern types
      const randomIndex = Math.floor(Math.random() * differentPatterns.length)
      nextSequence = differentPatterns[randomIndex]
      // Remove from remaining array
      const originalIndex = remaining.findIndex(seq => seq.id === nextSequence.id)
      remaining.splice(originalIndex, 1)
    } else {
      // If no different patterns available, pick any remaining sequence
      const randomIndex = Math.floor(Math.random() * remaining.length)
      nextSequence = remaining.splice(randomIndex, 1)[0]
    }
    
    result.push(nextSequence)
  }
  
  return result
}

// Stratified selection to ensure pattern type diversity for levels 1-3
export const getStratifiedSequencesByLevel = async (levelOrder: number, limit: number): Promise<PatternSequence[]> => {
  try {
    // First, get all sequences for this level to understand pattern types
    const { data: allSequences, error: allError } = await supabase
      .from('sequences_with_details')
      .select('*')
      .eq('level_order', levelOrder)
    
    if (allError) {
      console.error('Error fetching all sequences:', allError)
      return []
    }
    
    if (!allSequences || allSequences.length === 0) {
      return []
    }
    
    // Group sequences by pattern type
    const sequencesByPattern = allSequences.reduce((acc, seq) => {
      const patternName = seq.pattern_name
      if (!acc[patternName]) {
        acc[patternName] = []
      }
      acc[patternName].push(seq)
      return acc
    }, {} as Record<string, any[]>)
    
    const patternTypes = Object.keys(sequencesByPattern)
    const selectedSequences: PatternSequence[] = []
    
    // Step 1: Select at least 1 sequence from each pattern type
    for (const patternType of patternTypes) {
      const patternSequences = sequencesByPattern[patternType]
      const randomIndex = Math.floor(Math.random() * patternSequences.length)
      const selectedSeq = patternSequences[randomIndex]
      
      selectedSequences.push({
        id: selectedSeq.id,
        sequence_numbers: selectedSeq.sequence_numbers,
        pattern_name: selectedSeq.pattern_name,
        level_name: selectedSeq.level_name,
        level_display_name: selectedSeq.level_display_name,
        level_order: selectedSeq.level_order
      })
      
      // Remove selected sequence to avoid duplicates
      patternSequences.splice(randomIndex, 1)
    }
    
    // Step 2: Fill remaining slots randomly from all remaining sequences
    const remainingSlots = limit - selectedSequences.length
    if (remainingSlots > 0) {
      const allRemainingSequences = Object.values(sequencesByPattern).flat()
      
      for (let i = 0; i < remainingSlots && allRemainingSequences.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * allRemainingSequences.length)
        const selectedSeq = allRemainingSequences[randomIndex] as any
        
        selectedSequences.push({
          id: selectedSeq.id,
          sequence_numbers: selectedSeq.sequence_numbers,
          pattern_name: selectedSeq.pattern_name,
          level_name: selectedSeq.level_name,
          level_display_name: selectedSeq.level_display_name,
          level_order: selectedSeq.level_order
        })
        
        // Remove selected sequence to avoid duplicates
        allRemainingSequences.splice(randomIndex, 1)
      }
    }
    
    // Smart shuffle to avoid consecutive questions with same pattern type
    const shuffledSequences = shuffleAvoidingConsecutivePatterns(selectedSequences)
    
    return shuffledSequences
    
  } catch (error) {
    console.error('Error in getStratifiedSequencesByLevel:', error)
    return []
  }
}