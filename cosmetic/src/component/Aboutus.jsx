import React, { Component } from "react";
import axios from "axios";
import "../App.css";

export class Aboutus extends Component {
  constructor(props) {
    super(props);
    this.state = {
      aboutData: null,
      loading: true,
      error: null,
    };
  }

  componentDidMount() {
    this.fetchAboutData();
  }

  fetchAboutData = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/aboutModel/about");
      this.setState({ aboutData: response.data, loading: false });
    } catch (error) {
      console.error("Error fetching About data:", error);
      this.setState({ error: "Failed to load About Us data", loading: false });
    }
  };

  render() {
    const { aboutData, loading, error } = this.state;

    if (loading) return <div className="text-center mt-5">Loading...</div>;
    if (error) return <div className="text-danger text-center mt-5">{error}</div>;

    // Base path for public images
    const imageBasePath = "http://localhost:5000/public/images/about_images/";

    return (
      <div className="about-container">
        {/* Banner */}
        <div className="container-fluid px-0">
          <img
            src={imageBasePath + aboutData.bannerImage}
            alt="About Us Banner"
            className="d-block w-100 banner-img"
          />
        </div>

        {/* Section 1 */}
        <div className="container mt-5">
          <div className="row align-items-center">
            <div className="col-md-6 text-center mb-4 mb-md-0">
              <img
                src={imageBasePath + aboutData.section1Image}
                height={300}
                width={300}
                alt="Section 1"
                className="img-fluid rounded about-img"
              />
            </div>
            <div className="col-md-6 text-center text-md-start">
              <h2 className="about-title">About Our Jewellery</h2>
              <p className="about-text">{aboutData.section1Text}</p>
            </div>
          </div>
        </div>

        {/* Section 2 */}
        <div className="container mt-5">
          <div className="row align-items-center">
            <div className="col-lg-6 text-center text-lg-start">
              <h2 className="about-title">Our Promise</h2>
              <p className="about-text">{aboutData.section2Text}</p>
            </div>
            <div className="col-lg-6 text-center">
              <img
                src={imageBasePath + aboutData.section2Image}
                height={300}
                width={300}
                alt="Section 2"
                className="img-fluid rounded about-img"
              />
            </div>
          </div>
        </div>

        <hr className="p-2" />
      </div>
    );
  }
}

export default Aboutus;
