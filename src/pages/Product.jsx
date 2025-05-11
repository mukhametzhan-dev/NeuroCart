import React, { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { Link, useParams } from "react-router-dom";
import Marquee from "react-fast-marquee";
import { useDispatch } from "react-redux";
import { addCart } from "../redux/action";
import { Footer, Navbar } from "../components";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const Product = () => {
  const { id } = useParams();
  const [product, setProduct] = useState({});
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [aiHelpLoading, setAiHelpLoading] = useState(false);
  const [aiHelpResponse, setAiHelpResponse] = useState("");
  const [aiHelpError, setAiHelpError] = useState("");
  const dispatch = useDispatch();

  const addProduct = (product) => {
    dispatch(addCart(product));
  };

  const handleHelpClick = async () => {
    setAiHelpLoading(true);
    setAiHelpResponse("");
    setAiHelpError("");
    try {
      const res = await fetch(`https://kajet24.work.gd/api/products/${id}/ask/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({ prompt: "" }),
      });
      if (!res.ok) throw new Error("Ошибка при получении ответа от AI");
      const data = await res.json();
      setAiHelpResponse(data.answer || "Нет ответа от AI.");
    } catch (err) {
      setAiHelpError("Ошибка при получении ответа от AI.");
    } finally {
      setAiHelpLoading(false);
    }
  };

  useEffect(() => {
    const getProduct = async () => {
      setLoading(true);
      setLoading2(true);
      setLoadingReviews(true);

      try {
        // Fetch product details
        const response = await fetch(`https://kajet24.work.gd/api/products/${id}`);
        const data = await response.json();
        setProduct(data);
        setLoading(false);

        // Fetch similar products
        const response2 = await fetch("https://kajet24.work.gd/api/products/");
        const products = await response2.json();
        const filteredProducts = products.filter(
          (item) => item.category === data.category && item.id !== data.id
        );
        setSimilarProducts(filteredProducts);
        setLoading2(false);

        // Fetch reviews
        const reviewsResponse = await fetch(`https://kajet24.work.gd/api/products/${id}/reviews/`);
        const reviewsData = await reviewsResponse.json();
        setReviews(reviewsData);
        setLoadingReviews(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
        setLoading2(false);
        setLoadingReviews(false);
      }
    };

    getProduct();
  }, [id]);

  const handleMouseMove = (e) => {
    if (!isZoomed) return;

    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;

    setZoomPosition({ x, y });
  };

  const handleMouseLeave = () => {
    setIsZoomed(false);
    setZoomPosition({ x: 0, y: 0 }); // Reset zoom position
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<i key={`full-${i}`} className="fa fa-star text-warning"></i>);
    }

    // Half star
    if (hasHalfStar) {
      stars.push(<i key="half" className="fa fa-star-half-alt text-warning"></i>);
    }

    // Empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<i key={`empty-${i}`} className="far fa-star text-warning"></i>);
    }

    return stars;
  };

  const Loading = () => (
    <div className="container my-5 py-2">
      <div className="row">
        <div className="col-md-6 py-3">
          <Skeleton height={400} width={400} />
        </div>
        <div className="col-md-6 py-5">
          <Skeleton height={30} width={250} />
          <Skeleton height={90} />
          <Skeleton height={40} width={70} />
          <Skeleton height={50} width={110} />
          <Skeleton height={120} />
          <Skeleton height={40} width={110} inline={true} />
          <Skeleton className="mx-3" height={40} width={110} />
        </div>
      </div>
    </div>
  );

  const ShowProduct = () => {
    if (!product || !product.images) return null;

    const mainImage = product.images[activeImage]?.image || product.imageLink;

    return (
      <>
        <div className="container my-5 py-2">
          <div className="row">
            <div className="col-md-6 col-sm-12 py-3">
              <div className="product-gallery">
                {/* Main Image with Zoom Effect */}
                <div
                  className="main-image-container position-relative overflow-hidden mb-3"
                  style={{ height: '400px' }}
                  // onMouseEnter={() => setIsZoomed(true)}
                  // onMouseLeave={handleMouseLeave}
                  // onMouseMove={handleMouseMove}
                >
                  <img
                    className="main-image img-fluid w-100 h-100 object-fit-contain"
                    src={mainImage}
                    alt={product.name}
                    style={{
                      objectFit: 'contain',
                      transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                      transform: isZoomed ? 'scale(1.5)' : 'scale(1)',
                      transition: isZoomed ? 'none' : 'transform 0.3s ease-out',
                    }}
                  />
                </div>

                {/* Thumbnail Gallery */}
                {product.images && product.images.length > 1 && (
                  <div className="thumbnail-gallery d-flex justify-content-start overflow-auto py-2">
                    {product.images.map((image, index) => (
                      <div
                        key={index}
                        className={`thumbnail-item cursor-pointer mx-2 ${activeImage === index ? 'border border-primary' : ''}`}
                        style={{ width: '70px', height: '70px' }}
                        onClick={() => setActiveImage(index)}
                      >
                        <img
                          src={image.image}
                          alt={`Thumbnail ${index + 1}`}
                          className="img-fluid w-100 h-100"
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="col-md-6 py-5">
              <div className="product-info">
                <h4 className="text-uppercase text-muted">{product.category}</h4>
                <h1 className="display-5">{product.name}</h1>

                {/* Rating Stars */}
                <div className="product-rating d-flex align-items-center mb-2">
                  <div className="me-2">
                    {renderStars(product.rating)}
                  </div>
                  <span className="text-muted">({product.rating} из 5)</span>
                </div>

                <div className="price-section my-4">
                  <h3 className="display-6 fw-bold">₸{product.price}</h3>
                </div>

                <div className="product-description mb-4">
                  <h5 className="fw-bold mb-2">Description:</h5>
                  <p className="lead">{product.description}</p>
                </div>

                <div className="product-actions d-flex flex-wrap">
                  <button
                    className="btn btn-primary btn-lg me-3 mb-2"
                    onClick={() => addProduct(product)}
                  >
                    <i className="fa fa-cart-plus me-2"></i>
                    Add to cart
                  </button>
                  <Link to="/cart" className="btn btn-outline-dark btn-lg mb-2">
                    <i className="fa fa-shopping-cart me-2"></i>
                    View cart
                  </Link>
                </div>

                {/* Help Button and AI Response */}
                <div className="my-3">
                  <button
                    className="btn btn-outline-info"
                    onClick={handleHelpClick}
                    disabled={aiHelpLoading}
                  >
                    {aiHelpLoading ? (
                      <span>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Генерируется ответ...
                      </span>
                    ) : (
                      <>
                        <i className="fa fa-question-circle me-2"></i>
                        Помощь по товару
                      </>
                    )}
                  </button>
                </div>
                {aiHelpLoading && (
                  <div className="mb-2">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                )}
                {aiHelpResponse && (
                  <div className="alert alert-info mt-2">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {aiHelpResponse}
                    </ReactMarkdown>
                  </div>
                )}
                {aiHelpError && (
                  <div className="alert alert-danger mt-2">{aiHelpError}</div>
                )}
                {/* End Help Button and AI Response */}
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="row mt-5">
            <div className="col-12">
              <div className="reviews-section">
                <h3 className="mb-4 border-bottom pb-2">Reviews</h3>

                {loadingReviews ? (
                  <div className="p-3">
                    <Skeleton height={100} count={3} className="mb-4" />
                  </div>
                ) : reviews.length > 0 ? (
                  <div className="reviews-list">
                    {reviews.map((review) => (
                      <div key={review.id} className="review-item card mb-3">
                        <div className="card-body">
                          <div className="d-flex justify-content-between mb-2">
                            <h5 className="card-title">{review.user}</h5>
                            <div className="review-rating">
                              {renderStars(review.rate)}
                            </div>
                          </div>
                          <p className="card-text">{review.comment}</p>
                          <small className="text-muted">
                            {new Date(review.created).toLocaleDateString()}
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-4 bg-light rounded">
                    <p className="mb-0">This product doesn't have reviews yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Typing animation CSS */}
        <style>{`
          .typing-indicator {
            display: inline-flex;
            align-items: center;
            margin-left: 4px;
          }
          .typing-indicator span {
            height: 8px;
            width: 8px;
            margin: 0 2px;
            background-color: #17a2b8;
            border-radius: 50%;
            display: inline-block;
            animation: typing 1.4s infinite ease-in-out both;
          }
          .typing-indicator span:nth-child(1) { animation-delay: 0s; }
          .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
          .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
          @keyframes typing {
            0% { transform: scale(1); opacity: 0.7; }
            50% { transform: scale(1.4); opacity: 1; }
            100% { transform: scale(1); opacity: 0.7; }
          }
        `}</style>
      </>
    );
  };

  const Loading2 = () => (
    <div className="my-4 py-4">
      <div className="d-flex">
        <div className="mx-4">
          <Skeleton height={400} width={250} />
        </div>
        <div className="mx-4">
          <Skeleton height={400} width={250} />
        </div>
        <div className="mx-4">
          <Skeleton height={400} width={250} />
        </div>
        <div className="mx-4">
          <Skeleton height={400} width={250} />
        </div>
      </div>
    </div>
  );

  const ShowSimilarProduct = () => (
    <div className="py-4 my-4">
      <div className="d-flex">
        {similarProducts.map((item) => (
          <div key={item.id} className="card mx-4 text-center">
            <img
              className="card-img-top p-3"
              src={item.images && item.images.length > 0 ? item.images[0].image : item.imageLink}
              alt="Card"
              style={{ height: '280px', objectFit: 'contain' }}
            />
            <div className="card-body">
              <h5 className="card-title text-truncate" title={item.name}>
                {item.name}
              </h5>
              <div className="my-2">
                {item.rating && renderStars(item.rating)}
              </div>
              <p className="card-text fw-bold">₸{item.price}</p>
            </div>
            <div className="card-footer bg-transparent border-0">
              <Link
                to={"/product/" + item.id}
                className="btn btn-outline-dark m-1"
              >
                Просмотреть
              </Link>
              <button
                className="btn btn-dark m-1"
                onClick={() => addProduct(item)}
              >
                <i className="fa fa-cart-plus"></i>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="row">
          {loading ? <Loading /> : <ShowProduct />}
        </div>
        <div className="row my-5 py-3">
          <div className="d-none d-md-block">
            <h2 className="border-bottom pb-2 mb-4">You may also like </h2>
            <Marquee pauseOnHover={true} pauseOnClick={true} speed={50} gradient={true} gradientWidth={100}>
              {loading2 ? <Loading2 /> : <ShowSimilarProduct />}
            </Marquee>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Product;