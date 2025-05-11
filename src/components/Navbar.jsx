import React, { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'

const Navbar = () => {
    const state = useSelector(state => state.handleCart)
    const accessToken = localStorage.getItem('access_token');
    const [scrolled, setScrolled] = useState(false);
    const [expanded, setExpanded] = useState(false);

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 20) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        window.location.href = '/';
    };

    const toggleNavbar = () => {
        setExpanded(!expanded);
    };

    const closeNavbar = () => {
        if (expanded) setExpanded(false);
    };

    return (
<nav
  className={`navbar navbar-expand-lg ${
    scrolled ? "navbar-light bg-white shadow-sm" : "navbar-light bg-white"
  } py-2 sticky-top transition-all`}
  style={{ transition: "all 0.3s ease" }}
>
            <div className="container" >
                {/* Make container smaller  */}
                
                <NavLink className="navbar-brand fw-bold px-2 d-flex align-items-center" to="/" onClick={closeNavbar}>
                    <img 
                        className='logo me-2' 
                        src="/assets/logo.png" 
                        alt="NeuroCart" 
                        width={scrolled ? 150 : 180} 
                        height={scrolled ? 65 :70} 
                        style={{
                            objectFit: "contain",
                            transition: 'all 0.3s ease'
                        }} 
                    />
                </NavLink>
                
                <button 
                    className={`navbar-toggler ${expanded ? '' : 'collapsed'}`}
                    type="button" 
                    onClick={toggleNavbar}
                    aria-controls="navbarSupportedContent" 
                    aria-expanded={expanded ? "true" : "false"} 
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className={`collapse navbar-collapse ${expanded ? 'show' : ''}`} id="navbarSupportedContent">
                    <ul className="navbar-nav m-auto my-2 text-center">
                        <li className="nav-item mx-2">
                            <NavLink 
                                className={({isActive}) => 
                                    isActive ? "nav-link active fw-bold border-bottom border-dark" : "nav-link"
                                } 
                                to="/"
                                onClick={closeNavbar}
                            >
                                <i className="fa fa-home me-1"></i> Home 
                            </NavLink>
                        </li>
                        <li className="nav-item mx-2">
                            <NavLink 
                                className={({isActive}) => 
                                    isActive ? "nav-link active fw-bold border-bottom border-dark" : "nav-link"
                                } 
                                to="/product"
                                onClick={closeNavbar}
                            >
                                <i className="fa fa-shopping-bag me-1"></i> Catalog
                            </NavLink>
                        </li>
                        <li className="nav-item mx-2">
                            <NavLink 
                                className={({isActive}) => 
                                    isActive ? "nav-link active fw-bold border-bottom border-dark" : "nav-link"
                                } 
                                to="/about"
                                onClick={closeNavbar}
                            >
                                <i className="fa fa-info-circle me-1"></i> About us
                            </NavLink>
                        </li>
                        <li className="nav-item mx-2">
                            <NavLink 
                                className={({isActive}) => 
                                    isActive ? "nav-link active fw-bold border-bottom border-dark" : "nav-link"
                                } 
                                to="/contact"
                                onClick={closeNavbar}
                            >
                                <i className="fa fa-envelope me-1"></i> Contact
                            </NavLink>
                        </li>
                    </ul>
                    <div className="buttons text-center d-flex flex-wrap justify-content-center">
                        {accessToken ? (
                            <>
                                <NavLink to="/profile" className="btn btn-outline-dark btn-sm m-1 px-3" onClick={closeNavbar}>
                                    <i className="fa fa-user me-1"></i> Profile
                                </NavLink>
                                <button onClick={() => {handleLogout(); closeNavbar();}} className="btn btn-outline-danger btn-sm m-1 px-3">
                                    <i className="fa fa-sign-out-alt me-1"></i> Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <NavLink to="/login" className="btn btn-outline-dark btn-sm m-1 px-3" onClick={closeNavbar}>
                                    <i className="fa fa-sign-in-alt me-1"></i> Login
                                </NavLink>
                                <NavLink to="/register" className="btn btn-outline-dark btn-sm m-1 px-3" onClick={closeNavbar}>
                                    <i className="fa fa-user-plus me-1"></i> Sign-up
                                </NavLink>
                            </>
                        )}
                        <NavLink to="/cart" className="btn btn-dark btn-sm m-1 px-3 position-relative" onClick={closeNavbar}>
                            <i className="fa fa-shopping-cart me-1"></i> Cart 
                            {state.length > 0 && (
                                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                    {state.length}
                                    <span className="visually-hidden">items in cart</span>
                                </span>
                            )}
                        </NavLink>
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default Navbar