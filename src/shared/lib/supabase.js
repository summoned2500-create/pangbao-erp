import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kbfjtzbkhclsttemkars.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiZmp0emJraGNsc3R0ZW1rYXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNDI4MTEsImV4cCI6MjA5MDcxODgxMX0.arC20m9UILHOQJkgD7i93Zdt-sfzHyIOMnCDVtqSLKw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 取得指定月份的所有交易資料
export async function fetchTransactionsByMonth(year, month) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .gte('date', startDate)
    .lt('date', endDate)
    .order('date', { ascending: true })

  if (error) {
    console.error('Error fetching transactions:', error)
    return []
  }
  return data
}

// 新增單筆交易
export async function insertTransaction(record) {
  const { data, error } = await supabase
    .from('transactions')
    .insert([record])
    .select()

  if (error) throw error
  return data[0]
}

// 刪除交易
export async function deleteTransaction(id) {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)

  if (error) throw error
}
