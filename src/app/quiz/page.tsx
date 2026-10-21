'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Clock, AlertCircle, CheckCircle2, Loader2, Zap } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthProvider'
import { createBrowserClient } from '@/lib/supabase/client'

export default function QuizPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [questions, setQuestions] = useState<any[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(30)
  const [showResults, setShowResults] = useState(false)

  const supabase = createBrowserClient()

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/join')
      return
    }
    fetchQuestions()
  }, [user, authLoading])

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select(`
          *,
          quiz_options (*)
        `)
        .eq('round_id', 'demo-round')
        .eq('published', true)
        .order('sequence')

      if (error) throw error
      setQuestions(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions')
    } finally {
      setLoading(false)
    }
  }

  const currentQuestion = questions[currentQuestionIndex]

  useEffect(() => {
    if (!currentQuestion || submitted || showResults) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeUp()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [currentQuestion, submitted, showResults])

  const handleTimeUp = () => {
    if (!answers[currentQuestion.id]) {
      handleSubmitAnswer('')
    }
  }

  const handleAnswerSelect = (optionId: string) => {
    if (submitted || showResults) return
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionId }))
  }

  const handleSubmitAnswer = async (selectedOptionId: string) => {
    if (submitted || showResults) return

    const selectedAnswer = answers[currentQuestion.id] || selectedOptionId
    const correctOption = currentQuestion.quiz_options.find((o: any) => o.is_correct)
    const isCorrect = selectedAnswer === correctOption?.id
    const pointsAwarded = isCorrect ? currentQuestion.points : 0

    setSubmitted(true)

    try {
      const supabase = createBrowserClient()
      const { error } = await supabase
        .from('quiz_answers')
        .insert({
          question_id: currentQuestion.id,
          participant_id: user?.id || 'demo',
          option_id: selectedAnswer,
          is_correct: isCorrect,
          points_awarded: isCorrect ? currentQuestion.points : 0,
          idempotency_key: `${user?.id || 'demo'}-${currentQuestion.id}-${Date.now()}`,
        })

      if (error) throw error

      if (isCorrect) {
        setScore(prev => prev + currentQuestion.points)
      }
    } catch (err) {
      console.error('Failed to submit answer:', err)
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setSubmitted(false)
      setTimeLeft(currentQuestion.duration_seconds || 30)
    } else {
      setShowResults(true)
    }
  }

  const handleRetry = () => {
    setAnswers({})
    setSubmitted(false)
    setScore(0)
    setCurrentQuestionIndex(0)
    setTimeLeft(questions[0]?.duration_seconds || 30)
    setShowResults(false)
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <p className="text-gray-600 mb-4">Please join the competition first</p>
          <Link href="/join" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Join Competition
          </Link>
        </div>
      </div>
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Quiz</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/join" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Go Back
          </Link>
        </div>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <p className="text-gray-600 mb-4">No questions available for this round</p>
          <Link href="/leaderboard" className="text-indigo-600 hover:text-indigo-700 font-medium">
            View Leaderboard
          </Link>
        </div>
      </div>
    )
  }

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <p className="text-sm font-medium text-gray-900">Quiz Challenge</p>
                <p className="text-xs text-gray-500">Question {currentQuestionIndex + 1} of {questions.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm text-gray-500">Score: <span className="font-bold text-indigo-600">{score}</span></p>
              </div>
              <div className="relative">
                <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-300 ease-linear"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {timeLeft}s remaining
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 flex items-center gap-2" role="alert">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {showResults ? (
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h1>
                <p className="text-gray-600 mb-6">Your final score: <span className="font-bold text-3xl text-indigo-600">{score}</span> points</p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Answers</h2>
                <div className="space-y-4">
                  {questions.map((q, index) => {
                    const userAnswer = answers[q.id]
                    const correctOption = q.quiz_options.find((o: any) => o.is_correct)
                    const userAnswerId = answers[q.id]
                    const isCorrect = userAnswerId === correctOption?.id

                    return (
                      <div key={q.id} className="p-4 rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-500">Question {index + 1}</span>
                          <span className={`font-semibold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                            {isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-3">{q.prompt}</p>
                        <div className="space-y-2">
                          {q.quiz_options.map((opt: any) => (
                            <div
                              key={opt.id}
                              className={`flex items-center gap-2 p-2 rounded-lg ${
                                opt.id === correctOption?.id
                                  ? 'bg-green-50 border-green-200'
                                  : opt.id === answers[q.id]
                                  ? 'bg-red-50 border-red-200'
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <span className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-300 text-sm font-medium">
                                {String.fromCharCode(65 + q.quiz_options.indexOf(opt))}
                              </span>
                              <span className="flex-1 text-gray-700">{opt.label}</span>
                              {opt.id === correctOption?.id && (
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                              )}
                              {opt.id === answers[q.id] && !isCorrect && (
                                <span className="text-red-500 text-sm">Your answer</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <Link
                    href="/leaderboard"
                    className="flex-1 py-3 px-6 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors text-center"
                  >
                    View Leaderboard
                  </Link>
                  <button
                    onClick={handleRetry}
                    className="flex-1 py-3 px-6 rounded-xl border-2 border-indigo-600 text-indigo-600 font-semibold hover:bg-indigo-50 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <div className="mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                      {currentQuestion.category}
                    </span>
                    <span className="text-gray-400">Question {currentQuestionIndex + 1} of {questions.length}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                    {currentQuestion.prompt}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {currentQuestion.explanation || 'Select the best answer.'}
                  </p>
                </div>

                <div className="space-y-3">
                  {currentQuestion.quiz_options.map((option: any, optIndex: number) => {
                    const isSelected = answers[currentQuestion.id] === option.id
                    const isCorrect = option.is_correct

                    return (
                      <button
                        key={option.id}
                        onClick={() => handleAnswerSelect(option.id)}
                        disabled={submitted}
                        className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                          submitted
                            ? option.is_correct
                              ? 'bg-green-50 border-green-300'
                              : answers[currentQuestion.id] === option.id
                              ? 'border-red-300 bg-red-50'
                              : 'bg-gray-50'
                            : answers[currentQuestion.id] === option.id
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 flex items-center justify-center rounded-full font-semibold text-lg ${
                            submitted
                              ? option.is_correct
                                ? 'bg-green-100 text-green-700 border-green-300'
                                : answers[currentQuestion.id] === option.id
                                ? 'bg-red-100 text-red-700 border-red-300'
                                : 'bg-gray-100 text-gray-400 border-gray-300'
                              : answers[currentQuestion.id] === option.id
                              ? 'bg-indigo-100 text-indigo-700 border-indigo-400'
                              : 'bg-gray-100 text-gray-400 border-gray-300
                          }`}>
                            {String.fromCharCode(65 + currentQuestion.quiz_options.indexOf(option))}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{option.label}</p>
                            {submitted && option.is_correct && (
                              <p className="text-sm text-green-600 mt-0.5">Correct answer</p>
                            )}
                          </div>
                          {submitted && option.is_correct && (
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                          )}
                          {submitted && answers[currentQuestion.id] === option.id && !option.is_correct && (
                            <span className="text-red-500 text-sm">Your answer</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleNextQuestion}
                    disabled={!submitted}
                    className={`w-full py-3.5 px-6 rounded-xl font-semibold text-white transition-all duration-200 ${
                      submitted
                        ? 'bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {submitted
                      ? currentQuestionIndex < questions.length - 1
                        ? 'Next Question'
                        : 'View Results'
                      : 'Select an answer'}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  )
}