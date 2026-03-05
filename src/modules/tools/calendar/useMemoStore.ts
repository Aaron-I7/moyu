import { ref } from 'vue'
import { supabase } from '@/core/supabase/client'
import { useAuth } from '@/composables/useAuth'
import dayjs from 'dayjs'

export interface Memo {
  id: string
  user_id: string
  content: string
  target_date: string
  created_at: string
  updated_at: string
}

export const useMemoStore = () => {
  const { user } = useAuth()
  const memos = ref<Memo[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Fetch memos for a specific month (or date range)
  // To handle the "keep for 1 month" logic, we can filter on the client or server.
  // Here we'll fetch all memos for the current view (e.g. current month +/- 7 days)
  // but strictly speaking the DB stores everything until deleted.
  // The requirement "data can be saved for at most one month" implies we should delete old ones.
  // We can do a cleanup on fetch.
  
  const cleanupOldMemos = async () => {
    if (!user.value || !supabase) return
    const oneMonthAgo = dayjs().subtract(1, 'month').format('YYYY-MM-DD')
    
    const { error: deleteError } = await supabase
      .from('memos')
      .delete()
      .lt('target_date', oneMonthAgo)
      
    if (deleteError) {
      console.error('Failed to cleanup old memos:', deleteError)
    }
  }

  const fetchMemos = async (startDate: string, endDate: string) => {
    if (!user.value || !supabase) return
    loading.value = true
    error.value = null
    
    try {
      // First, try to cleanup old memos (fire and forget)
      cleanupOldMemos()

      const { data, error: fetchError } = await supabase
        .from('memos')
        .select('*')
        .gte('target_date', startDate)
        .lte('target_date', endDate)
        .order('created_at', { ascending: true })

      if (fetchError) throw fetchError
      memos.value = data || []
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching memos:', err)
    } finally {
      loading.value = false
    }
  }

  const addMemo = async (content: string, date: string) => {
    if (!user.value || !supabase) return null
    
    // Validate date: cannot be older than 1 month
    if (dayjs(date).isBefore(dayjs().subtract(1, 'month'))) {
      error.value = 'Cannot add memos older than 1 month'
      return null
    }

    try {
      const { data, error: insertError } = await supabase
        .from('memos')
        .insert({
          user_id: user.value.id,
          content,
          target_date: date
        })
        .select()
        .single()

      if (insertError) throw insertError
      
      if (data) {
        memos.value.push(data)
      }
      return data
    } catch (err: any) {
      error.value = err.message
      console.error('Error adding memo:', err)
      return null
    }
  }

  const updateMemo = async (id: string, content: string) => {
    if (!user.value || !supabase) return false
    
    try {
      const { error: updateError } = await supabase
        .from('memos')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (updateError) throw updateError
      
      const index = memos.value.findIndex(m => m.id === id)
      if (index !== -1 && memos.value[index]) {
        memos.value[index].content = content
        memos.value[index].updated_at = new Date().toISOString()
      }
      return true
    } catch (err: any) {
      error.value = err.message
      console.error('Error updating memo:', err)
      return false
    }
  }

  const deleteMemo = async (id: string) => {
    if (!user.value || !supabase) return false
    
    try {
      const { error: deleteError } = await supabase
        .from('memos')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
      
      memos.value = memos.value.filter(m => m.id !== id)
      return true
    } catch (err: any) {
      error.value = err.message
      console.error('Error deleting memo:', err)
      return false
    }
  }

  const getMemosByDate = (date: string) => {
    return memos.value.filter(m => m.target_date === date)
  }

  const hasMemo = (date: string) => {
    return memos.value.some(m => m.target_date === date)
  }

  return {
    memos,
    loading,
    error,
    fetchMemos,
    addMemo,
    updateMemo,
    deleteMemo,
    getMemosByDate,
    hasMemo
  }
}
