'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase-client'
import type { User, UserInsert, UserUpdate } from '@/types/database.types'
import type { User as AuthUser } from '@supabase/supabase-js'

interface UseUsersReturn {
  // Auth state
  user: AuthUser | null
  loading: boolean
  
  // User data
  users: User[]
  currentUserProfile: User | null
  
  // Auth methods
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, name?: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  
  // User CRUD methods
  createUser: (userData: UserInsert) => Promise<{ data: User | null; error: string | null }>
  updateUser: (id: string, userData: UserUpdate) => Promise<{ data: User | null; error: string | null }>
  deleteUser: (id: string) => Promise<{ error: string | null }>
  getUserById: (id: string) => Promise<{ data: User | null; error: string | null }>
  getAllUsers: () => Promise<{ data: User[] | null; error: string | null }>
}

export function useUsers(): UseUsersReturn {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [currentUserProfile, setCurrentUserProfile] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      
      // Temporarily disable custom users table queries
      // if (session?.user) {
      //   await fetchCurrentUserProfile(session.user.id)
      // }
      
      setLoading(false)
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        // Temporarily disable custom users table queries
        // if (session?.user) {
        //   await fetchCurrentUserProfile(session.user.id)
        // } else {
        //   setCurrentUserProfile(null)
        // }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchCurrentUserProfile = async (userId: string) => {
    try {
      // Add a small delay to ensure auth state is fully established
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (!error && data) {
        setCurrentUserProfile(data)
        console.log('✅ User profile loaded successfully')
      } else if (error) {
        // Handle common errors gracefully
        if (error.code === 'PGRST116' || error.message.includes('relation "public.users" does not exist')) {
          console.log('ℹ️ Users table not found - using auth user data only')
        } else if (error.code === '42501' || error.message.includes('permission denied') || error.message.includes('row-level security')) {
          console.log('⚠️ Users table access denied - check RLS policies. Error:', error.message)
        } else if (error.code === '406' || error.message.includes('Not Acceptable')) {
          console.log('⚠️ 406 error - likely RLS policy issue. Error:', error.message)
        } else {
          console.log('❌ Error fetching user profile:', error.message, 'Code:', error.code)
        }
      }
    } catch (error) {
      console.log('❌ Unexpected error fetching user profile:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error: error.message }
      }

      router.push('/')
      return { error: null }
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  }

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        return { error: error.message }
      }

      // Temporarily disable custom users table creation
      // if (data.user && name) {
      //   try {
      //     const { error: insertError } = await supabase
      //       .from('users')
      //       .insert({
      //         id: data.user.id,
      //         email: data.user.email!,
      //         name,
      //         password_hash: 'managed_by_supabase_auth',
      //       })
      //     
      //     if (insertError) {
      //       console.log('⚠️ Could not create user profile:', insertError.message)
      //     } else {
      //       console.log('✅ User profile created successfully')
      //     }
      //   } catch (profileError) {
      //     console.log('❌ Could not create user profile:', profileError)
      //   }
      // }

      console.log('✅ User account created successfully with Supabase Auth')
      return { error: null }
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const createUser = async (userData: UserInsert) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single()

      if (error) {
        return { data: null, error: error.message }
      }

      setUsers(prev => [...prev, data])
      return { data, error: null }
    } catch (error) {
      return { data: null, error: 'An unexpected error occurred' }
    }
  }

  const updateUser = async (id: string, userData: UserUpdate) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ ...userData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return { data: null, error: error.message }
      }

      setUsers(prev => prev.map(user => user.id === id ? data : user))
      
      if (currentUserProfile?.id === id) {
        setCurrentUserProfile(data)
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: 'An unexpected error occurred' }
    }
  }

  const deleteUser = async (id: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id)

      if (error) {
        return { error: error.message }
      }

      setUsers(prev => prev.filter(user => user.id !== id))
      return { error: null }
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  }

  const getUserById = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: 'An unexpected error occurred' }
    }
  }

  const getAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        return { data: null, error: error.message }
      }

      setUsers(data || [])
      return { data: data || [], error: null }
    } catch (error) {
      return { data: null, error: 'An unexpected error occurred' }
    }
  }

  return {
    // Auth state
    user,
    loading,
    
    // User data
    users,
    currentUserProfile,
    
    // Auth methods
    signIn,
    signUp,
    signOut,
    
    // User CRUD methods
    createUser,
    updateUser,
    deleteUser,
    getUserById,
    getAllUsers,
  }
} 