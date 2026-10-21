'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Code2, Bug, Clock, Loader2, AlertCircle, CheckCircle2, ChevronRight, FileText, Download, Upload } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthProvider'
import { createBrowserClient } from '@/lib/supabase/client'

export default function BugHuntPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [challenges, setChallenges] = useState<any[]>([])
  const [selectedChallenge, setSelectedChallenge] = useState<any | null>(null)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submissionText, setSubmissionText] = useState('')
  const [explanation, setExplanation] = useState('')
  const [activeTab, setActiveTab] = useState<'challenges' | 'submissions'>('challenges')

  const supabase = createBrowserClient()

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/join')
      return
    }
    fetchChallenges()
  }, [user, authLoading])

  const fetchChallenges = async () => {
    try {
      const { data, error } = await supabase
        .from('bug_challenges')
        .select('*')
        .eq('round_id', 'demo-round')
        .eq('published', true)
        .order('created_at')

      if (error) throw error
      setChallenges(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load challenges')
    } finally {
      setLoading(false)
    }
  }

  const fetchSubmissions = async (challengeId: string) => {
    try {
      const { data, error } = await supabase
        .from('bug_submissions')
        .select(`
          *,
          judgements (
            id,
            total_score,
            rationale,
            status
          )
        `)
        .eq('challenge_id', challengeId)
        .eq('participant_id', user?.id || 'demo')

      if (error) throw error
      setSubmissions(data || [])
    } catch (err) {
      console.error('Failed to fetch submissions:', err)
    }
  }

  const handleSubmitSolution = async () => {
    if (!submissionText.trim() || !explanation.trim()) return

    setSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('bug_submissions')
        .insert({
          challenge_id: selectedChallenge?.id,
          participant_id: user?.id || 'demo',
          submission_text: submissionText,
          explanation,
        })
        .select()
        .single()

      if (error) throw error

      setSubmissionText('')
      setExplanation('')
      setSelectedChallenge(null)
      setActiveTab('submissions')
      await fetchSubmissions(selectedChallenge!.id)
    } catch (err) {
      console.error('Failed to submit:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please join the competition first</p>
          <Link href="/join" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Join Competition
          </Link>
        </div>
      )
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Challenges</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/join" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Go Back
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <p className="text-sm font-medium text-gray-900">Bug Hunt</p>
                <p className="text-xs text-gray-500">Find the bugs. Fix the code.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/leaderboard"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Trophy className="w-4 h-4" />
                Leaderboard
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 flex items-center gap-2" role="alert">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="flex gap-2 bg-white rounded-xl p-1 border border-gray-200">
              <button
                onClick={() => setActiveTab('challenges')}
                className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
                  activeTab === 'challenges'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Challenges
              </button>
              <button
                onClick={() => setActiveTab('submissions')}
                className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
                  activeTab === 'submissions'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                My Submissions
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 flex items-center gap-2" role="alert">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'challenges' ? (
            <div>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Bug Hunt Challenges</h1>
                  <p className="text-gray-600 mt-1">Find the bugs. Fix the code. Submit your solution.</p>
                </div>
              </div>

              {challenges.length === 0 ? (
                <div className="text-center py-12">
                  <Bug className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No challenges available</h3>
                  <p className="text-gray-500">Check back when the round starts!</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {challenges.map((challenge) => (
                    <div
                      key={challenge.id}
                      className="group bg-white rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-6"
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                              {challenge.difficulty}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                              {challenge.language}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                              {challenge.points} pts
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{challenge.title}</h3>
                          <p className="text-gray-600 mb-4">{challenge.prompt}</p>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {challenge.time}</span>
                          <span className="flex items-center gap-1"><Code2 className="w-4 h-4" /> {challenge.language}</span>
                        </div>
                      </div>
                      <div className="border-t border-gray-100 pt-4">
                        <pre className="bg-gray-900 rounded-xl p-4 overflow-x-auto text-sm text-gray-100 max-h-64 overflow-y-auto font-mono text-xs line-relaxed">
                          {challenge.starter_code}
                        </pre>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                            {challenge.submission_type === 'patch' ? 'Patch Only' : 
                             challenge.submission_type === 'explanation' ? 'Explanation Only' : 'Patch + Explanation'}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedChallenge(challenge)
                            setActiveTab('challenges')
                          }}
                          className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
                        >
                          Submit Solution
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">My Submissions</h1>
                  <p className="text-gray-600 mt-1">Track your submissions and judge feedback</p>
                </div>
              </div>

              {submissions.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
                  <p className="text-gray-500 mb-6">Submit your first solution to see it here!</p>
                  <button
                    onClick={() => setActiveTab('challenges')}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
                  >
                    Browse Challenges
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="bg-white rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 p-6"
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              submission.status === 'submitted' ? 'bg-gray-100 text-gray-700' :
                              submission.status === 'under_review' ? 'bg-yellow-100 text-yellow-700' :
                              submission.status === 'scored' ? 'bg-green-100 text-green-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {submission.status}
                            </span>
                            <span className="text-sm text-gray-500">
                              Submitted {new Date(submission.received_at).toLocaleString()}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {challenges.find(c => c.id === submission.challenge_id)?.title || 'Unknown Challenge'}
                          </h3>
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{submission.explanation}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {submission.judgements && submission.judgements.length > 0 && (
                            <div className="flex items-center gap-2">
                              {submission.judgements.map((j: any) => (
                                <div key={j.id} className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  j.status === 'approved' ? 'bg-green-100 text-green-700' :
                                  j.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                  'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {j.total_score}/100
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    )
  )
}