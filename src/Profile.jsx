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
  const [isAssistantActive, setIsAssistantActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Speech synthesis with error handling
  const speak = (text) => {
    if (!isAssistantActive) return;
    
    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel(); // Cancel any ongoing speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error("Speech synthesis error:", err);
      }
    }
  };

  useEffect(() => {
    speak("You are about to create an account. Please fill in all required fields.");
    return () => {
      window.speechSynthesis.cancel(); // Clean up on unmount
    };
  }, []);

  const toggleAssistant = () => {
    const newState = !isAssistantActive;
    setIsAssistantActive(newState);
    speak(newState ? "Assistant is ready to help." : "Assistant turned off.");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,3}[-\s.]?[0-9]{3,6}$/im;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;

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
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!passwordRegex.test(formData.password)) {
      newErrors.password = "Password must be at least 8 characters with uppercase, lowercase and numbers";
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
        "http://localhost:5000/api/register", 
        {
          username: formData.username,
          country: formData.country,
          phone: formData.phone,
          password: formData.password
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        const successMessage = "Account created successfully! Redirecting to login...";
        setMessage({ text: successMessage, type: "success" });
        speak(successMessage);
        setTimeout(() => navigate("/login"), 3000);
      }
    } catch (error) {
      let errorMessage = "An error occurred during registration.";
      if (error.response) {
        errorMessage = error.response.data.error || errorMessage;
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
              placeholder="Phone Number (e.g., +1234567890)"
              value={formData.phone}
              onChange={handleChange}
              className={errors.phone ? "error" : ""}
              aria-describedby="phoneHelp"
              required
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