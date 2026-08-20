export const COST_CATEGORIES = [
  { value: '餃子皮', label: '餃子皮', color: '#86efac', icon: '🥟' },
  { value: '豬肉', label: '豬肉', color: '#fca5a5', icon: '🥩' },
  { value: '蔬菜', label: '蔬菜', color: '#6ee7b7', icon: '🥬' },
  { value: '桶裝瓦斯', label: '桶裝瓦斯', color: '#fbbf24', icon: '🔥' },
  { value: '紙類雜項', label: '紙類雜項', color: '#a5b4fc', icon: '📦' },
]

export const REVENUE_CHANNELS = [
  { value: '現金', label: '現金', color: '#4ade80', icon: '💵' },
  { value: 'LINE Pay', label: 'LINE Pay', color: '#22c55e', icon: '💚' },
  { value: '全支付', label: '全支付', color: '#34d399', icon: '📱' },
  { value: '台灣 Pay', label: '台灣 Pay', color: '#6ee7b7', icon: '🇹🇼' },
  { value: 'iCHEF', label: 'iCHEF', color: '#86efac', icon: '🍽️' },
  { value: 'Uber Eats', label: 'Uber Eats', color: '#bbf7d0', icon: '🛵' },
]

export const formatCurrency = (amount) => {
  if (amount == null) return 'NT$0'
  return `NT$${Number(amount).toLocaleString('zh-TW', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export const getCostCategory = (value) =>
  COST_CATEGORIES.find((c) => c.value === value) || { label: value, color: '#86efac', icon: '💰' }

export const getRevenueChannel = (value) =>
  REVENUE_CHANNELS.find((c) => c.value === value) || { label: value, color: '#4ade80', icon: '💰' }
