import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(storedUser);

    fetch(`/api/users/profile?userId=${parsedUser.id}`)
      .then((response) => response.json())
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading profile:", error);
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  if (!profile) {
    return <div className="container">Profile not found.</div>;
  }

  const wallets = Array.isArray(profile.wallets) ? profile.wallets : [];
  const walletHistory = Array.isArray(profile.walletHistory)
    ? profile.walletHistory
    : [];

  return (
    <div className="container profile-page">
      <h1>👤 Profile</h1>
      <p className="page-intro">
        Review your account details, linked wallets, and wallet connection
        history.
      </p>

      <div className="profile-summary-grid">
        <div className="card profile-summary-card">
          <h2>Account</h2>
          <p>
            <strong>Email:</strong> {profile.email}
          </p>
          <p>
            <strong>Role:</strong> {profile.role.toUpperCase()}
          </p>
          <p>
            <strong>Linked wallets:</strong> {wallets.length}
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="app-button"
          >
            Open Dashboard
          </button>
        </div>

        <div className="card profile-summary-card">
          <h2>Primary Wallet</h2>
          {profile.walletAddress ? (
            <>
              <p>
                <strong>Last connected:</strong>{" "}
                {profile.walletAddress.slice(0, 6)}...
                {profile.walletAddress.slice(-4)}
              </p>
              <p className="muted-text">
                This is the most recently used wallet on the account.
              </p>
            </>
          ) : (
            <p className="muted-text">No wallet connected yet.</p>
          )}
        </div>
      </div>

      <div className="section-block">
        <h2>Linked Wallets</h2>
        {wallets.length === 0 ? (
          <p className="muted-text">No wallets have been linked yet.</p>
        ) : (
          <div className="card-container wallet-grid">
            {wallets.map((wallet) => (
              <div className="card wallet-card" key={wallet.address}>
                <h3>
                  {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
                </h3>
                <p>
                  <strong>Linked:</strong>{" "}
                  {new Date(wallet.linkedAt).toLocaleString()}
                </p>
                <p>
                  <strong>Last connected:</strong>{" "}
                  {new Date(wallet.lastConnectedAt).toLocaleString()}
                </p>
                <p>
                  <strong>Connections:</strong> {wallet.connectionCount || 0}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section-block">
        <h2>Wallet Connection History</h2>
        {walletHistory.length === 0 ? (
          <p className="muted-text">No wallet history yet.</p>
        ) : (
          <div className="table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Wallet</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {walletHistory
                  .slice()
                  .reverse()
                  .map((entry, index) => (
                    <tr key={`${entry.timestamp}-${index}`}>
                      <td>{new Date(entry.timestamp).toLocaleString()}</td>
                      <td>
                        {entry.address.slice(0, 8)}...{entry.address.slice(-6)}
                      </td>
                      <td>{entry.action}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
