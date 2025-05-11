import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { addCart } from "../redux/action";

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const Products = () => {
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  let componentMounted = true;

  const dispatch = useDispatch();

  const addProduct = (product) => {
    dispatch(addCart(product));
    toast.success("Добавлено в корзину");
  };

  useEffect(() => {
    const getProducts = async () => {
      setLoading(true);
      try {
        const response = await fetch("https://kajet24.work.gd/api/products/");
        
        if (componentMounted) {
          const products = await response.json();
          setData(products);
          setFilter(products);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        setLoading(false);
      }

      return () => {
        componentMounted = false;
      };
    };

    getProducts();
  }, []);

  const handleSearch = (e) => {
    const keyword = e.target.value.toLowerCase();
    setSearchTerm(keyword);
    
    let filteredList = [...data];
    
    // Apply category filter if not "all"
    if (activeCategory !== "all") {
      filteredList = filteredList.filter(item => item.category === activeCategory);
    }
    
    // Apply search filter
    filteredList = filteredList.filter(product =>
      product.name.toLowerCase().includes(keyword)
    );
    
    setFilter(filteredList);
  };

  const filterProduct = (cat) => {
    setActiveCategory(cat);
    
    if (cat === "all") {
      // Just apply search filter if exists
      const filteredList = searchTerm 
        ? data.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : [...data];
      setFilter(filteredList);
    } else {
      // Apply both category and search filter if exists
      let filteredList = data.filter(item => item.category === cat);
      
      if (searchTerm) {
        filteredList = filteredList.filter(item => 
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      setFilter(filteredList);
    }
  };

  const renderStars = (rating) => {
    if (!rating && rating !== 0) return null;
    
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
    
    return (
      <div className="d-flex justify-content-center align-items-center gap-1">
        {stars}
        <span className="ms-1 text-muted small">({rating})</span>
      </div>
    );
  };

  const Loading = () => {
    return (
      <>
        <div className="col-12 py-5 text-center">
          <Skeleton height={40} width={560} />
        </div>
        {[...Array(6)].map((_, index) => (
          <div key={index} className="col-md-4 col-sm-6 col-xs-8 col-12 mb-4">
            <div className="card h-100">
              <Skeleton height={300} className="p-3" />
              <div className="card-body">
                <Skeleton height={28} width="80%" className="mb-2" />
                <Skeleton height={20} width="50%" className="mb-3" />
                <Skeleton height={24} width="30%" className="mb-3" />
                <div className="d-flex justify-content-between">
                  <Skeleton height={36} width="45%" />
                  <Skeleton height={36} width="45%" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </>
    );
  };

  const ShowProducts = () => {
    return (
      <>
        <div className="category-filter mb-4">
          <div className="d-flex flex-wrap justify-content-center py-3">
            <button
              className={`btn ${activeCategory === "all" ? "btn-dark" : "btn-outline-dark"} m-1`}
              onClick={() => filterProduct("all")}
            >
              All
            </button>
            <button
              className={`btn ${activeCategory === "electronics" ? "btn-dark" : "btn-outline-dark"} m-1`}
              onClick={() => filterProduct("electronics")}
            >
              Electronics            </button>

            <button
              className={`btn ${activeCategory === "gaming" ? "btn-dark" : "btn-outline-dark"} m-1`}
              onClick={() => filterProduct("gaming")}
            >
              Gaming
            </button>
            <button
              className={`btn ${activeCategory === "digital_goods" ? "btn-dark" : "btn-outline-dark"} m-1`}
              onClick={() => filterProduct("digital_goods")}
            >
              Digital Goods
            </button>
            <button
              className={`btn ${activeCategory === "diy" ? "btn-dark" : "btn-outline-dark"} m-1`}
              onClick={() => filterProduct("diy")}
            >
              DIY & Tools
            </button>
             <button
              className={`btn ${activeCategory === "other" ? "btn-dark" : "btn-outline-dark"} m-1`}
              onClick={() => filterProduct("other")}
            >
              Other
            </button>
          </div>
        </div>

        {filter.length === 0 ? (
          <div className="col-12 text-center py-5">
            <h3>Nothing was found for your query.</h3>
            <p className="text-muted">Try to change search parameters</p>
          </div>
        ) : (
          filter.map((product) => {
            return (
              <div
                id={product.id}
                key={product.id}
                className="col-md-4 col-sm-6 col-xs-8 col-12 mb-4"
              >
                <div className="card h-100 product-card">
                  <div className="image-container" style={{ height: "280px", overflow: "hidden", padding: "1rem" }}>
                    <img
                      className="card-img-top"
                      src={product.images && product.images.length > 0 ? product.images[0].image : product.imageLink}
                      alt={product.name}
                      style={{ height: "100%", width: "100%", objectFit: "contain" }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co/300x300?text=Изображение+недоступно";
                      }}
                    />
                  </div>
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title" title={product.name}>
                      {product.name.length > 40 ? `${product.name.substring(0, 40)}...` : product.name}
                    </h5>
                    <div className="rating-container my-2">
                      {renderStars(product.rating)}
                    </div>
                    <div className="mt-auto">
                      <p className="price fw-bold fs-5 mb-3">₸ {product.price}</p>
                      <div className="d-flex justify-content-between">
                        <Link
                          to={"/product/" + product.id}
                          className="btn btn-outline-dark flex-grow-1 me-2"
                        >
                          More
                        </Link>
                        <button
                          className="btn btn-dark"
                          onClick={() => addProduct(product)}
                        >
                          <i className="fa fa-cart-plus"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </>
    );
  };

  return (
    <div className="container my-4 py-3">
      <div className="row">
        <div className="col-12 mb-3">
          <h2 className="display-5 text-center">Catalog </h2>
          <hr />
        </div>
      </div>
      
      <div className="row justify-content-center mb-4">
        <div className="col-md-8">
          <div className="input-group">
            <span className="input-group-text bg-dark text-white">
              <i className="fa fa-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearch}
            />
            {searchTerm && (
              <button 
                className="btn btn-outline-secondary" 
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  filterProduct(activeCategory);
                }}
              >
                <i className="fa fa-times"></i>
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="row">
        {loading ? <Loading /> : <ShowProducts />}
      </div>
      
      {!loading && filter.length > 0 && (
        <div className="row mt-4">
          <div className="col-12 text-center">
            <p className="text-muted">Показано {filter.length} из {data.length} товаров</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;