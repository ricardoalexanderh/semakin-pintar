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