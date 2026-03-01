import { createClient } from './client'
import type { GamificationState } from '../gamification'

// Types for Supabase data
export interface UserProfile {
  id: string
  exercise_days_per_week: number
  exercise_minutes_per_session: number
}

export interface AnalysisData {
  id?: string
  user_id?: string
  metrics: {
    shoulder_height_diff_pct: number
    hip_height_diff_pct: number
    trunk_shift_pct: number
    shoulder_rotation_score: number
    hip_rotation_score: number
    scapula_prominence_diff: number
    waist_height_diff_pct: number
    overall_asymmetry_score: number
    higher_shoulder?: 'left' | 'right' | null
    higher_hip?: 'left' | 'right' | null
  }
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH'
  risk_factors: string[]
  recommendations: string[]
  analyzed_at: string
}

export interface ProgressPhoto {
  id: string
  image_data: string
  notes?: string
  photo_date: string
}

export interface XrayAnalysis {
  id?: string
  curve_location: string
  curve_direction: string
  schroth_type: '3C' | '3CP' | '4C' | '4CP'
  severity: string
  primary_cobb_angle: number
  analyzed_at?: string
}

// Check if user is logged in
export async function getCurrentUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ============================================================================
// USER PROFILE
// ============================================================================

export async function syncUserProfile(profile: {
  exerciseDaysPerWeek: number
  exerciseMinutesPerSession: number
}) {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({
      id: user.id,
      exercise_days_per_week: profile.exerciseDaysPerWeek,
      exercise_minutes_per_session: profile.exerciseMinutesPerSession,
    })
    .select()
    .single()

  if (error) {
    console.error('Error syncing user profile:', error)
    return null
  }
  return data
}

export async function loadUserProfile() {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error loading user profile:', error)
    return null
  }

  if (data) {
    return {
      exerciseDaysPerWeek: data.exercise_days_per_week,
      exerciseMinutesPerSession: data.exercise_minutes_per_session,
    }
  }
  return null
}

// ============================================================================
// GAMIFICATION STATE
// ============================================================================

export async function syncGamificationState(state: GamificationState) {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = createClient()
  const { data, error } = await supabase
    .from('gamification_state')
    .upsert({
      user_id: user.id,
      streak_data: state.streakData,
      current_week: state.currentWeek,
      notifications: state.notifications,
    })
    .select()
    .single()

  if (error) {
    console.error('Error syncing gamification state:', error)
    return null
  }
  return data
}

export async function loadGamificationState(): Promise<GamificationState | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = createClient()
  const { data, error } = await supabase
    .from('gamification_state')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error loading gamification state:', error)
    return null
  }

  if (data) {
    return {
      streakData: data.streak_data,
      currentWeek: data.current_week,
      notifications: data.notifications,
      lastUpdated: data.updated_at || new Date().toISOString(),
    }
  }
  return null
}

// ============================================================================
// ANALYSIS DATA
// ============================================================================

export async function syncAnalysisData(analysis: AnalysisData) {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = createClient()

  // First, check if user already has analysis data
  const { data: existing } = await supabase
    .from('analysis_data')
    .select('id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from('analysis_data')
      .update({
        metrics: analysis.metrics,
        risk_level: analysis.risk_level,
        risk_factors: analysis.risk_factors,
        recommendations: analysis.recommendations,
        analyzed_at: analysis.analyzed_at,
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating analysis data:', error)
      return null
    }
    return data
  } else {
    // Insert new
    const { data, error } = await supabase
      .from('analysis_data')
      .insert({
        user_id: user.id,
        metrics: analysis.metrics,
        risk_level: analysis.risk_level,
        risk_factors: analysis.risk_factors,
        recommendations: analysis.recommendations,
        analyzed_at: analysis.analyzed_at,
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting analysis data:', error)
      return null
    }
    return data
  }
}

export async function loadAnalysisData(): Promise<AnalysisData | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = createClient()
  const { data, error } = await supabase
    .from('analysis_data')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error loading analysis data:', error)
    return null
  }

  if (data) {
    return {
      metrics: data.metrics,
      risk_level: data.risk_level,
      risk_factors: data.risk_factors,
      recommendations: data.recommendations,
      analyzed_at: data.analyzed_at,
    }
  }
  return null
}

// ============================================================================
// PROGRESS PHOTOS
// ============================================================================

export async function syncProgressPhoto(photo: { image: string; date: string; notes?: string }) {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = createClient()
  const { data, error } = await supabase
    .from('progress_photos')
    .insert({
      user_id: user.id,
      image_data: photo.image,
      notes: photo.notes,
      photo_date: photo.date,
    })
    .select()
    .single()

  if (error) {
    console.error('Error syncing progress photo:', error)
    return null
  }
  return data
}

export async function loadProgressPhotos(): Promise<ProgressPhoto[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = createClient()
  const { data, error } = await supabase
    .from('progress_photos')
    .select('*')
    .eq('user_id', user.id)
    .order('photo_date', { ascending: false })

  if (error) {
    console.error('Error loading progress photos:', error)
    return []
  }

  return data.map(photo => ({
    id: photo.id,
    image_data: photo.image_data,
    notes: photo.notes,
    photo_date: photo.photo_date,
  }))
}

