import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./App.css";

const Profile = () => {
  const [formData, setFormData] = useState({
    username: "",
    country: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isAssistantActive, setIsAssistantActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Use Render's environment variable or fallback to local development
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const speak = (text) => {
    if (!isAssistantActive) return;
    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error("Speech synthesis error:", err);
      }
    }
  };

  useEffect(() => {
    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance("You are about to create an account. Please fill in all required fields.");
        utterance.lang = "en-US";
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error("Speech synthesis error:", err);
      }
    }
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const toggleAssistant = () => {
    const newState = !isAssistantActive;
    setIsAssistantActive(newState);
    speak(newState ? "Assistant is ready to help." : "Assistant turned off.");
  };

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

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 4) {
      newErrors.username = "Username must be at least 4 characters";
    }

    if (!formData.country.trim()) {
      newErrors.country = "Country is required";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 5) {
      newErrors.password = "Password must be at least 5 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      speak("Please correct the errors in the form.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/register`,
        {
          username: formData.username,
          country: formData.country,
          phone: formData.phone,
          password: formData.password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        const successMessage = "Account created successfully! Redirecting to login...";
        setMessage({ text: successMessage, type: "success" });
        speak(successMessage);
        setFormData({
          username: "",
          country: "",
          phone: "",
          password: "",
          confirmPassword: "",
        });
        setTimeout(() => navigate("/login"), 3000);
      }
    } catch (error) {
      let errorMessage = "An error occurred during registration.";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.request) {
        errorMessage = "Network error - could not connect to server";
      }
      setMessage({ text: errorMessage, type: "error" });
      speak(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="registration-container">
      <div className="form-container">
        <h2>Create an Account</h2>

        {message.text && (
          <p className={`message ${message.type}`}>
            {message.text}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              className={errors.username ? "error" : ""}
              aria-describedby="usernameHelp"
              required
              autoComplete="username"
            />
            {errors.username && (
              <small id="usernameHelp" className="error-text">
                {errors.username}
              </small>
            )}
          </div>

          <div className="form-group">
            <input
              type="text"
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              className={errors.phone ? "error" : ""}
              aria-describedby="phoneHelp"
              required
              autoComplete="tel"
            />
            {errors.phone && (
              <small id="phoneHelp" className="error-text">
                {errors.phone}
              </small>
            )}
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
              autoComplete="country"
            />
            {errors.country && (
              <small className="error-text">{errors.country}</small>
            )}
          </div>

          <div className="form-group">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? "error" : ""}
              aria-describedby="passwordHelp"
              required
              autoComplete="new-password"
            />
            {errors.password && (
              <small id="passwordHelp" className="error-text">
                {errors.password}
              </small>
            )}
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
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <small className="error-text">{errors.confirmPassword}</small>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={isLoading ? "loading" : ""}
          >
            {isLoading ? "Creating Account..." : "Register"}
          </button>

          <button
            type="button"
            onClick={toggleAssistant}
            className={`assistant-btn ${isAssistantActive ? "active" : ""}`}
            aria-label={isAssistantActive ? "Turn off assistant" : "Turn on assistant"}
          >
            {isAssistantActive ? "Stop Assistant" : "Start Assistant"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;