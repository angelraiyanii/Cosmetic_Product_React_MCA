import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './component/Navbar'
import Footer from './component/Footer'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
      {/* Always visible */}
      <Navbar />  

      {/* Page routes */}
      <Routes>
        <Route path='/' element={<h1>Home Page</h1>} />
        <Route path='/about' element={<h1>About Page</h1>} />
        <Route path='/contact' element={<h1>Contact Page</h1>} />
      </Routes>

      {/* Always visible */}
      <Footer />
    </Router>
  )
}

export default App
