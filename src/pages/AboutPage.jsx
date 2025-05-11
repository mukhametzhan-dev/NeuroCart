import React from 'react'
import { Footer, Navbar } from "../components";
const AboutPage = () => {
  return (
    <>
      <Navbar />
      <div className="container my-3 py-3">
        <h1 className="text-center">About Us</h1>
        <hr />
        <p className="lead text-center">
        Our company is a leading online retailer of consumer electronics. We offer a wide range of products including smartphones, peripherals, laptops, and other electronics. Our products are sourced from reputable manufacturers and are sold at competitive prices. We are committed to providing our customers with high-quality products and excellent customer service.
        Main office in Almaty, Kazakhstan.
        Created by SDU students.
        </p>

        <h2 className="text-center py-4">Our Products</h2>
        <div className="row">
          <div className="col-md-3 col-sm-6 mb-3 px-3">
            <div className="card h-100">
              <img className="card-img-top img-fluid" src="https://cdn.thewirecutter.com/wp-content/media/2025/02/BEST-ANDROID-PHONES-2048px-2x1-1.jpg" alt="" height={160} />
              <div className="card-body">
                <h5 className="card-title text-center">Smartphones</h5>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6 mb-3 px-3">
            <div className="card h-100">
              <img className="card-img-top img-fluid" src="https://images2.minutemediacdn.com/image/upload/c_crop,x_0,y_193,w_2071,h_1164/c_fill,w_720,ar_16:9,f_auto,q_auto,g_auto/images/voltaxMediaLibrary/mmsport/mentalfloss/01g8eqh7x3frj93nqfh2.jpg" alt="" height={160} />
              <div className="card-body">
                <h5 className="card-title text-center">
                Peripherals</h5>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6 mb-3 px-3">
            <div className="card h-100">
              <img className="card-img-top img-fluid" src="https://media.licdn.com/dms/image/v2/D5612AQEKugq1B3lXOw/article-cover_image-shrink_600_2000/article-cover_image-shrink_600_2000/0/1709109157277?e=2147483647&v=beta&t=fHU7f65JrN8QhOrXJ_5tefo0tUdRYY80k0Xa1wLeswM" alt="" height={160} />
              <div className="card-body">
                <h5 className="card-title text-center">Laptops</h5>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6 mb-3 px-3">
            <div className="card h-100">
              <img className="card-img-top img-fluid" src="https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&w=600" alt="" height={160} />
              <div className="card-body">
                <h5 className="card-title text-center">Electronics</h5>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default AboutPage