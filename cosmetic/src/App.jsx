import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Navbar from './component/Navbar'
import Footer from './component/Footer'
import Userlogin from './component/Userlogin'
import Login from './component/Login'
import AdCategory from './component/Admin/AdCategory'
import AdPro from './component/Admin/AdPro'
import ASlider from './component/Admin/ASlider'
import Slider from './component/Slider'
import AdBanner from "./component/Admin/AdBanner";
import Category from './component/Category'
import Product from './component/Product'
import Ct_product from './component/Ct_product'

// import OfferBanner from './component/OfferBanner'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
      {/* Always visible */}
      <Navbar />  

      {/* Page routes */}
      <Routes>
         <Route
          path="/"
          element={
            <>
              <Slider />
              <Category />
              <Product />
              {/* <OfferBanner/> */}
            </>
          }
        />
      <Route path="/Userlogin" element={<Userlogin />} />
      <Route path="/login" element={<Login />} />
      <Route path='/Slider' element={<Slider />} />
      <Route path='/Category' element={<Category />} />
      <Route path='/Product' element={<Product />} />
      <Route path="/Ct_product" element={<Ct_product />} />

      <Route path='/Admin/ASlider' element={<ASlider />} />
       <Route path="/Admin/AdBanner" element={<AdBanner />} />
      <Route path="/Admin/AdCategory" element={<AdCategory />} />
      <Route path="/Admin/AdPro" element={<AdPro />} />
      </Routes>

      {/* Always visible */}
      <Footer />
    </Router>
  )
}

export default App
