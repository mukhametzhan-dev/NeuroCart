import React, { useEffect, useState, useRef } from "react";
import { Footer, Navbar } from "../components";

const Profile = () => {
  const [profile, setProfile] = useState({
    email: "",
    username: "",
    photo: null,
    orders: [],
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
  });
    const [coupon, setCoupon] = useState(null);
    const [reviewForm, setReviewForm] = useState({
      product_id: null,
      rate: 5,
      comment: "",
    });
    const [reviewSuccess, setReviewSuccess] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
    fetchCoupon();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://kajet24.work.gd/api/profile/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile({
          email: data.email,
          username: data.username,
          photo: data.photo || null,
          orders: data.orders || [],
        });
        setEditForm({
          username: data.username,
          email: data.email,
        });
      } else {
        if (response.status === 401) {
          localStorage.removeItem("access_token");
          window.location.href = "/login";
        } else {
          setError("Ошибка при загрузке профиля");
        }
      }
    } catch (error) {
      setError("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  };
    const fetchCoupon = async () => {
    try {
      const response = await fetch("https://kajet24.work.gd/api/coupon/user", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCoupon(data);
      }
    } catch (error) {
      console.error("Error fetching coupon:", error);
    }
  };

    const handleReviewInputChange = (e) => {
    const { name, value } = e.target;
    setReviewForm({
      ...reviewForm,
      [name]: value,
    });
  };

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`https://kajet24.work.gd/api/products/${reviewForm.product_id}/reviews/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({
          rate: parseInt(reviewForm.rate),
          comment: reviewForm.comment,
        }),
      });

      if (response.ok) {
        setReviewSuccess(true);
        setSuccessMessage("Отзыв успешно добавлен");
        setTimeout(() => {
          setSuccessMessage(null);
          setReviewSuccess(false);
        }, 3000);
        
        // Reset form
        setReviewForm({
          product_id: null,
          rate: 5,
          comment: "",
        });
        
        // Close modal
        document.getElementById('reviewModal').classList.remove('show');
        document.querySelector('.modal-backdrop')?.remove();
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Ошибка при добавлении отзыва");
        setTimeout(() => setError(null), 3000);
      }
    } catch (error) {
      setError("Ошибка соединения с сервером");
      setTimeout(() => setError(null), 3000);
    }
  };

  const openReviewModal = (productId, productName) => {
    setReviewForm({
      ...reviewForm,
      product_id: productId,
      product_name: productName
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm({
      ...editForm,
      [name]: value,
    });
  };

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async () => {
    if (!photoFile) return;

    try {
      const formData = new FormData();
      formData.append("photo", photoFile);

      const response = await fetch("https://kajet24.work.gd/api/profile/photo/", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setProfile({
          ...profile,
          photo: data.photo,
        });
        setPhotoFile(null);
        setSuccessMessage("Фото профиля успешно обновлено");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError("Ошибка при загрузке фото");
        setTimeout(() => setError(null), 3000);
      }
    } catch (error) {
      setError("Ошибка соединения с сервером");
      setTimeout(() => setError(null), 3000);
    }
  };

  const deletePhoto = async () => {
    try {
      const response = await fetch("https://kajet24.work.gd/api/profile/photo/", {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      if (response.ok) {
        setProfile({
          ...profile,
          photo: null,
        });
        setPhotoPreview(null);
        setSuccessMessage("Фото профиля удалено");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError("Ошибка при удалении фото");
        setTimeout(() => setError(null), 3000);
      }
    } catch (error) {
      setError("Ошибка соединения с сервером");
      setTimeout(() => setError(null), 3000);
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch("https://kajet24.work.gd/api/profile/update/", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({
          username: editForm.username,
          email: editForm.email,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile({
          ...profile,
          username: data.username,
          email: data.email,
        });
        
        if (photoFile) {
          await uploadPhoto();
        }
        
        setIsEditing(false);
        setSuccessMessage("Профиль успешно обновлен");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Ошибка при обновлении профиля");
        setTimeout(() => setError(null), 3000);
      }
    } catch (error) {
      setError("Ошибка соединения с сервером");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setEditForm({
      username: profile.username,
      email: profile.email,
    });
    setPhotoPreview(null);
    setPhotoFile(null);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setPhotoPreview(null);
    setPhotoFile(null);
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const getOrderStatusText = (status) => {
    switch (status) {
      case "Pending":
        return "Pending";
      case "confirmed":
        return "Confirmed";
      case "delivered":
        return "Delivered";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
  };

  return (
    <>
      <Navbar />

      <div className="container my-3 py-3">
        <h1 className="text-center">Profile</h1>
        <hr />

        {successMessage && (
          <div className="alert alert-success" role="alert">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="row">
            <div className="col-md-4 mb-4">
              <div className="card shadow-sm">
                <div className="card-body text-center">
                  <div className="mb-3">
                    {isEditing ? (
                      <div className="profile-photo-edit">
                        <div 
                          className="position-relative mb-3" 
                          style={{ 
                            width: "150px", 
                            height: "150px", 
                            margin: "0 auto",
                            borderRadius: "50%",
                            overflow: "hidden",
                            border: "2px solid #eee",
                            cursor: "pointer"
                          }}
                          onClick={triggerFileInput}
                        >
                          {photoPreview ? (
                            <img 
                              src={photoPreview} 
                              alt="Предпросмотр фото" 
                              className="img-fluid" 
                              style={{ 
                                width: "100%", 
                                height: "100%", 
                                objectFit: "cover" 
                              }}
                            />
                          ) : profile.photo ? (
                            <img 
                              src={profile.photo} 
                              alt="Фото профиля" 
                              className="img-fluid" 
                              style={{ 
                                width: "100%", 
                                height: "100%", 
                                objectFit: "cover" 
                              }}
                            />
                          ) : (
                            <div style={{ 
                              width: "100%", 
                              height: "100%", 
                              backgroundColor: "#f8f9fa",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}>
                              <i className="fa fa-user fa-4x text-secondary"></i>
                            </div>
                          )}
                          <div 
                            style={{
                              position: "absolute",
                              bottom: "0",
                              left: "0",
                              right: "0",
                              backgroundColor: "rgba(0,0,0,0.5)",
                              color: "white",
                              padding: "4px",
                              fontSize: "12px"
                            }}
                          >
                            Change
                          </div>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="d-none"
                          accept="image/*"
                          onChange={handlePhotoChange}
                        />
                        {profile.photo && !photoPreview && (
                          <button 
                            type="button" 
                            className="btn btn-sm btn-outline-danger mb-3"
                            onClick={deletePhoto}
                          >
                            Удалить фото
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="mb-3" style={{ width: "150px", height: "150px", margin: "0 auto" }}>
                        {profile.photo ? (
                          localStorage.setItem("photo", profile.photo),
                          <img 
                            src={profile.photo} 
                            alt="Фото профиля" 
                            className="img-fluid rounded-circle" 
                            style={{ 
                              width: "150px", 
                              height: "150px", 
                              objectFit: "cover",
                              border: "2px solid #eee" 
                            }}
                          />
                        ) : (
                          <div style={{ 
                            width: "150px", 
                            height: "150px", 
                            backgroundColor: "#f8f9fa",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "2px solid #eee"
                          }}>
                            <i className="fa fa-user fa-4x text-secondary"></i>
                          </div>
                        )}
                      </div>
                    )}

                    {isEditing ? (
                      <form onSubmit={updateProfile}>
                        <div className="mb-3">
                          <label htmlFor="username" className="form-label">Username</label>
                          <input
                            type="text"
                            className="form-control"
                            id="username"
                            name="username"
                            value={editForm.username}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label htmlFor="email" className="form-label">Email</label>
                          <input
                            type="email"
                            className="form-control"
                            id="email"
                            name="email"
                            value={editForm.email}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div className="d-grid gap-2">
                          <button type="submit" className="btn btn-primary">Save</button>
                          <button type="button" className="btn btn-outline-secondary" onClick={cancelEdit}>Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <h4 className="card-title">{profile.username}</h4>
                        <p className="card-text text-muted">{profile.email}</p>
                        <button 
                          className="btn btn-outline-primary"
                          onClick={handleEditClick}
                        >
                          <i className="fa fa-edit me-1"></i> Edit Profile
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
                            {coupon && (
                <div className="card shadow-sm mt-4">
                  <div className="card-body">
                    <h5 className="card-title mb-3">Personalized coupon</h5>
                    <div className="coupon-card p-3 bg-light border rounded position-relative overflow-hidden">
                      <div className="position-absolute" style={{ 
                        top: '-2px',
                        right: '-15px', 
                        width: '150px', 
                        height: '40px', 
                        backgroundColor: coupon.is_active ? '#28a745' : '#dc3545',
                        transform: 'rotate(45deg)',
                        transformOrigin: 'center',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        zIndex: 1
                      }}>
                        {coupon.is_active ? 'active' : 'inactive'}
                      </div>
                      <div className="d-flex flex-column align-items-center">
                        <h3 className="coupon-code mb-2 text-center font-weight-bold" 
                            style={{ 
                              letterSpacing: '1.5px', 
                              fontFamily: 'monospace',
                              fontSize: '24px',
                              fontWeight: 'bold'
                            }}>
                          {coupon.code}
                        </h3>
                        <div className="coupon-value mb-2">
                          <span className="badge bg-primary p-2" style={{ fontSize: '16px' }}>
                            {coupon.amount.toLocaleString('ru-RU')} ₸
                          </span>
                        </div>
                        <button 
                          className="btn btn-sm btn-outline-secondary mt-2"
                          onClick={() => {
                            navigator.clipboard.writeText(coupon.code);
                            setSuccessMessage("Код купона скопирован в буфер обмена");
                            setTimeout(() => setSuccessMessage(null), 3000);
                          }}
                        >
                          <i className="fa fa-copy me-1"></i> Copy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="col-md-8">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title mb-4">My Orders</h5>
                  
                  {profile.orders.length === 0 ? (
                    <div className="text-center py-4">
                      <i className="fa fa-shopping-bag fa-3x text-muted mb-3"></i>
                      <p> You haven't any order yet </p>
                      <a href="/product" className="btn btn-outline-primary">Go Shopping</a>
                    </div>
                  ) : (
                    <div className="accordion" id="ordersAccordion">
                      {profile.orders.map((order) => (
                        <div className="accordion-item mb-3 border" key={order.id}>
                          <h2 className="accordion-header" id={`heading${order.id}`}>
                            <button 
                              className="accordion-button collapsed" 
                              type="button" 
                              data-bs-toggle="collapse" 
                              data-bs-target={`#collapse${order.id}`} 
                              aria-expanded="false" 
                              aria-controls={`collapse${order.id}`}
                            >
                              <div className="d-flex justify-content-between align-items-center w-100">
                                <span><strong>Заказ #{order.id}</strong></span>
                                <div>
                                  <span className={`badge ${order.status === "confirmed" ? "bg-success" : 
                                                          order.status === "pending" ? "bg-warning" : 
                                                          order.status === "delivered" ? "bg-primary" : 
                                                          "bg-secondary"} me-2`}>
                                    {getOrderStatusText(order.status)}
                                  </span>
                                  <span className="text-muted small">{formatDate(order.order_date)}</span>
                                </div>
                              </div>
                            </button>
                          </h2>
                          <div 
                            id={`collapse${order.id}`} 
                            className="accordion-collapse collapse" 
                            aria-labelledby={`heading${order.id}`}
                            data-bs-parent="#ordersAccordion"
                          >
                            <div className="accordion-body">
                              <div className="row">
                                <div className="col-md-6">
                                  <p className="mb-1"><strong>Status:</strong> {getOrderStatusText(order.status)}</p>
                                  <p className="mb-1"><strong>Date:</strong> {formatDate(order.order_date)}</p>
                                  <p className="mb-1"><strong>Sum:</strong> ₸{order.amount.toLocaleString('ru-RU')}</p>
                                </div>
                                <div className="col-md-6">
                                  <p className="mb-2"><strong>Products:</strong></p>
                                  <ul className="list-group">
                                    {order.items.map((item) => (
                                      <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                                        <span>{item.product.name}</span>
                                        <div>
                                          <span className="badge bg-primary rounded-pill me-2">×{item.quantity}</span>
                                          {/* Add review button - only for confirmed or delivered orders */}
                                          {(order.status === "confirmed" || order.status === "delivered") && (
                                            <button 
                                              className="btn btn-sm btn-outline-primary"
                                              data-bs-toggle="modal"
                                              data-bs-target="#reviewModal"
                                              onClick={() => openReviewModal(item.product.id, item.product.name)}
                                            >
                                              <i className="fa fa-star me-1"></i> Leave a review
                                            </button>
                                          )}
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

            {/* Review Modal */}
      <div className="modal fade" id="reviewModal" tabIndex="-1" aria-labelledby="reviewModalLabel" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="reviewModalLabel">
                Оставить отзыв о товаре: {reviewForm.product_name}
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <form onSubmit={submitReview}>
                <div className="mb-3">
                  <label htmlFor="rate" className="form-label">Оценка</label>
                  <div className="rating-input">
                    <div className="d-flex justify-content-between mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <div key={star} className="form-check form-check-inline">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="rate"
                            id={`rate${star}`}
                            value={star}
                            checked={parseInt(reviewForm.rate) === star}
                            onChange={handleReviewInputChange}
                          />
                          <label className="form-check-label" htmlFor={`rate${star}`}>
                            {star} {star === 1 ? '' : star < 5 ? '' : ''}
                          </label>
                        </div>
                      ))}
                    </div>
                    <div className="text-center mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span 
                          key={star}
                          className="fs-3"
                          style={{ color: star <= reviewForm.rate ? '#FFD700' : '#e4e5e9', cursor: 'pointer' }}
                          onClick={() => setReviewForm({...reviewForm, rate: star})}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mb-3">
                  <label htmlFor="comment" className="form-label">Комментарий</label>
                  <textarea
                    className="form-control"
                    id="comment"
                    name="comment"
                    rows="4"
                    value={reviewForm.comment}
                    onChange={handleReviewInputChange}
                    required
                  ></textarea>
                </div>
                <div className="d-grid">
                  <button type="submit" className="btn btn-primary">Отправить отзыв</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Profile;