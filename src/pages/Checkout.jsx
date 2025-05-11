import React, { useState, useEffect } from "react";
import { Footer, Navbar } from "../components";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

const Checkout = () => {
  const state = useSelector((state) => state.handleCart);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const EmptyCart = () => {
    return (
      <div className="container">
        <div className="row">
          <div className="col-md-12 py-5 bg-light text-center">
            <h4 className="p-3 display-5">No items in your cart</h4>
            <Link to="/" className="btn btn-outline-dark mx-4">
              <i className="fa fa-arrow-left"></i> Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  };

  const ShowCheckout = () => {
    let subtotal = 0;
    let shipping = 30.0;
    let totalItems = 0;
    
    state.map((item) => {
      return (subtotal += item.price * item.qty);
    });

    state.map((item) => {
      return (totalItems += item.qty);
    });

    // Calculate final total after discount
    const discountAmount = couponApplied ? (subtotal - discount) :0;
    const finalSubtotal = subtotal - discountAmount;
    const total = finalSubtotal + shipping;

    const clearFormFields = () => {
      [
        "firstName",
        "lastName",
        "email",
        "address",
        "address2",
        "country",
        "state",
        "zip",
        "cc-name",
        "cc-number",
        "cc-expiration",
        "cc-cvv"
      ].forEach((id) => {
        const field = document.getElementById(id);
        if (field) field.value = "";
      });
    };

    const handleApplyCoupon = async () => {
      if (!couponCode.trim()) {
        setCouponError("Please enter a coupon code");
        return;
      }

      setIsApplyingCoupon(true);
      setCouponError("");

      try {
        // Validate coupon with API
        const response = await fetch("https://kajet24.work.gd/api/coupons/validate/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify({ code: couponCode, amount: subtotal }),
        });

        const result = await response.json();

        if (!response.ok) {
          setCouponError(result.error || "Coupon could not be applied");
          setCouponApplied(false);
          setDiscount(0);
        } else {
          setCouponApplied(true);
          // {"discounted_total":10000.0,"message":"Coupon applied"}
          setDiscount(result.discounted_total || 0);

          // setDiscount(result.discount_percentage || 0);
          setCouponError("");
        }
      } catch (error) {
        console.error("Error applying coupon:", error);
        setCouponError("Error validating coupon");
        setCouponApplied(false);
      } finally {
        setIsApplyingCoupon(false);
      }
    };

    const handleCouponInputChange = (e) => {
      setCouponCode(e.target.value);
      if (couponApplied) {
        setCouponApplied(false);
        setDiscount(0);
        setCouponError("");
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();

      const first_name = document.getElementById("firstName").value;
      const last_name = document.getElementById("lastName").value;
      const email = document.getElementById("email").value;
      const address = document.getElementById("address").value;
      const apartment = document.getElementById("address2").value;
      const country = document.getElementById("country").value;
      const state_field = document.getElementById("state").value;
      const zip_code = document.getElementById("zip").value;
      const card_name = document.getElementById("cc-name").value;
      const card_number = document.getElementById("cc-number").value;
      const expiration = document.getElementById("cc-expiration").value;
      const cvv = document.getElementById("cc-cvv").value;

      const items = state.map((item) => ({
        product_id: item.id,
        quantity: item.qty,
      }));

      const orderData = {
        first_name,
        last_name,
        email,
        address,
        apartment,
        country,
        state: state_field,
        zip_code,
        card_name,
        card_number,
        expiration,
        cvv,
        items,
      };

      // Add coupon code to order data if applied
      if (couponApplied && couponCode) {
        orderData.coupon_code = couponCode;
      }

      try {
        const response = await fetch("https://kajet24.work.gd/api/checkout/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify(orderData),
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("access_token");
            window.location.href = "/login";
          } else if (response.status === 400) {
            const errorData = await response.json();
            if (errorData.coupon_error) {
              setCouponError(errorData.coupon_error);
              return;
            }
          }
          throw new Error("Failed to submit order");
        }

        if (response.status === 201) {
          console.log("Order submitted successfully");
          clearFormFields();
          setShowSuccessModal(true);
        }

        const result = await response.json();
        console.log("Order submitted successfully", result);
      } catch (error) {
        console.error("Error submitting order:", error);
      }
    };

    return (
      <>
        <div className="container py-5">
          <div className="row my-4">
            <div className="col-md-5 col-lg-4 order-md-last">
              <div className="card mb-4 shadow-sm">
                <div className="card-header py-3 bg-dark text-white">
                  <h5 className="mb-0">Order Summary</h5>
                </div>
                <div className="card-body">
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item d-flex justify-content-between align-items-center border-0 px-0 pb-0">
                      Items ({totalItems})
                      <span>₸{Math.round(subtotal)}</span>
                    </li>
                    
                    {couponApplied && (
                      <li className="list-group-item d-flex justify-content-between align-items-center text-success px-0">
                        Discount 
                        <span>- ₸ {Math.round(discountAmount)}</span>
                      </li>
                    )}
                    
                    <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                      Shipping
                      <span>₸{shipping}</span>
                    </li>
                    
                    <li className="list-group-item d-flex justify-content-between align-items-center border-0 px-0 mb-3">
                      <div>
                        <strong>Total</strong>
                      </div>
                      <span>
                        <strong>₸{Math.round(total)}</strong>
                      </span>
                    </li>
                  </ul>

                  <div className="input-group mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Coupon code"
                      value={couponCode}
                      onChange={handleCouponInputChange}
                    />
                    <button 
                      className="btn btn-outline-dark" 
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isApplyingCoupon}
                    >
                      {isApplyingCoupon ? (
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                      ) : null}
                      Apply
                    </button>
                  </div>
                  
                  {couponError && (
                    <div className="alert alert-danger py-2" role="alert">
                      {couponError}
                    </div>
                  )}
                  
                  {couponApplied && (
                    <div className="alert alert-success py-2" role="alert">
                      Coupon applied successfully! You saved ${Math.round(discountAmount)}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="col-md-7 col-lg-8">
              <div className="card mb-4 shadow-sm">
                <div className="card-header py-3 bg-dark text-white">
                  <h4 className="mb-0">Order Details</h4>
                </div>
                <div className="card-body">
                  <form
                    className="needs-validation"
                    noValidate
                    onSubmit={handleSubmit}
                  >
                    <div className="row g-3">
                      <div className="col-sm-6 my-1">
                        <label htmlFor="firstName" className="form-label">
                          First Name
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="firstName"
                          placeholder="John"
                          required
                        />
                        <div className="invalid-feedback">
                          First name is required
                        </div>
                      </div>

                      <div className="col-sm-6 my-1">
                        <label htmlFor="lastName" className="form-label">
                          Last Name
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="lastName"
                          placeholder="Doe"
                          required
                        />
                        <div className="invalid-feedback">
                          Last name is required
                        </div>
                      </div>

                      <div className="col-12 my-1">
                        <label htmlFor="email" className="form-label">
                          Email
                        </label>
                        <input
                          type="email"
                          className="form-control"
                          id="email"
                          placeholder="you@example.com"
                          required
                        />
                        <div className="invalid-feedback">
                          Please enter a valid email address
                        </div>
                      </div>

                      <div className="col-12 my-1">
                        <label htmlFor="address" className="form-label">
                          Address
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="address"
                          placeholder="123 Main St"
                          required
                        />
                        <div className="invalid-feedback">
                          Please enter your address
                        </div>
                      </div>

                      <div className="col-12">
                        <label htmlFor="address2" className="form-label">
                          Address 2 <span className="text-muted">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="address2"
                          placeholder="Apartment or suite"
                        />
                      </div>

                      <div className="col-md-5 my-1">
                        <label htmlFor="country" className="form-label">
                          Country
                        </label>
                        <select className="form-select" id="country" required>
                          <option value="">Choose...</option>
                          <option>Kazakhstan</option>
                          <option>United States</option>
                          <option>Canada</option>
                          <option>United Kingdom</option>
                        </select>
                        <div className="invalid-feedback">
                          Please select a valid country
                        </div>
                      </div>

                      <div className="col-md-4 my-1">
                        <label htmlFor="state" className="form-label">
                          State/Region
                        </label>
                        <select className="form-select" id="state" required>
                          <option value="">Choose...</option>
                          <option>Almaty Region</option>
                          <option>Karaganda Region</option>
                          <option>Pavlodar Region</option>
                          <option>West Kazakhstan</option>
                        </select>
                        <div className="invalid-feedback">
                          Please select a valid region
                        </div>
                      </div>

                      <div className="col-md-3 my-1">
                        <label htmlFor="zip" className="form-label">
                          Zip/Postal Code
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="zip"
                          placeholder="12345"
                          required
                        />
                        <div className="invalid-feedback">
                          Zip code is required
                        </div>
                      </div>
                    </div>

                    <hr className="my-4" />

                    <h4 className="mb-3">Payment</h4>

                    <div className="row gy-3">
                      <div className="col-md-6">
                        <label htmlFor="cc-name" className="form-label">
                          Name on card
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="cc-name"
                          placeholder="Full name as displayed on card"
                          required
                        />
                        <small className="text-muted">
                          Full name as displayed on card
                        </small>
                        <div className="invalid-feedback">
                          Name on card is required
                        </div>
                      </div>

                      <div className="col-md-6">
                        <label htmlFor="cc-number" className="form-label">
                          Credit card number
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="cc-number"
                          placeholder="1234 5678 9012 3456"
                          required
                        />
                        <div className="invalid-feedback">
                          Credit card number is required
                        </div>
                      </div>

                      <div className="col-md-3">
                        <label htmlFor="cc-expiration" className="form-label">
                          Expiration
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="cc-expiration"
                          placeholder="MM/YY"
                          required
                        />
                        <div className="invalid-feedback">
                          Expiration date is required
                        </div>
                      </div>

                      <div className="col-md-3">
                        <label htmlFor="cc-cvv" className="form-label">
                          CVV
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="cc-cvv"
                          placeholder="123"
                          required
                        />
                        <div className="invalid-feedback">
                          Security code is required
                        </div>
                      </div>
                    </div>

                    <hr className="my-4" />

                    <button className="w-100 btn btn-primary btn-lg" type="submit">
                      <i className="fa fa-credit-card me-2"></i> Place Order
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      <Navbar />
      <div className="container my-3 py-3">
        <h1 className="text-center">Checkout</h1>
        <hr />
        {state.length ? <ShowCheckout /> : <EmptyCart />}
      </div>
      <Footer />

      {showSuccessModal && (
        <div
          className="modal show fade d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">Order Successful!</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowSuccessModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body text-center py-4">
                <i className="fa fa-check-circle text-success" style={{ fontSize: "4rem" }}></i>
                <p className="mt-3 mb-0 lead">Your order has been successfully processed!</p>
                <p className="text-muted">Thank you for your purchase.</p>
              </div>
              <div className="modal-footer">
                <Link to="/" className="btn btn-outline-dark">
                  Continue Shopping
                </Link>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => setShowSuccessModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Checkout;