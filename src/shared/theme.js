export const COST_CATEGORIES = [
  { value: '餃子皮', label: '餃子皮', color: '#2a7a40', icon: '🥟' },
  { value: '豬肉', label: '豬肉', color: '#ef4444', icon: '🥩' },
  { value: '蔬菜', label: '蔬菜', color: '#6ee7b7', icon: '🥬' },
  { value: '桶裝瓦斯', label: '桶裝瓦斯', color: '#d97706', icon: '🔥' },
  { value: '紙類雜項', label: '紙類雜項', color: '#a5b4fc', icon: '📦' },
]

// 門市營收 (iCHEF POS 管道)
export const ICHEF_CHANNELS = [
  { value: 'iCHEF 門市日結總額', label: '日結總額', color: '#16a34a', icon: '🍽️', hint: '選此項無需再記各支付細項' },
  { value: '門市現金', label: '門市現金', color: '#2a7a40', icon: '💵' },
  { value: 'LINE Pay', label: 'LINE Pay', color: '#15803d', icon: '💚' },
  { value: '全支付', label: '全支付', color: '#34d399', icon: '📱' },
  { value: '台灣 Pay', label: '台灣 Pay', color: '#6ee7b7', icon: '🇹🇼' },
  { value: '信用卡/其他', label: '信用卡/其他', color: '#a5b4fc', icon: '💳' },
]

// 外送營收
export const DELIVERY_CHANNELS = [
  { value: 'Uber Eats 外送', label: 'Uber Eats', color: '#d97706', icon: '🛵', commission: 0.35 },
]

// 全部營收管道（供顯示用）
export const REVENUE_CHANNELS = [...ICHEF_CHANNELS, ...DELIVERY_CHANNELS]

export const formatCurrency = (amount) => {
  if (amount == null) return 'NT$0'
  return `NT$${Number(amount).toLocaleString('zh-TW', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export const getCostCategory = (value) =>
  COST_CATEGORIES.find((c) => c.value === value) || { label: value, color: '#2a7a40', icon: '💰' }

export const getRevenueChannel = (value) =>
  REVENUE_CHANNELS.find((c) => c.value === value) || { label: value, color: '#16a34a', icon: '💰' }
