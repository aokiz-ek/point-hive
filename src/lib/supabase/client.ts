import { createBrowserClient } from '@supabase/ssr'

// 创建一个 mock Supabase 客户端用于在没有配置时的降级
function createMockClient() {
  const mockError = { message: 'Supabase not configured. Using local mode.' }
  
  return {
    auth: {
      signInWithPassword: async () => ({ data: null, error: mockError }),
      signUp: async () => ({ data: null, error: mockError }),
      signOut: async () => ({ error: null }),
      getUser: async () => ({ data: { user: null }, error: mockError }),
      onAuthStateChange: () => ({ data: { subscription: null }, error: mockError })
    },
    from: () => ({
      select: () => ({ data: [], error: mockError }),
      insert: () => ({ data: null, error: mockError }),
      update: () => ({ data: null, error: mockError }),
      delete: () => ({ data: null, error: mockError }),
      eq: function() { return this },
      single: () => ({ data: null, error: mockError }),
      limit: function() { return this },
      order: function() { return this },
      range: function() { return this }
    }),
    channel: () => ({
      on: function() { return this },
      subscribe: () => ({ status: 'error' }),
      unsubscribe: async () => ({ status: 'ok' })
    }),
    removeChannel: () => ({ status: 'ok' })
  } as any
}

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // 如果环境变量不存在，返回 mock 客户端
  if (!supabaseUrl || !supabaseAnonKey) {
    return createMockClient()
  }
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// 创建单例客户端（现在总是返回一个客户端对象）
export const supabase = createClient()