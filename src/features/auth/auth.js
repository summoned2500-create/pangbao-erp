// 簡單密碼保護（個人使用）
const PASSWORD = import.meta.env.VITE_APP_PASSWORD || 'pangbao2024'
const KEY = 'pb_authed'

export const login = (pwd) => {
  if (pwd === PASSWORD) {
    sessionStorage.setItem(KEY, '1')
    return true
  }
  return false
}

export const isAuthed = () => sessionStorage.getItem(KEY) === '1'

export const logout = () => sessionStorage.removeItem(KEY)
