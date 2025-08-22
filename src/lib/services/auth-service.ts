import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

export interface AuthUser {
  id: string
  email: string
  username: string
  full_name?: string
  avatar_url?: string
  credit_score: number
  balance: number
  is_online: boolean
}

export interface SignInCredentials {
  email: string
  password: string
}

export interface SignUpCredentials {
  email: string
  password: string
  username: string
  full_name?: string
}

export interface AuthResponse {
  success: boolean
  user?: AuthUser
  error?: string
}

class AuthService {
  private supabase = createClient()

  async signIn(credentials: SignInCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (data.user) {
        // 获取用户额外的信息
        const { data: userData, error: userError } = await this.supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (userError) {
          return { success: false, error: userError.message }
        }

        // 更新最后登录时间
        await this.supabase
          .from('users')
          .update({ 
            last_login: new Date().toISOString(),
            is_online: true 
          })
          .eq('id', data.user.id)

        const authUser: AuthUser = {
          id: userData.id,
          email: userData.email,
          username: userData.username,
          full_name: userData.full_name,
          avatar_url: userData.avatar_url,
          credit_score: userData.credit_score,
          balance: userData.balance,
          is_online: true,
        }

        return { success: true, user: authUser }
      }

      return { success: false, error: '登录失败' }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '未知错误' 
      }
    }
  }

  async signUp(credentials: SignUpCredentials): Promise<AuthResponse> {
    try {
      // 1. 创建 Supabase Auth 用户
      const { data, error } = await this.supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            username: credentials.username,
            full_name: credentials.full_name,
          },
        },
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (data.user) {
        // 2. 在 users 表中创建用户记录
        const { error: insertError } = await this.supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            username: credentials.username,
            full_name: credentials.full_name,
            credit_score: 600, // 默认信用分数
            balance: 1000, // 默认积分
            is_online: true,
          })

        if (insertError) {
          return { success: false, error: insertError.message }
        }

        // 3. 创建用户偏好设置
        await this.supabase
          .from('user_preferences')
          .insert({
            user_id: data.user.id,
            theme: 'light',
            language: 'zh-CN',
            notifications_enabled: true,
            email_notifications: true,
            push_notifications: true,
          })

        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email!,
          username: credentials.username,
          full_name: credentials.full_name,
          credit_score: 600,
          balance: 1000,
          is_online: true,
        }

        return { success: true, user: authUser }
      }

      return { success: false, error: '注册失败' }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '未知错误' 
      }
    }
  }

  async signOut(): Promise<void> {
    try {
      // 更新用户在线状态
      const { data: { user } } = await this.supabase.auth.getUser()
      if (user) {
        await this.supabase
          .from('users')
          .update({ is_online: false })
          .eq('id', user.id)
      }

      // 退出登录
      await this.supabase.auth.signOut()
    } catch (error) {
      console.error('退出登录失败:', error)
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser()
      
      if (error || !user) {
        return null
      }

      // 获取用户详细信息
      const { data: userData, error: userError } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (userError) {
        return null
      }

      return {
        id: userData.id,
        email: userData.email,
        username: userData.username,
        full_name: userData.full_name,
        avatar_url: userData.avatar_url,
        credit_score: userData.credit_score,
        balance: userData.balance,
        is_online: userData.is_online,
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      return null
    }
  }

  async updateProfile(userData: Partial<AuthUser>): Promise<AuthResponse> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        return { success: false, error: '用户未登录' }
      }

      const { error } = await this.supabase
        .from('users')
        .update({
          username: userData.username,
          full_name: userData.full_name,
          avatar_url: userData.avatar_url,
        })
        .eq('id', user.id)

      if (error) {
        return { success: false, error: error.message }
      }

      // 更新 auth user metadata
      await this.supabase.auth.updateUser({
        data: {
          username: userData.username,
          full_name: userData.full_name,
        },
      })

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '未知错误' 
      }
    }
  }

  async resetPassword(email: string): Promise<AuthResponse> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '未知错误' 
      }
    }
  }

  async updatePassword(newPassword: string): Promise<AuthResponse> {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '未知错误' 
      }
    }
  }

  // 监听认证状态变化
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return this.supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const user = await this.getCurrentUser()
        callback(user)
      } else if (event === 'SIGNED_OUT') {
        callback(null)
      }
    })
  }
}

export const authService = new AuthService()