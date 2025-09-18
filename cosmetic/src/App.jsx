import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
// user called
import Navbar from './component/Navbar'
import Footer from './component/Footer'
import Userlogin from './component/Userlogin'
import Login from './component/Login'
import Slider from './component/Slider'
import Category from './component/Category'
import Product from './component/Product'
import Ct_product from './component/Ct_product'
import SinglePro from './component/SinglePro'
import  Wishlist  from './component/Wishlist'
import Cart from './component/Cart'
import Contactus from './component/Contactus'
import Aboutus from './component/Aboutus'
import Account from './component/Account'
// Admin Called
import AdCategory from './component/Admin/AdCategory'
import AdPro from './component/Admin/AdPro'
import ASlider from './component/Admin/ASlider'
import AdAbout from './component/Admin/AdAbout'
import AdBanner from "./component/Admin/AdBanner";
import AdContact from './component/Admin/AdContact'
import AdUser from './component/Admin/AdUser'

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
        <Route path="/SinglePro/:productId" element={<SinglePro />} />
        <Route path="/Wishlist" element={<Wishlist />} />
        <Route path="/Cart" element={<Cart />} />
        <Route path='/Contactus' element={<Contactus />} />
        <Route path='/Aboutus' element={<Aboutus />} />
        <Route path='/Account' element={<Account />} />
        

        <Route path='/Admin/AdAbout' element={<AdAbout />} />
        <Route path='/Admin/ASlider' element={<ASlider />} />
        <Route path="/Admin/AdBanner" element={<AdBanner />} />
        <Route path="/Admin/AdCategory" element={<AdCategory />} />
        <Route path="/Admin/AdPro" element={<AdPro />} />
        <Route path="/Admin/AdContact" element={<AdContact />} />
        <Route path="/Admin/AdUser" element={<AdUser/>}/>
      </Routes>

      {/* Always visible */}
      <Footer />
    </Router>
  )
}

export default App