export async function deleteProgressPhoto(photoId: string) {
  const user = await getCurrentUser()
  if (!user) return false

  const supabase = createClient()
  const { error } = await supabase
    .from('progress_photos')
    .delete()
    .eq('id', photoId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting progress photo:', error)
    return false
  }
  return true
}

// ============================================================================
// X-RAY ANALYSIS
// ============================================================================

export async function syncXrayAnalysis(xray: XrayAnalysis) {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = createClient()

  // Check if user already has xray data
  const { data: existing } = await supabase
    .from('xray_analysis')
    .select('id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (existing) {
    const { data, error } = await supabase
      .from('xray_analysis')
      .update({
        curve_location: xray.curve_location,
        curve_direction: xray.curve_direction,
        schroth_type: xray.schroth_type,
        severity: xray.severity,
        primary_cobb_angle: xray.primary_cobb_angle,
        analyzed_at: xray.analyzed_at || new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating xray analysis:', error)
      return null
    }
    return data
  } else {
    const { data, error } = await supabase
      .from('xray_analysis')
      .insert({
        user_id: user.id,
        curve_location: xray.curve_location,
        curve_direction: xray.curve_direction,
        schroth_type: xray.schroth_type,
        severity: xray.severity,
        primary_cobb_angle: xray.primary_cobb_angle,
        analyzed_at: xray.analyzed_at || new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting xray analysis:', error)
      return null
    }
    return data
  }
}

export async function loadXrayAnalysis(): Promise<XrayAnalysis | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = createClient()
  const { data, error } = await supabase
    .from('xray_analysis')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error loading xray analysis:', error)
    return null
  }

  if (data) {
    return {
      curve_location: data.curve_location,
      curve_direction: data.curve_direction,
      schroth_type: data.schroth_type,
      severity: data.severity,
      primary_cobb_angle: data.primary_cobb_angle,
      analyzed_at: data.analyzed_at,
    }
  }
  return null
}

// ============================================================================
// FULL SYNC - Sync all localStorage data to Supabase on login
// ============================================================================

export async function syncAllDataToCloud() {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Not logged in' }

  try {
    // Sync user profile
    const userProfileStr = localStorage.getItem('userProfile')
    if (userProfileStr) {
      const profile = JSON.parse(userProfileStr)
      await syncUserProfile({
        exerciseDaysPerWeek: profile.exerciseDaysPerWeek || 4,
        exerciseMinutesPerSession: profile.exerciseMinutesPerSession || 15,
      })
    }

    // Sync gamification state
    const gamificationStr = localStorage.getItem('scoliofit_gamification')
    if (gamificationStr) {
      const state = JSON.parse(gamificationStr)
      await syncGamificationState(state)
    }

    // Sync analysis data
    const analysisStr = localStorage.getItem('analysisData')
    if (analysisStr) {
      const analysis = JSON.parse(analysisStr)
      await syncAnalysisData(analysis)
    }

    // Sync xray data from sessionStorage
    const xrayStr = sessionStorage.getItem('xrayAnalysis')
    if (xrayStr) {
      const xray = JSON.parse(xrayStr)
      await syncXrayAnalysis(xray)
    }

    // Sync progress photos
    const photosStr = localStorage.getItem('progressPhotos')
    if (photosStr) {
      const photos = JSON.parse(photosStr)
      for (const photo of photos) {
        await syncProgressPhoto({
          image: photo.image,
          date: photo.date,
          notes: photo.notes,
        })
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error syncing data to cloud:', error)
    return { success: false, error: String(error) }
  }
}

// ============================================================================
// LOAD FROM CLOUD - Load all data from Supabase to localStorage
// ============================================================================

export async function loadAllDataFromCloud() {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Not logged in' }

  try {
    // Load user profile
    const profile = await loadUserProfile()
    if (profile) {
      const existingProfile = localStorage.getItem('userProfile')
      const merged = existingProfile ? { ...JSON.parse(existingProfile), ...profile } : profile
      localStorage.setItem('userProfile', JSON.stringify(merged))
    }

    // Load gamification state
    const gamification = await loadGamificationState()
    if (gamification) {
      localStorage.setItem('scoliofit_gamification', JSON.stringify(gamification))
    }

    // Load analysis data
    const analysis = await loadAnalysisData()
    if (analysis) {
      localStorage.setItem('analysisData', JSON.stringify(analysis))
    }

    // Load xray analysis
    const xray = await loadXrayAnalysis()
    if (xray) {
      sessionStorage.setItem('xrayAnalysis', JSON.stringify(xray))
      sessionStorage.setItem('analysisType', 'xray')
    }

    // Load progress photos
    const photos = await loadProgressPhotos()
    if (photos.length > 0) {
      const formattedPhotos = photos.map(p => ({
        id: p.id,
        image: p.image_data,
        date: p.photo_date,
        notes: p.notes,
      }))
      localStorage.setItem('progressPhotos', JSON.stringify(formattedPhotos))
    }

    return { success: true }
  } catch (error) {
    console.error('Error loading data from cloud:', error)
    return { success: false, error: String(error) }
  }
}
