import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './component/Navbar'
import Footer from './component/Footer'
import Userlogin from './component/Userlogin'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
      {/* Always visible */}
      <Navbar />  

      {/* Page routes */}
      <Routes>
      <Route path="/" element={<Userlogin />} />
      </Routes>

      {/* Always visible */}
      <Footer />
    </Router>
  )
}

export default App
