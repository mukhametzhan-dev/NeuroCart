import React from "react";
import { Footer, Navbar } from "../components";

const ContactPage = () => {
  const [result, setResult] = React.useState("");
  const [showModal, setShowModal] = React.useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setResult("Sending...");
    const formData = new FormData(event.target);
    formData.append("access_key", "787ae5db-7097-44bd-b193-8ff3e8d96b1a");

    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    console.log(data);

    if (data.success) {
      setResult("Отправлено");
      event.target.reset();
      setShowModal(true);
    } else {
      console.error("Error", data);
      setResult(data.message);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container my-3 py-3">
        <h1 className="text-center">Контактная форма</h1>
        <p>
          Если у вас возникли какие-либо вопросы, заполните форму ниже, и мы свяжемся с вами.
        </p>
        <hr />
        <div className="row my-4 h-100">
          <div className="col-md-4 col-lg-4 col-sm-8 mx-auto">
            <form onSubmit={onSubmit}>
              <div className="form my-3">
                <label htmlFor="Name">Имя</label>
                <input
                  type="text"
                  className="form-control"
                  id="Name"
                  name="name"
                  placeholder="Имя"
                  required
                />
              </div>
              <div className="form my-3">
                <label htmlFor="Email">Email</label>
                <input
                  type="email"
                  className="form-control"
                  id="Email"
                  name="email"
                  placeholder="name@example.com"
                  required
                />
              </div>
              <div className="form my-3">
                <label htmlFor="Message">Сообщение</label>
                <textarea
                  rows={5}
                  className="form-control"
                  id="Message"
                  name="message"
                  placeholder="Введите ваше сообщение"
                  required
                />
              </div>
              <div className="text-center">
                <button
                  className="my-2 px-4 mx-auto btn btn-dark"
                  type="submit"
                >
                  Отправить
                </button>
              </div>
              <div className="text-center mt-3">{result}</div>
            </form>
          </div>
        </div>
      </div>
      <Footer />

      {/* Success Modal */}
      {showModal && (
        <div
          className="modal show fade d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Сообщение отправлено</h5>
                <button
                  type="button"
                  className="close"
                  onClick={() => setShowModal(false)}
                >
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body text-center">
                <img
                  src="/assets/message.jpg"
                  alt="Сообщение отправлено"
                  className="img-fluid"
                />
                <p className="mt-3">
                  Мы получили ваше сообщение и свяжемся с вами в ближайшее время.
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowModal(false)}
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ContactPage;
