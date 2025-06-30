import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50" dir="rtl">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-xl font-semibold text-gray-900">
                מערכת ניהול חובות
              </h1>
              <div className="text-sm text-gray-500">
                גרסה 1.0.0
              </div>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              ברוכים הבאים למערכת ניהול החובות
            </h2>
            <p className="text-gray-600">
              המערכת בבנייה - בקרוב תוכלו לנהל את כל החובות בצורה יעילה ומקצועית
            </p>
          </div>
        </main>
      </div>
    </Router>
  )
}

export default App