import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// This page handles the Spotify OAuth callback
const SpotifyCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");

    if (error) {
      // Handle error (optional: show a message)
      navigate("/login?error=" + encodeURIComponent(error));
      return;
    }

    if (code) {
      // TODO: Exchange code for access token (call backend or use PKCE)
      // Example: fetch('/api/spotify/callback?code=' + code)
      // .then(...)
      // For now, just redirect to home
      navigate("/");
    } else {
      // No code or error, redirect to login
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div style={{ textAlign: "center", marginTop: "2rem" }}>
      <h2>Connecting to Spotify...</h2>
    </div>
  );
};

export default SpotifyCallback;
