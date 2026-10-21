'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth/AuthProvider'
import { createBrowserClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

export function useRealtimeLeaderboard(eventId: string) {
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { supabase } = useAuth() // We'll need to add supabase to the auth context

  useEffect(() => {
    let channel: RealtimeChannel

    const fetchLeaderboard = async () => {
      try {
        const supabase = createBrowserClient()
        const { data, error } = await supabase
          .from('score_ledger')
          .select(`
            participant_id,
            points_delta,
            source_type,
            participants!inner (
              id,
              display_name
            )
          `)
          .eq('event_id', eventId)
          .order('points_delta', { ascending: false })
          .limit(100)

        if (error) throw error

        const scores = new Map<string, { 
          participantId: string
          displayName: string
          totalScore: number
          quizScore: number
          bugScore: number
        }>()

        // Initialize with participants
        // We'll need to fetch participants separately

        // For now, just use the score data
        const scores: any[] = error ? [] : (data || [])
        
        const scoresMap = new Map<string, any>()
        
        scores?.forEach(row => {
          const participant = row.participants
          if (!participant) return
          
          const existing = scoresMap.get(participant.id) || {
            participantId: participant.id,
            displayName: participant.display_name,
            totalScore: 0,
            quizScore: 0,
            bugScore: 0,
          }

          existing.totalScore += row.points_delta
          if (row.source_type === 'quiz_answer') {
            existing.quizScore += row.points_delta
          } else if (row.source_type === 'judgement' || row.source_type === 'bug_submission') {
            existing.bugScore += row.points_delta
          }
          
          scoresMap.set(participant.id, existing)
        })

        const leaderboard = Array.from(scoresMap.values())
          .sort((a, b) => b.totalScore - a.totalScore)
          .map((entry, index) => ({
            rank: index + 1,
            ...entry,
          }))

        setLeaderboard(leaderboard)
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard')
        setLoading(false)
      }
    }

    fetchLeaderboard()

    // Subscribe to real-time updates
    const supabase = createBrowserClient()
    channel = supabase
      .channel(`leaderboard:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'score_ledger',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          // Refetch leaderboard on new score
          fetchLeaderboard()
        }
      )
      .subscribe()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [eventId])

  return { leaderboard, loading, error, refetch: () => {} }
}

// We'll need a separate hook for the supabase client
export function useSupabase() {
  const [supabase] = useState(() => createBrowserClient())
  return supabase
}