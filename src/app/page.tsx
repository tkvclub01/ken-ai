import Link from 'next/link'
import { ArrowRight, BookOpen, MessageSquare, FileText, Sparkles } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">KEN AI</h1>
            </div>
            <div className="flex gap-4">
              <Link
                href="/chat"
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                AI Chat
              </Link>
              <Link
                href="/knowledge"
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Knowledge Base
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Intelligent Student
            <span className="block text-blue-600 dark:text-blue-400">Management Platform</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            AI-powered platform for study abroad consultation and visa processing.
            Streamline your workflow with intelligent document processing and knowledge management.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              <MessageSquare className="w-5 h-5" />
              Start AI Chat
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/knowledge"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-lg shadow-lg hover:shadow-xl border border-gray-200 dark:border-gray-700 transition-all transform hover:scale-105"
            >
              <BookOpen className="w-5 h-5" />
              Browse Knowledge
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          {/* Feature 1 */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-6">
              <MessageSquare className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              AI-Powered Chat
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Get instant answers about study abroad programs, visa requirements, and application processes using our advanced AI assistant.
            </p>
            <Link href="/chat" className="mt-4 inline-flex items-center text-blue-600 dark:text-blue-400 font-medium hover:underline">
              Try AI Chat →
            </Link>
          </div>

          {/* Feature 2 */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700">
            <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-6">
              <BookOpen className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Knowledge Base
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Access a comprehensive database of study abroad information with intelligent semantic search powered by vector embeddings.
            </p>
            <Link href="/knowledge" className="mt-4 inline-flex items-center text-purple-600 dark:text-purple-400 font-medium hover:underline">
              Explore Knowledge →
            </Link>
          </div>

          {/* Feature 3 */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700">
            <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-6">
              <FileText className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Document Processing
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Automatically extract and verify information from student documents using advanced OCR technology.
            </p>
            <span className="mt-4 inline-flex items-center text-gray-400 dark:text-gray-500 font-medium">
              Coming Soon →
            </span>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-20 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">24/7</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">AI Support</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">Instant</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Responses</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">99.9%</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Accuracy</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">Secure</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Data Protection</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <p>© 2025 KEN AI. Intelligent Student Management Platform.</p>
            <p className="text-sm mt-2">
              Powered by Next.js, Supabase, and Google Gemini AI
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
