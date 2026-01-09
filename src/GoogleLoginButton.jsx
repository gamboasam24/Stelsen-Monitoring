import { useEffect } from "react";

const GoogleLoginButton = ({ onLoginSuccess }) => {

  useEffect(() => {
    if (!window.google) return;

    window.google.accounts.id.initialize({
      client_id: "1073043458638-n1spiopflsa2b8k0r2t9s0hmt0lmif6f.apps.googleusercontent.com",
      callback: handleCredentialResponse,
    });

    window.google.accounts.id.renderButton(
      document.getElementById("googleSignInBtn"),
      { theme: "outline", size: "large" }
    );
  }, []);

  const handleCredentialResponse = (response) => {
    // 🚨 THIS MUST EXIST
    if (!response.credential) {
      console.error("No credential returned from Google");
      return;
    }

    // SEND ID TOKEN TO BACKEND
fetch("/backend/google_login.php", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ id_token: response.credential })
})
.then(res => res.text()) // 👈 IMPORTANT
.then(text => {
  console.log("RAW RESPONSE:", text);
})
       ;
  };

  return <div id="googleSignInBtn"></div>;s
};

export default GoogleLoginButton;
