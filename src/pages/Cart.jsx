import React, { useState } from "react";
import { Footer, Navbar } from "../components";
import { useSelector, useDispatch } from "react-redux";
import { addCart, delCart } from "../redux/action"; 
// ^^^ Make sure you have an emptyCart() action in your redux/action.js
import { Link } from "react-router-dom";

const Cart = () => {
  const state = useSelector((state) => state.handleCart);
  const dispatch = useDispatch();
  const [showModal, setShowModal] = useState(false);

  // If cart is empty
  const EmptyCart = () => {
    return (
      <div className="container">
        <div className="row">
          <div className="col-md-12 py-5 bg-light text-center">
            <h4 className="p-3 display-5">Корзина пуста </h4>
            <Link to="/" className="btn btn-outline-dark mx-4">
              <i className="fa fa-arrow-left"></i> Перейти на главную
            </Link>
          </div>
        </div>
      </div>
    );
  };

  // Increase item quantity
  const addItem = (product) => {
    dispatch(addCart(product));
  };

  // Decrease item quantity
  const removeItem = (product) => {
    dispatch(delCart(product));
  };

  // Create Order via API
  const handleCreateOrder = async (subtotal, shipping) => {
    try {
      // Build request body
      const orderData = {
        items: state.map((item) => ({
          product_id: item.id,
          quantity: item.qty,
        })),
        amount: parseFloat((subtotal + shipping).toFixed(2)),
      };

      const response = await fetch("https://kajet24.work.gd/api/orders/create/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        console.log("Order created successfully");
        localStorage.removeItem("cart");
        // reload the page
        window.location.reload();
        // Clear the cart (equivalent to clearing form fields)
        // dispatch(emptyCart());
        setShowModal(true);
      } else {
        console.log("Error creating order:", response.status);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Display cart items
  const ShowCart = () => {
    let subtotal = 0;
    let shipping = 30.0;
    let totalItems = 0;

    state.forEach((item) => {
      subtotal += item.price * item.qty;
      totalItems += item.qty;
    });

    return (
      <>
        <section className="h-100 gradient-custom">
          <div className="container py-5">
            <div className="row d-flex justify-content-center my-4">
              <div className="col-md-8">
                <div className="card mb-4">
                  <div className="card-header py-3">
                    <h5 className="mb-0">Список </h5>
                  </div>
                  <div className="card-body">
                    {state.map((item) => (
                      <div key={item.id}>
                        <div className="row d-flex align-items-center">
                          <div className="col-lg-3 col-md-12">
                           <div className="bg-image rounded">
  <img
    src={item.images && item.images.length > 0 ? item.images[0].image : item.imageLink}
    alt={item.name}
    width={100}
    height={75}
    style={{ objectFit: "contain" }}
  />
  <p>{item.name}</p>
</div>
                          </div>

                          <div className="col-lg-5 col-md-6">
                            <p>
                              <strong>{item.title}</strong>
                            </p>
                          </div>

                          <div className="col-lg-4 col-md-6">
                            <div
                              className="d-flex mb-4"
                              style={{ maxWidth: "300px" }}
                            >
                              <button
                                className="btn px-3"
                                onClick={() => removeItem(item)}
                              >
                                <i className="fas fa-minus"></i>
                              </button>

                              <p className="mx-5">{item.qty}</p>

                              <button
                                className="btn px-3"
                                onClick={() => addItem(item)}
                              >
                                <i className="fas fa-plus"></i>
                              </button>
                            </div>
                            <p className="text-start text-md-center">
                              <strong>
                                <span className="text-muted">{item.qty}</span> x ₸
                                {item.price}
                              </strong>
                            </p>
                          </div>
                        </div>
                        <hr className="my-4" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card mb-4">
                  <div className="card-header py-3 bg-light">
                    <h5 className="mb-0">Сумма заказа</h5>
                  </div>
                  <div className="card-body">
                    <ul className="list-group list-group-flush">
                      <li className="list-group-item d-flex justify-content-between align-items-center border-0 px-0 pb-0">
                        Товары ({totalItems})
                        <span>₸{Math.round(subtotal)}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                        Доставка
                        <span>₸{shipping}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center border-0 px-0 mb-3">
                        <div>
                          <strong>Сумма</strong>
                        </div>
                        <span>
                          <strong>₸{Math.round(subtotal + shipping)}</strong>
                        </span>
                      </li>
                    </ul>
                    <Link to="/checkout" className="btn btn-dark btn-lg btn-block">
                      Перейти к оформлению
                    </Link>
                    <button
                      className="btn btn-primary btn-lg btn-block mt-2"
                      onClick={() => handleCreateOrder(subtotal, shipping)}
                    >
                       Создать заказ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  };

  return (
    <>
      <Navbar />
      <div className="container my-3 py-3">
        <h1 className="text-center">Cart</h1>
        <hr />
        {state.length > 0 ? <ShowCart /> : <ShowCart />}
      </div>
      <Footer />

      {/* ====================
          Plain Bootstrap Modal
          ==================== */}
      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Order Created</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body text-center">
                <i
                  className="fas fa-check-circle text-success"
                  style={{ fontSize: "5rem" }}
                ></i>
                <p className="mt-3">Your order has been created successfully!</p>

              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
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

export default Cart;
