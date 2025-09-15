import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaHeart, FaInfoCircle } from "react-icons/fa";
import Category from "../component/Category";
import pro1 from "./images/pro4.png";

export default function Ct_product() {
  const [products, setProducts] = useState([]);
  const [activeCategories, setActiveCategories] = useState([]);
  const [liked, setLiked] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch active categories first
  useEffect(() => {
    const fetchActiveCategories = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/CategoryModel/categories"
        );
        const activeCats = response.data.filter(
          (cat) => cat.categoryStatus === "Active"
        );
        setActiveCategories(activeCats);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setActiveCategories([
          {
            _id: "fallback1",
            categoryName: "Earring",
            categoryStatus: "Active",
          },
        ]);
      }
    };
    fetchActiveCategories();
  }, []);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const categoryParam = queryParams.get("category");
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [location.search]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (activeCategories.length === 0) return;

      try {
        setIsLoading(true);
        const url = selectedCategory
          ? `http://localhost:5000/api/ProductModel/ctproducts?categoryName=${selectedCategory}`
          : "http://localhost:5000/api/ProductModel/ctproducts";

        const response = await axios.get(url);
        const activeCategoryNames = activeCategories.map(
          (cat) => cat.categoryName
        );
        const filteredProducts = response.data.filter((product) =>
          activeCategoryNames.includes(product.categoryName)
        );

        setProducts(filteredProducts);
        setLiked(new Array(filteredProducts.length).fill(false));

        const userData =
          localStorage.getItem("user") || localStorage.getItem("admin");
        if (userData) {
          const user = JSON.parse(userData);
          const userId = user.id;

          try {
            const wishlistResponse = await axios.get(
              `http://localhost:5000/api/WishlistModel/${userId}`
            );
            const wishlistProductIds = wishlistResponse.data.map(
              (item) => item.productId._id
            );
            setLiked(
              filteredProducts.map((product) =>
                wishlistProductIds.includes(product._id)
              )
            );
          } catch (error) {
            console.error("Error fetching wishlist:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([
          {
            _id: "fallback1",
            productName: "Gold Ring",
            price: "120",
            productImage: null,
            categoryName: "Earring",
          },
        ]);
        setLiked([false]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [selectedCategory, activeCategories]);

  const handleCategorySelect = (categoryName) => {
    setSelectedCategory(categoryName);
  };

  const toggleLike = async (index, productId) => {
    const userData =
      localStorage.getItem("user") || localStorage.getItem("admin");

    if (!userData) {
      window.location.href = "/login";
      return;
    }

    const user = JSON.parse(userData);
    const userId = user.id;

    setIsLikeLoading(true);
    try {
      if (!liked[index]) {
        await axios.post("http://localhost:5000/api/WishlistModel/add", {
          userId,
          productId,
        });
        setLiked((prevLiked) =>
          prevLiked.map((likedState, i) => (i === index ? true : likedState))
        );
        navigate("/wishlist");
      } else {
        alert("Item already in wishlist");
      }
    } catch (error) {
      console.error(
        "Error updating wishlist:",
        error.response?.data || error.message
      );
      alert(
        "Failed to update wishlist: " +
          (error.response?.data?.error || error.message)
      );
    } finally {
      setIsLikeLoading(false);
    }
  };
  // Add to cart functionality
  const addToCart = async (productId) => {
    setIsLoading(true);

    try {
      const userData =
        localStorage.getItem("user") || localStorage.getItem("admin");

      if (!userData) {
        window.location.href = "/login";
        return;
      }
      const user = JSON.parse(userData);
      const userId = user.id;

      console.log(
        "Adding to cart with userId:",
        userId,
        "productId:",
        productId
      );

      const response = await axios.post(
        "http://localhost:5000/api/CartModel/add",
        {
          userId,
          productId,
        }
      );

      console.log("Added to cart response:", response.data);
      window.location.href = "/cart";
    } catch (error) {
      console.error(
        "Error adding to cart:",
        error.response?.data || error.message
      );
      alert(
        "Failed to add product to cart: " +
          (error.response?.data?.error || error.message)
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Category onCategorySelect={handleCategorySelect} />

      {/* Product Show category-wise */}
      <h3 className="p-3 text-center">
        {selectedCategory ? `${selectedCategory} Products` : "All Products"}
      </h3>

      {isLoading ? (
        <div className="text-center p-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : products.length > 0 ? (
        <div className="row row-cols-1 row-cols-md-4 g-4 p-5">
        {products.map((product, index) => (
          <div className="col" key={product._id}>
            <div className="card product-card text-center h-100">
                <img
                  src={
                    product.productImage
                      ? `http://localhost:5000/public/images/product_images/${product.productImage}`
                      : pro1
                  }
                  alt={product.productName}
                  className="product-image"
                  onError={(e) => (e.target.src = pro1)}
                />
                <div className="overlay">
                  <FaHeart
                    className={`like-icon ${liked[index] ? "liked" : ""}`}
                    onClick={() =>
                      !isLikeLoading && toggleLike(index, product._id)
                    }
                    style={{ cursor: isLikeLoading ? "wait" : "pointer" }}
                  />
                  <Link to={`/SinglePro/${product._id}`}>
                    <FaInfoCircle className="info-icon" />
                  </Link>
                  <h4>{product.productName}</h4>
                  <p>${product.price}</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => addToCart(product._id)}
                    disabled={isLoading}
                  >
                    {isLoading ? "Adding..." : "Add to Cart"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-5">
          <p>No products available from active categories</p>
        </div>
      )}
    </div>
  );
}
