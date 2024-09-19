import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ThemeContext } from "../theme/ThemeContext";
import { login, fetchGoogleClientId } from "../../utils/apiUtils";
import { GoogleLogin } from "@react-oauth/google";
import "./Login.scss";
import axios from "axios";
import { GoogleOAuthProvider } from "@react-oauth/google";
import testAccounts from "../../utils/testAccounts.ts";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { isDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [googleClientId, setGoogleClientId] = useState("");

  useEffect(() => {
    const loadGoogleClientId = async () => {
      const clientId = await fetchGoogleClientId();
      if (clientId) {
        setGoogleClientId(clientId);
      }
    };
    loadGoogleClientId();
  }, []);

  // Log only if googleClientId is still empty after loading
  useEffect(() => {
    if (!googleClientId) {
      console.log("Google client ID not available");
    }
  }, [googleClientId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      for (const account of testAccounts) {
        if (account.email === email && account.password === password) {
          // Role-based routing
          let role = account.role;
          let route = `/${account.role}`;
          navigate(`/${account.role}`);
          if(role === 0){
            route = `/member`;
          }
          if(role === 1){
            route = `/staff`;
          }
          if(role === 2){
            route = `/breeder`;
          }
          if(role === 3){
            route = `/manager`;
          }
          navigate(route);
          return;
        }
      }
      // Uncomment this if you want to use the normal login API
      // const data = await login(email, password);
      // localStorage.setItem("token", data.token);
      // navigate("/");
    } catch (error) {
      setError(error.message || "An error occurred during login");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await axios.post(
        "http://localhost:4000/api/v1/oauth2/google",
        {
          token: credentialResponse.credential,
        }
      );

      if (response.status === 200) {
        localStorage.setItem("token", response.data.token);
        navigate("/");
      } else {
        setError("Google login failed");
      }
    } catch (error) {
      setError(
        error.response?.data?.message || "An error occurred during Google login"
      );
    }
  };

  return (
    <div className={`login-container ${isDarkMode ? "dark-mode" : ""}`}>
      <form className="form" onSubmit={handleSubmit}>
        {error && <p className="error">{error}</p>}
        <div className="flex-column">
          <label>Email</label>
        </div>
        <div className="inputForm">
          <input
            type="email"
            className="input"
            placeholder="Enter your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="flex-column">
          <label>Password</label>
        </div>
        <div className="inputForm">
          <input
            type="password"
            className="input"
            placeholder="Enter your Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button className="button-submit" type="submit">
          Login
        </button>
        <p className="p">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="span">
            Register here
          </Link>
        </p>
      </form>

      {/* Google Login Section */}
      {googleClientId && (
        <GoogleOAuthProvider clientId={googleClientId}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError("Google login failed")}
            useOneTap
            shape={"square"}
            size={"large"}
            width={390}
          />
        </GoogleOAuthProvider>
      )}
    </div>
  );
};

export default Login;