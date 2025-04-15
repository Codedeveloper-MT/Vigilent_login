import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./App.css";

const Profile = () => {
  const [formData, setFormData] = useState({
    username: "",
    country: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = "Username is required";
    else if (formData.username.length < 4) newErrors.username = "Username must be at least 4 characters";
    if (!formData.country.trim()) newErrors.country = "Country is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 5) newErrors.password = "Password must be at least 5 characters";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const apiUrl = import.meta.env.PROD
        ? 'https://https://testing-fed3.onrender.com/api/register'
        : '/api/register';

      const response = await axios.post(
        apiUrl,
        {
          username: formData.username,
          country: formData.country,
          phone: formData.phone,
          password: formData.password
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        }
      );

      if (response.data.success) {
        setMessage({ text: 'Registration successful!', type: 'success' });
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (error) {
      let errorMessage = 'Registration failed';
      if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Cannot connect to server. Please check your connection.';
      } else if (error.response) {
        errorMessage = error.response.data.error || errorMessage;
      }
      setMessage({ text: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="registration-container">
      <div className="form-container">
        <h2>Create an Account</h2>
        {message.text && <p className={`message ${message.type}`}>{message.text}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              className={errors.username ? "error" : ""}
              required
            />
            {errors.username && <small className="error-text">{errors.username}</small>}
          </div>

          <div className="form-group">
            <input
              type="text"
              name="country"
              placeholder="Country"
              value={formData.country}
              onChange={handleChange}
              className={errors.country ? "error" : ""}
              required
            />
            {errors.country && <small className="error-text">{errors.country}</small>}
          </div>

          <div className="form-group">
            <input
              type="text"
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              className={errors.phone ? "error" : ""}
              required
            />
            {errors.phone && <small className="error-text">{errors.phone}</small>}
          </div>

          <div className="form-group">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? "error" : ""}
              required
            />
            {errors.password && <small className="error-text">{errors.password}</small>}
          </div>

          <div className="form-group">
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? "error" : ""}
              required
            />
            {errors.confirmPassword && <small className="error-text">{errors.confirmPassword}</small>}
          </div>

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Creating Account..." : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
