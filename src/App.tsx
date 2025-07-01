import { BrowserRouter as Router } from 'react-router-dom'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <Router basename={process.env.NODE_ENV === 'production' ? '/collect' : ''}>
      <Dashboard />
    </Router>
  )
}

export default App