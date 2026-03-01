'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { syncAllDataToCloud, loadAllDataFromCloud } from '@/app/lib/supabase/sync'

export function AuthSyncProvider({ children }: { children: React.ReactNode }) {
  const hasSynced = useRef(false)

  useEffect(() => {
    const supabase = createClient()

    // Handle initial auth state
    const checkAndSync = async () => {
      const { data: { user } } = await supabase.auth.getUser()

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
        if (event === 'SIGNED_IN' && session?.user && !hasSynced.current) {
          hasSynced.current = true

          // Load cloud data first
          await loadAllDataFromCloud()

          // Then sync local data
          await syncAllDataToCloud()

          // Reload the page to refresh state with cloud data
          window.location.reload()
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

  return <>{children}</>
}
