import React from "react";

export default function Dashboard({ user, setUser, token, showToast }) {
  // This is a legacy component, please use Profile.jsx instead
  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>Dashboard</h1>
      <p>This component has been replaced by the Profile component.</p>
      <p>Please navigate to the Profile section instead.</p>
    </div>
  );
}