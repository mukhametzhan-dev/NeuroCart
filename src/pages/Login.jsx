import React, { useState } from "react";
import { Link, redirect } from "react-router-dom";
import { Footer, Navbar } from "../components";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
      const [modal, setModal] = useState({
          show: false,
          title: '',
          message: '',
          icon: ''
      });
      const closeModal = () => {
        setModal({
            ...modal,
            show: false
        });
    };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("https://kajet24.work.gd/api/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {

        window.location.href = "/";
        // Handle successful login
        console.log("Login successful");
        setModal({
          show: true,
          title: ' Успешный вход',
          message: 'Вы успешно вошли в систему',
          icon: 'success'
      });
      const data = await response.json();
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      console.log(data);
  
      } else {
        // Handle login error
        console.log("❌ Login failed with status:", response.status);
        setModal({
          show: true,
          title: 'Ошибка входа',
          message: 'Неправильный логин или пароль',  
          icon: 'error'
      });
      }
    } catch (error) {
      console.error("Error during fetch:", error);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container my-3 py-3">
        <h1 className="text-center">Вход</h1>
        <hr />
        <div className="row my-4 h-100">
          <div className="col-md-4 col-lg-4 col-sm-8 mx-auto">
            <form onSubmit={handleSubmit}>
              <div className="my-3">
                <label htmlFor="username">Имя пользователя</label>
                <input
                  type="text"
                  className="form-control"
                  id="username"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="my-3">
                <label htmlFor="password">Пароль</label>
                <input
                  type="password"
                  className="form-control"
                  id="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="my-3">
                <p>
                  Впервые на сайте?{" "}
                  <Link
                    to="/register"
                    className="text-decoration-underline text-info"
                  >
                    Регистрация
                  </Link>
                </p>
              </div>
              <div className="text-center">
                <button className="my-2 mx-auto btn btn-dark" type="submit">
                  Войти
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
      {modal.show && (
                <div className="modal show d-block" tabIndex="-1">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{modal.title}</h5>
                                {modal.icon === 'error' && <i className="fas fa-exclamation-triangle text-danger" style={{marginLeft:"2rem"}}> </i>}
                                {modal.icon === 'success' && <i className="fas fa-check-circle text-success"  style={{marginLeft:"2rem"}} ></i>}
                                <button type="button" className="btn-close" aria-label="Close" onClick={closeModal}></button>
                            </div>
                            <div className="modal-body">
                                <p>{modal.message}</p>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>Close</button>
                            </div>

                        </div>
                    </div>
                </div>
            )}
    </>
  );
};

export default Login;