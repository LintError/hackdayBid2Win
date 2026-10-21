'use client'

import Link from 'next/link'
import { ArrowRight, Zap, Bug, Trophy, Users, Clock, Code2, CheckCircle2, ChevronRight } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-from)_0%,transparent_70%)]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Live Event
              </span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Think Fast.<br />
              <span className="text-yellow-300">Ship Smart.</span>
            </h1>
            
            <p className="text-xl text-white/80 mb-8 max-w-2xl">
              One room. Two challenges. Real-time leaderboard. 
              Welcome to your live competition hub.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link 
                href="/join" 
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-indigo-600 font-semibold hover:bg-indigo-50 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Join Competition
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/admin" 
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-white/20 text-white font-semibold hover:bg-white/10 transition-all duration-200"
              >
                Organizer Dashboard
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-16">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold mb-1">128</div>
                <div className="text-white/70 text-sm">Participants</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold mb-1">8</div>
                <div className="text-white/70 text-sm">Challenges</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold mb-1">5</div>
                <div className="text-white/70 text-sm">Prizes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold mb-1 text-yellow-300">LIVE</div>
                <div className="text-white/70 text-sm">Status</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Visual elements */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-indigo-900/50 to-transparent" />
      </section>

      {/* Features */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-4">
              Two Tracks
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Two Ways to Make Your Mark
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose your challenge or compete in both. Real-time scoring, live leaderboard.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Quiz Track */}
            <Link href="/quiz" className="group block p-8 rounded-2xl bg-white border border-gray-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Zap className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-indigo-600">TRACK 01</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Bid to Win</h3>
              <p className="text-gray-600 mb-6">
                Quick thinking meets technical knowledge. Answer before the clock runs out and climb the board.
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> 30 sec / question</span>
                <span className="flex items-center gap-1"><Code2 className="w-4 h-4" /> JS/TS/Python</span>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-indigo-600 font-medium">Start Quiz</span>
                <ChevronRight className="w-5 h-5 text-indigo-600 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
            
            {/* Bug Hunt Track */}
            <Link href="/bug-hunt" className="group block p-8 rounded-2xl bg-white border border-gray-200 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Bug className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-emerald-600">TRACK 02</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Bug Hunt</h3>
              <p className="text-gray-600 mb-6">
                Spot the flaw. Explain the impact. Submit a clean fix. Every detail counts.
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                <span className="flex items-center gap-1"><Code2 className="w-4 h-4" /> Code Review</span>
                <span className="flex items-center gap-1"><Trophy className="w-4 h-4" /> Scored by Judges</span>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-emerald-600 font-medium">Start Hunt</span>
                <ChevronRight className="w-5 h-5 text-emerald-600 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Leaderboard Preview */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium mb-3">
                Leaderboard
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                Who&rsquo;s Out in Front?
              </h2>
            </div>
            <Link href="/leaderboard" className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
              View Full Leaderboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {/* Demo Leaderboard */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Participant</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Quiz</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Bug Hunt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { rank: 1, name: 'Ada N.', total: 362, quiz: 280, bug: 82 },
                    { rank: 2, name: 'Tunde K.', total: 351, quiz: 260, bug: 91 },
                    { rank: 3, name: 'Zara M.', total: 316, quiz: 240, bug: 76 },
                    { rank: 4, name: 'David O.', total: 308, quiz: 220, bug: 88 },
                    { rank: 5, name: 'Imani A.', total: 249, quiz: 180, bug: 69 },
                  ].map((p) => (
                    <tr key={p.rank} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-semibold ${
                          p.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                          p.rank === 2 ? 'bg-gray-100 text-gray-700' :
                          p.rank === 3 ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-50 text-gray-500'
                        }`}>
                          {p.rank}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium text-sm">
                            {p.name.charAt(0)}
                          </div>
                          <span className="font-medium text-gray-900">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-gray-900 text-lg">{p.total}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-indigo-600 font-medium">{p.quiz}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-emerald-600 font-medium">{p.bug}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Prizes */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-medium mb-4">
              Prizes
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Five Arduino Boards. Plenty to Prove.
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Compete for Quiz Champion, Best Bug Fix, Best Explanation, Runner-up, and Community Hero.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6 max-w-5xl mx-auto">
            {[
              { id: 1, name: 'Arduino #1', category: 'Quiz Champion', status: 'Available' },
              { id: 2, name: 'Arduino #2', category: 'Best Bug Fix', status: 'Available' },
              { id: 3, name: 'Arduino #3', category: 'Best Explanation', status: 'Available' },
              { id: 4, name: 'Arduino #4', category: 'Quiz Runner-up', status: 'Available' },
              { id: 5, name: 'Arduino #5', category: 'Community Hero', status: 'Available' },
            ].map((prize) => (
              <div key={prize.id} className="group p-6 rounded-2xl bg-white border border-gray-200 hover:border-amber-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-amber-600">{prize.category}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{prize.name}</h3>
                <p className="text-gray-600 mb-4">{prize.category}</p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    prize.status === 'Available' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {prize.status}
                  </span>
                  <span className="text-sm text-gray-500">1 available</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Ready to compete?
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Join the Competition Today
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-xl mx-auto">
            Spots are filling fast. Secure your spot and start preparing for the challenge.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/join" 
              className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl bg-white text-indigo-600 font-semibold hover:bg-indigo-50 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Join Competition
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/admin" 
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-white/20 text-white font-semibold hover:bg-white/10 transition-all duration-200"
            >
              Organizer Dashboard
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div>
              <h3 className="text-lg font-semibold mb-4">Hack Day Platform</h3>
              <p className="text-gray-400 text-sm">
                Real-time hack day competition platform with quiz and bug hunt challenges.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Tracks</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/quiz" className="hover:text-white transition-colors">Quiz Challenge</Link></li>
                <li><Link href="/bug-hunt" className="hover:text-white transition-colors">Bug Hunt</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/leaderboard" className="hover:text-white transition-colors">Leaderboard</Link></li>
                <li><Link href="/admin" className="hover:text-white transition-colors">Admin Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            &copy; 2024 Hack Day Competition Platform. Built with Next.js, Supabase, and Tailwind CSS.
          </div>
        </div>
      </footer>
    </div>
  )
}