import { useEffect } from "react";

const GoogleLoginButton = ({ onLoginSuccess }) => {

  useEffect(() => {
    // Wait for Google SDK to load
    const initializeGoogleSignIn = () => {
      if (!window.google) {
        console.warn("Google SDK not loaded yet");
        return;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: "540990968261-e8mggmro0shvmu4cqouueo8gvian6bdo.apps.googleusercontent.com",
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        window.google.accounts.id.renderButton(
          document.getElementById("googleSignInBtn"),
          { 
            theme: "outline", 
            size: "large",
            width: "100%",
            text: "continue_with",
            shape: "rectangular"
          }
        );
      } catch (error) {
        console.error("Google Sign-In initialization error:", error);
      }
    };

    // Check if SDK is already loaded
    if (window.google) {
      initializeGoogleSignIn();
    } else {
      // Wait for SDK to load
      const checkInterval = setInterval(() => {
        if (window.google) {
          clearInterval(checkInterval);
          initializeGoogleSignIn();
        }
      }, 100);

      // Cleanup interval after 5 seconds
      setTimeout(() => clearInterval(checkInterval), 5000);
    }
  }, []);

  const handleCredentialResponse = async (response) => {
    if (!response.credential) {
      console.error("No credential returned from Google");
      return;
    }

    try {
      const res = await fetch("/backend/google_login.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: response.credential })
      });

      const data = await res.json();
      
      if (data.status === "success" && data.user) {
        onLoginSuccess(data.user);
      } else {
        console.error("Google login failed:", data.message);
        alert(data.message || "Google login failed");
      }
    } catch (error) {
      console.error("Error during Google login:", error);
      alert("Failed to authenticate with Google");
    }
  };

  return (
    <div className="w-full">
      <div id="googleSignInBtn" className="w-full"></div>
    </div>
  );
};

export default GoogleLoginButton;
