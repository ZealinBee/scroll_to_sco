'use client'

import { useEffect, useRef, createContext, useContext, useState } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { syncAllDataToCloud, loadAllDataFromCloud } from '@/app/lib/supabase/sync'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({ user: null, isLoading: true })

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthSyncProvider({ children }: { children: React.ReactNode }) {
  const hasSynced = useRef(false)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Handle initial auth state
    const checkAndSync = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setIsLoading(false)

      if (user && !hasSynced.current) {
        hasSynced.current = true

        // First, load any existing cloud data
        const loadResult = await loadAllDataFromCloud()
        if (loadResult.success) {
          console.log('Loaded data from cloud')
        }

        // Then sync any local-only data to cloud
        const syncResult = await syncAllDataToCloud()
        if (syncResult.success) {
          console.log('Synced local data to cloud')
        }
      }
    }

    checkAndSync()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Update user state for any auth event
        setUser(session?.user ?? null)
        setIsLoading(false)

        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user && !hasSynced.current) {
          hasSynced.current = true

          // Load cloud data first
          await loadAllDataFromCloud()

          // Then sync local data
          await syncAllDataToCloud()
        }

        if (event === 'SIGNED_OUT') {
          hasSynced.current = false
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}
