import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Navbar from './component/Navbar'
import Footer from './component/Footer'
import Userlogin from './component/Userlogin'
import Login from './component/Login'
import AdCategory from './component/Admin/AdCategory'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
      {/* Always visible */}
      <Navbar />  

      {/* Page routes */}
      <Routes>
      <Route path="/Userlogin" element={<Userlogin />} />
      <Route path="/login" element={<Login />} />
        <Route path="/Admin/AdCategory" element={<AdCategory />} />
      </Routes>

      {/* Always visible */}
      <Footer />
    </Router>
  )
}

export default App
