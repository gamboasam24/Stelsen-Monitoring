import React, { useState, useEffect } from "react";
import { 
  Mail, Lock, Eye, EyeOff, AlertCircle, LogIn, 
  UserPlus, ArrowLeft, Phone, Key, CheckCircle,
  ChevronRight, Shield, Smartphone, Sparkles
} from "lucide-react";

import UserDashboard from "./frontend/user-dashboard.jsx";
import AdminDashboard from "./frontend/admin-dashboard.jsx";
import GoogleLoginButton from "./GoogleLoginButton.jsx";

// Define different views for the auth flow
const AUTH_VIEWS = {
  LOGIN: 'login',
  REGISTER: 'register',
  FORGOT_PASSWORD: 'forgot_password',
  VERIFICATION: 'verification',
  RESET_PASSWORD: 'reset_password'
};

function App() {
  // Auth states
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  // UI states
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingSession, setIsValidatingSession] = useState(true);
  
  // Auth flow state
  const [currentView, setCurrentView] = useState(AUTH_VIEWS.LOGIN);
  const [verificationStep, setVerificationStep] = useState(1);
  const [verificationSent, setVerificationSent] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [verificationPurpose, setVerificationPurpose] = useState(null);

  // ✅ Check localStorage and validate session with backend on mount
  useEffect(() => {
    const validateSession = async () => {
      setIsValidatingSession(true);
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("auth_token");
      
      if (storedUser && storedToken) {
        try {
          const response = await fetch("/backend/login.php", {
            method: "GET",
            credentials: "include"
          });
          
          const data = await response.json();

          if (data.status === "success" && data.user) {
            setCurrentUser(data.user);
            setLoggedIn(true);
          } else {
            console.log("Backend session expired, clearing local storage");
            localStorage.removeItem("user");
            localStorage.removeItem("auth_token");
            setCurrentUser(null);
            setLoggedIn(false);
          }
        } catch (error) {
          console.error("Failed to validate session:", error);
          localStorage.removeItem("user");
          localStorage.removeItem("auth_token");
          setCurrentUser(null);
          setLoggedIn(false);
        }
      }
      setTimeout(() => {
        setIsValidatingSession(false);
      }, 500);
    } // Closing the function properly
    
    validateSession();
  }, []);

  //============================================ Handle Logout ============================================//
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("auth_token");
    setCurrentUser(null);
    setLoggedIn(false);
    setEmail("");
    setPhone("");
    setPassword("");
    setConfirmPassword("");
    setNewPassword("");
    setVerificationCode("");
    setError("");
    setSuccess("");
    setCurrentView(AUTH_VIEWS.LOGIN);
  };

  //============================================ Handle Login ============================================//
  const handleLogin = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) return setError("Please enter email and password.");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return setError("Please enter a valid email.");

    if (password.length < 6) return setError("Password must be at least 6 characters.");

    setIsLoading(true);

    fetch("/backend/login.php", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
      .then((res) => {
        if (!res.ok) {
          return res.text().then(text => {
            console.error("Server error:", text);
            throw new Error(`Server error: ${res.status}`);
          });
        }
        return res.json();
      })
      .then((data) => {
        setIsLoading(false);
        if (data.status === "success") {
          setSuccess("Login successful! Redirecting...");
          localStorage.setItem("auth_token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          setCurrentUser(data.user);
          setTimeout(() => {
            setLoggedIn(true);
          }, 1000);
        } else {
          setError(data.message || "Invalid credentials");
        }
      })
      .catch((err) => {
        setIsLoading(false);
        console.error("Login error:", err);
        setError(err.message || "Network error. Try again.");
      });
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!email || !phone || !password || !confirmPassword ) {
      return setError("Please fill in all required fields.");
    }

    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    if (password.length < 8) {
      return setError("Password must be at least 8 characters.");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return setError("Please enter a valid email.");

    const phoneRegex = /^\+?[0-9]{7,15}$/;
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
      return setError("Please enter a valid phone number.");
    }

    setIsLoading(true);
    fetch("/backend/register.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, phone, password }),
    })
      .then(res => res.json())
      .then(data => {
        setIsLoading(false);
        if (data.status === "success") {
          setVerificationPurpose("register");
          setCurrentView(AUTH_VIEWS.VERIFICATION);
          setSuccess("Verification code sent to your email!");
        } else {
          setError(data.message);
        }
      })
      .catch(() => {
        setIsLoading(false);
        setError("Network error. Try again.");
      });
  };

  //============================================ Handle Forgot Password ============================================//
  const handleForgotPassword = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    fetch("/backend/forgot_password.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send_code",
        email
      })
    })
      .then(res => res.json())
      .then(data => {
        setIsLoading(false);
        if (data.status === "success") {
          setSuccess("Verification code sent to your email");
          setVerificationPurpose("forgot");
          setCurrentView(AUTH_VIEWS.VERIFICATION);
        } else {
          setError(data.message);
        }
      })
      .catch(() => {
        setIsLoading(false);
        setError("Server error. Try again.");
      });
  };

  //============================================ Handle Verification ============================================//
  const handleVerification = (e) => {
    e.preventDefault();

    if (!verificationPurpose) {
      setError("Invalid verification flow.");
      return;
    }

    const purpose = verificationPurpose;
    setError("");
    setSuccess("");
    setIsLoading(true);

    const endpoint =
      purpose === "register"
        ? "/backend/verify.php"
        : "/backend/forgot_password.php";

    const payload =
      purpose === "register"
        ? { email, code: verificationCode }
        : { action: "verify_code", email, code: verificationCode };

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        setIsLoading(false);

        if (data.status === "success") {
          setVerificationCode("");

          if (purpose === "register") {
            setSuccess("Account verified! You can now log in.");
            setCurrentView(AUTH_VIEWS.LOGIN);
          } else {
            setSuccess("Code verified. Create a new password.");
            setCurrentView(AUTH_VIEWS.RESET_PASSWORD);
          }

          setVerificationPurpose(null);
        } else {
          setError(data.message || "Verification failed.");
        }
      })
      .catch(() => {
        setIsLoading(false);
        setError("Server error. Please try again.");
      });
  };

  //============================================ Handle Reset Password ============================================//
  const handleResetPassword = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newPassword || newPassword.length < 8) {
      return setError("Password must be at least 8 characters.");
    }

    if (newPassword !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    setIsLoading(true);

    fetch("/backend/forgot_password.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "reset_password",
        email,
        password: newPassword
      })
    })
      .then(res => res.json())
      .then(data => {
        setIsLoading(false);

        if (data.status === "success") {
          setSuccess("Password reset successfully! You can now log in.");
          setCurrentView(AUTH_VIEWS.LOGIN);
          setNewPassword("");
          setConfirmPassword("");
          setVerificationCode("");
        } else {
          setError(data.message || "Reset failed");
        }
      })
      .catch(() => {
        setIsLoading(false);
        setError("Server error. Please try again.");
      });
  };

  //=========================================== Handle Resend Code Email ============================================
  const handleResendCode = () => {
    setSuccess("New verification code sent to your email!");
    setVerificationStep(1);
    setTimeout(() => setVerificationStep(2), 1000);
  };

  // =========================================== GOOGLE LOGIN ========================================================
  const handleGoogleLoginSuccess = (googleUser) => {
    setError("");
    setSuccess("");
    setIsLoading(true);

    fetch("/backend/google_login.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(googleUser),
    })
      .then(res => res.json())
      .then(data => {
        setIsLoading(false);

        if (data.status === "success") {
          localStorage.setItem("auth_token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));

          setCurrentUser(data.user);
          setSuccess("Logged in with Google 🚀");

          setTimeout(() => {
            setLoggedIn(true);
          }, 800);
        } else {
          setError(data.message || "Google login failed");
        }
      })
      .catch(() => {
        setIsLoading(false);
        setError("Google login error. Try again.");
      });
  };

  //========================================= Quick login for demo ===================================================
  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setCurrentView(AUTH_VIEWS.LOGIN);
  };

  // Show loading screen while validating session
  if (isValidatingSession) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-white flex items-center justify-center z-50">
      <div className="flex flex-col items-center">
        <div className="relative mb-8">
        <img 
          src="/img/stelsenlogo.png" 
          alt="Stelsen Logo" 
          className="h-24 w-24 object-contain bg-white rounded-3xl p-2 shadow-lg"
        />
      
        </div>
        <div className="flex flex-col items-center">
        <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-800 text-lg font-semibold">Loading Stelsen...</p>
        <p className="text-gray-500 text-sm mt-2">Securing your session</p>
        </div>
      </div>
      </div>
    );
  }

  if (loggedIn && user) {
    return user.account_type === "admin" ? (
      <AdminDashboard user={user} logout={handleLogout} />
    ) : (
      <UserDashboard user={user} logout={handleLogout} />
    );
  }

  //===================================== Render different auth views ==============================================
  const renderLoginView = () => (
    <>
      <div className="space-y-6">
        {/* Success Message */}
        {success && (
          <div className="mb-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl flex items-center gap-3 animate-fadeIn">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="text-emerald-600" size={20} />
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium text-emerald-800">
                {success}
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 ml-1">
              Email Address
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <Mail className="text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
              </div>
              <input
                type="email"
                className="pl-12 pr-4 py-4 w-full bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 placeholder:text-gray-400 text-base"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700 ml-1">
                Password
              </label>
            </div>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <Lock className="text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                className="pl-12 pr-12 py-4 w-full bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 placeholder:text-gray-400 text-base"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="inline-flex items-center cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-6 h-6 bg-gray-100 border-2 border-gray-300 rounded-lg peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all duration-200"></div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 peer-checked:opacity-100 transition-opacity">
                  <div className="w-3 h-3 bg-white rounded-sm"></div>
                </div>
              </div>
              <span className="ml-3 text-sm text-gray-600">
                Remember me
              </span>
            </label>

            <button
              type="button"
              onClick={() => {
                setCurrentView(AUTH_VIEWS.FORGOT_PASSWORD);
                setError("");
                setSuccess("");
              }}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl flex items-start gap-3 animate-shake">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="text-red-500" size={20} />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
                <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 px-4 font-semibold rounded-full transition-all duration-300 flex items-center justify-center gap-3 shadow-lg ${
                  isLoading 
                  ? "bg-blue-400 cursor-not-allowed" 
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98]"
                } text-white`}
                >
                {isLoading ? (
                  <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                  </>
                ) : (
                  <>
                  <div className="flex items-center gap-3">
                    <span>Sign In to Dashboard</span>
                  </div>
                  </>
                )}
                </button>

                {/* Divider */}
          <div className="relative flex items-center justify-center py-4">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="mx-4 text-sm text-gray-500 font-medium">Or continue with</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* Social Login */}
          <div className="flex gap-3">
            <GoogleLoginButton onLoginSuccess={handleGoogleLoginSuccess} />
          </div>
        </form>

        {/* Register Link */}
        <div className="text-center pt-2">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <button
              onClick={() => {
                setCurrentView(AUTH_VIEWS.REGISTER);
                setError("");
                setSuccess("");
              }}
              className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
            >
              Create an account
            </button>
          </p>
        </div>
      </div>
    </>
  );

  const renderRegisterView = () => (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => {
              setCurrentView(AUTH_VIEWS.LOGIN);
              setError("");
              setSuccess("");
            }}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Join Stelsen Monitoring and access your dashboard
        </p>

        <form onSubmit={handleRegister} className="space-y-5">

          {/* Email */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 ml-1">
              Email Address
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <Mail className="text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
              </div>
              <input
                type="email"
                className="pl-12 pr-4 py-4 w-full bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 placeholder:text-gray-400 text-base"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 ml-1">
              Phone Number
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <Phone className="text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
              </div>
              <input
                type="tel"
                className="pl-12 pr-4 py-4 w-full bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 placeholder:text-gray-400 text-base"
                placeholder="0910 123 4567"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setError("");
                }}
                required
                autoComplete="tel"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 ml-1">
              Password
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <Lock className="text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                className="pl-12 pr-12 py-4 w-full bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 placeholder:text-gray-400 text-base"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 ml-1">
              Confirm Password
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <Lock className="text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="pl-12 pr-12 py-4 w-full bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 placeholder:text-gray-400 text-base"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError("");
                }}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Password Requirements */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
            <p className="text-sm font-medium text-gray-700 mb-3">Password Requirements:</p>
            <ul className="text-xs text-gray-600 space-y-2">
              <li className={`flex items-center gap-3 ${password.length >= 8 ? 'text-green-600' : ''}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${password.length >= 8 ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <div className={`w-2 h-2 rounded-full ${password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                </div>
                At least 8 characters
              </li>
              <li className={`flex items-center gap-3 ${/[A-Z]/.test(password) ? 'text-green-600' : ''}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${/[A-Z]/.test(password) ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <div className={`w-2 h-2 rounded-full ${/[A-Z]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                </div>
                One uppercase letter
              </li>
              <li className={`flex items-center gap-3 ${/\d/.test(password) ? 'text-green-600' : ''}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${/\d/.test(password) ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <div className={`w-2 h-2 rounded-full ${/\d/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                </div>
                One number
              </li>
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="text-red-500" size={20} />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="text-emerald-600" size={20} />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-emerald-800">{success}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 px-4 font-semibold rounded-full transition-all duration-300 flex items-center justify-center gap-3 shadow-lg ${
              isLoading 
                ? "bg-blue-400 cursor-not-allowed" 
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98]"
            } text-white`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="text-center pt-4">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <button
              onClick={() => {
                setCurrentView(AUTH_VIEWS.LOGIN);
                setError("");
                setSuccess("");
              }}
              className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </>
  );

  const renderForgotPasswordView = () => (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => {
              setCurrentView(AUTH_VIEWS.LOGIN);
              setError("");
              setSuccess("");
            }}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
        </div>

        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Key className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                Enter your email address and we'll send you instructions to reset your password.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleForgotPassword} className="space-y-5">
          {/* Email Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 ml-1">
              Email Address
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <Mail className="text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
              </div>
              <input
                type="email"
                className="pl-12 pr-4 py-4 w-full bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 placeholder:text-gray-400 text-base"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                required
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="text-red-500" size={20} />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="text-emerald-600" size={20} />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-emerald-800">{success}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 px-4 font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg ${
              isLoading 
                ? "bg-blue-400 cursor-not-allowed" 
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98]"
            } text-white`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Sending instructions...</span>
              </>
            ) : (
              <>
                <Key size={20} />
                <span>Send Reset Link</span>
              </>
            )}
          </button>
        </form>

        {/* Back to Login */}
        <div className="text-center pt-4">
          <button
            onClick={() => {
              setCurrentView(AUTH_VIEWS.LOGIN);
              setError("");
              setSuccess("");
            }}
            className="text-sm text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </>
  );

  const renderVerificationView = () => (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => {
              setCurrentView(AUTH_VIEWS.REGISTER);
              setError("");
              setSuccess("");
            }}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Verify Your Email</h2>
        </div>

        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Mail className="text-blue-600" size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Check your email
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            We've sent a 6-digit verification code to:
          </p>
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 mb-6">
            <p className="font-medium text-gray-900 text-base">{email}</p>
          </div>
        </div>

        <form onSubmit={handleVerification} className="space-y-5">
          {/* Verification Code */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 ml-1">
              Verification Code
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <Key className="text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
              </div>
              <input
                type="text"
                maxLength="6"
                pattern="[0-9]*"
                inputMode="numeric"
                className="pl-12 pr-4 py-4 w-full bg-white border border-gray-200 rounded-xl text-gray-900 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setVerificationCode(value);
                  setError("");
                }}
                required
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="text-red-500" size={20} />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="text-emerald-600" size={20} />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-emerald-800">{success}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 px-4 font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg ${
              isLoading 
                ? "bg-blue-400 cursor-not-allowed" 
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98]"
            } text-white`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                <span>Verify Account</span>
              </>
            )}
          </button>
        </form>

        {/* Resend Code */}
        <div className="text-center pt-4">
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">
              Didn't receive the code?
            </p>
            <button
              onClick={handleResendCode}
              className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors text-base"
            >
              Resend code
            </button>
          </div>
        </div>
      </div>
    </>
  );

  const renderResetPasswordView = () => (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => {
              setCurrentView(AUTH_VIEWS.LOGIN);
              setError("");
              setSuccess("");
            }}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Create New Password</h2>
        </div>

        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Lock className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                Create a strong, new password for your account.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-5">
          {/* New Password */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 ml-1">
              New Password
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <Lock className="text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
              </div>
              <input
                type={showNewPassword ? "text" : "password"}
                className="pl-12 pr-12 py-4 w-full bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 placeholder:text-gray-400 text-base"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError("");
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 ml-1">
              Confirm New Password
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <Lock className="text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="pl-12 pr-12 py-4 w-full bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 placeholder:text-gray-400 text-base"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError("");
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="text-red-500" size={20} />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="text-emerald-600" size={20} />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-emerald-800">{success}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 px-4 font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg ${
              isLoading 
                ? "bg-blue-400 cursor-not-allowed" 
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98]"
            } text-white`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Resetting password...</span>
              </>
            ) : (
              <>
                <Key size={20} />
                <span>Reset Password</span>
              </>
            )}
          </button>
        </form>
      </div>
    </>
  );

  // Main render
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex flex-col overflow-x-hidden" style={{ overscrollBehavior: 'none', touchAction: 'pan-y' }}>
      {/* Full Screen Mobile App Container */}
      <div className="w-full min-h-screen flex flex-col overflow-x-hidden">
        
        {/* App Header with Logo - Mobile Optimized */}
        <div className="relative pt-10 pb-8 px-4 flex-shrink-0">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/20 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute top-2 left-80 w-32 h-32 bg-white/20 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/20 rounded-full translate-x-1/3 translate-y-1/3"></div>
          <div className="absolute bottom-0 right-80 w-24 h-24 bg-white/20 rounded-full translate-x-1/3 translate-y-1/3"></div>


          {/* App Logo/Image */}
          <div className="relative z-8 flex flex-col items-center">
            {/* App Icon - PNG Image */}
            <div className="mb-4">
              <img 
                src="/img/Stelsen Logo.png" 
                alt="Stelsen Logo" 
                className="h-32 w-auto object-contain bg-white rounded-2xl p-3 shadow-lg"
              />
            </div>
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <Smartphone className="text-white/90" size={16} />
                <p className="text-white/90 text-sm font-medium">
                  {currentView === AUTH_VIEWS.LOGIN && "Welcome back! Sign in to continue"}
                  {currentView === AUTH_VIEWS.REGISTER && "Join Stelsen Monitoring"}
                  {currentView === AUTH_VIEWS.FORGOT_PASSWORD && "Reset your password"}
                  {currentView === AUTH_VIEWS.VERIFICATION && "Verify your email"}
                  {currentView === AUTH_VIEWS.RESET_PASSWORD && "Create new password"}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 px-4 pt-6 md:px-8 pb-32 rounded-t-[2rem] bg-white shadow-lg">
          <div className="w-full max-w-md mx-auto">
            {/* Auth Card */}
            <div className="rounded-3xl shadow-xl border border-gray-100 p-6 transform transition-all duration-300 hover:shadow-2xl">
              {/* Auth View Router */}
              {currentView === AUTH_VIEWS.LOGIN && renderLoginView()}
              {currentView === AUTH_VIEWS.REGISTER && renderRegisterView()}
              {currentView === AUTH_VIEWS.FORGOT_PASSWORD && renderForgotPasswordView()}
              {currentView === AUTH_VIEWS.VERIFICATION && renderVerificationView()}
              {currentView === AUTH_VIEWS.RESET_PASSWORD && renderResetPasswordView()}
            </div>
            
            {/* Footer - Inside scrollable area */}
            <div className="py-8 text-center mt-8">
              <p className="text-xs text-gray-500">
                By continuing, you agree to our{" "}
                <a href="#" className="text-blue-600 hover:underline font-medium">
                  Terms
                </a>{" "}
                and{" "}
                <a href="#" className="text-blue-600 hover:underline font-medium">
                  Privacy Policy
                </a>
              </p>
              <p className="mt-2 text-xs text-gray-400">
                Stelsen Monitoring v2.0 • © 2026
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
