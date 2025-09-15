import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { Component } from "react";
import axios from "axios";
import pro1 from "./images/pro2.png"; // Default image
import { useParams } from "react-router-dom"; // Use hooks in a wrapper
import Rating_Review from "./Rating_Review";

class SingleProClass extends Component {
  constructor(props) {
    super(props);
    this.state = {
      product: null,
      error: null,
      isLoading: false, // For cart loading state
      isLikeLoading: false, // For wishlist loading state
      cartMessage: "", // Success message for cart
      wishlistMessage: "", // Success message for wishlist
    };
  }

  componentDidMount() {
    this.fetchProduct();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.productId !== this.props.productId) {
      this.fetchProduct();
    }
  }

  fetchProduct = async () => {
    const { productId } = this.props;
    try {
      const response = await axios.get(
        `http://localhost:5000/api/ProductModel/products/${productId}`
      );
      this.setState({ product: response.data, loading: false });
    } catch (error) {
      console.error("Error fetching product:", error);
      this.setState({
        error: "Failed to load product",
      });
    }
  };

  // Add to Cart functionality
  addToCart = async (productId) => {
    this.setState({ isLoading: true, cartMessage: "" });

    try {
      const userData =
        localStorage.getItem("user") || localStorage.getItem("admin");

      if (!userData) {
        window.location.href = "/login";
        return;
      }
      const user = JSON.parse(userData);
      const userId = user.id;

      const response = await axios.post(
        "http://localhost:5000/api/CartModel/add",
        {
          userId,
          productId,
        }
      );

      console.log("Added to cart response:", response.data);
      this.setState({ cartMessage: "Product added to cart successfully!" });
      setTimeout(() => this.setState({ cartMessage: "" }), 3000); // Clear message after 3 seconds
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
      this.setState({ isLoading: false });
    }
  };

  // Add to Wishlist functionality
  addToWishlist = async (productId) => {
    this.setState({ isLikeLoading: true, wishlistMessage: "" });

    try {
      const userData =
        localStorage.getItem("user") || localStorage.getItem("admin");

      if (!userData) {
        window.location.href = "/login";
        return;
      }
      const user = JSON.parse(userData);
      const userId = user.id;

      const response = await axios.post(
        "http://localhost:5000/api/WishlistModel/add",
        {
          userId,
          productId,
        }
      );

      console.log("Added to wishlist response:", response.data);
      this.setState({
        wishlistMessage: "Product added to wishlist successfully!",
      });
      setTimeout(() => this.setState({ wishlistMessage: "" }), 3000); // Clear message after 3 seconds
    } catch (error) {
      console.error(
        "Error adding to wishlist:",
        error.response?.data || error.message
      );
      alert(
        "Failed to add product to wishlist: " +
          (error.response?.data?.error || error.message)
      );
    } finally {
      this.setState({ isLikeLoading: false });
    }
  };

  render() {
    const {
      product,
      error,
      isLoading,
      isLikeLoading,
      cartMessage,
      wishlistMessage,
    } = this.state;

    if (error) {
      return <div className="container mt-5 text-danger">{error}</div>;
    }

    const defaultProduct = {
      productName: "ProductName",
      categoryName: "Categoryname",
      price: 567,
      discount: 34,
      goldWeight: "0.06 Gram",
      diamondWeight: "0.09 Gram",
      grossWeight: "0.40 Gram",
      goldPrice: 1234.9,
      diamondPrice: 0,
      makingCharges: 130,
      overheadCharges: 500,
      basePrice: 2345.09,
      tax: 78.04,
      totalPrice: 23343.89,
      productType: "Rose Gold",
      productPurity: "20K",
      diamondColor: "NA",
      diamondPieces: 120.78,
      stock: 2,
      productImage: null,
    };

    const displayProduct = product || defaultProduct;

    return (
      <>
        <div className="container mt-5">
          <div className="row align-items shadow p-3 rounded">
            <div className="col-md-4 text-center">
              <img
                src={
                  displayProduct.productImage
                    ? `http://localhost:5000/public/images/product_images/${displayProduct.productImage}`
                    : pro1
                }
                alt={displayProduct.productName}
                className="img-fluid rounded"
                style={{ height: "200px", objectFit: "cover" }}
                onError={(e) => (e.target.src = pro1)}
              />
            </div>
            <div className="col-md-8">
              <div className="mt-5">
                <div className="product-details text-start">
                  <h3>{displayProduct.productName}</h3>
                  <p className="text-muted">{displayProduct.categoryName}</p>
                  <div className="d-flex align-items-center">
                    <h5 className="text-decoration-line-through me-2 text-gray-400">
                      Rs.{" "}
                      {(
                        displayProduct.price /
                        (1 - displayProduct.discount / 100)
                      ).toFixed(2)}
                    </h5>
                    <h5 className="text-danger me-2">
                      Rs. {displayProduct.price}
                    </h5>
                    <span
                      className="border-start mx-2"
                      style={{
                        height: "1.5rem",
                        display: "inline-block",
                        borderColor: "#495057",
                      }}
                    />
                    <h6 style={{ color: "green" }}>
                      {displayProduct.discount}% off
                    </h6>
                  </div>
                  <div className="mt-4">
                    <h6
                      className="fw-bold"
                      style={{ fontSize: "12px", color: "#41566E" }}
                    >
                      Weight Details
                    </h6>
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Gold weight</th>
                            <th>Diamond weight</th>
                            <th>Gross weight</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>{displayProduct.goldWeight}</td>
                            <td>{displayProduct.diamondWeight}</td>
                            <td>{displayProduct.grossWeight}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h6
                      className="fw-bold"
                      style={{ fontSize: "12px", color: "#41566E" }}
                    >
                      Price Details
                    </h6>
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Gold price</th>
                            <th>Diamond price</th>
                            <th>Making charges</th>
                            <th>Overhead charges</th>
                            <th>Base price</th>
                            <th>Tax</th>
                            <th>Total price</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>₹ {displayProduct.goldPrice.toFixed(2)}</td>
                            <td>₹ {displayProduct.diamondPrice.toFixed(2)}</td>
                            <td>₹ {displayProduct.makingCharges.toFixed(2)}</td>
                            <td>
                              ₹ {displayProduct.overheadCharges.toFixed(2)}
                            </td>
                            <td>₹ {displayProduct.basePrice.toFixed(2)}</td>
                            <td>₹ {displayProduct.tax.toFixed(2)}</td>
                            <td>₹ {displayProduct.totalPrice.toFixed(2)}</td>
                          </tr>
                        </tbody>
                      </table>
                      <ul style={{ fontSize: "12px" }}>
                        <li>Product type: {displayProduct.productType}</li>
                        <li>Product purity: {displayProduct.productPurity}</li>
                        <li>Diamond color: {displayProduct.diamondColor}</li>
                        <li>Diamond pieces: {displayProduct.diamondPieces}</li>
                        <li>Stock: {displayProduct.stock}</li>
                      </ul>
                    </div>
                  </div>
                  <div className="product-options mt-4">
                    <div className="form-group">
                      <label
                        htmlFor="quantity"
                        className="fw-bold"
                        style={{ fontSize: "12px", color: "#41566E" }}
                      >
                        Quantity:
                      </label>
                      <input
                        type="number"
                        id="quantity"
                        name="quantity"
                        className="form-control w-25"
                        defaultValue={1}
                      />
                    </div>
                    <input
                      type="hidden"
                      name="P_Code"
                      value={displayProduct._id || "ABC123"}
                    />
                    <input
                      type="hidden"
                      name="p_tot_price"
                      value={displayProduct.totalPrice}
                    />
                    <div className="form-group mt-3">
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => this.addToCart(displayProduct._id)}
                        disabled={isLoading}
                      >
                        {isLoading ? "Adding..." : "Add to Cart"}
                      </button>
                      <button
                        className="btn btn-outline-primary ms-2"
                        onClick={() => this.addToWishlist(displayProduct._id)}
                        disabled={isLikeLoading}
                      >
                        {isLikeLoading ? "Adding..." : "Add to Wishlist"}
                      </button>
                    </div>
                    {/* Success Messages */}
                    {cartMessage && (
                      <div className="alert alert-success mt-3" role="alert">
                        {cartMessage}
                      </div>
                    )}
                    {wishlistMessage && (
                      <div className="alert alert-success mt-3" role="alert">
                        {wishlistMessage}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <br />
          <br />
          <br />
        </div>
        <Rating_Review />
      </>
    );
  }
}
const SinglePro = () => {
  const { productId } = useParams(); 
  return <SingleProClass productId={productId} />;
};

export default SinglePro;
  