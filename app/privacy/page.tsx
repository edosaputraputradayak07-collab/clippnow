export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '48px 20px', fontFamily: 'system-ui, sans-serif', lineHeight: 1.7 }}>
      <h1>ClippNow Privacy Policy</h1>
      <p>Last updated: September 2, 2026</p>
      <p>ClippNow processes the information needed to provide video clipping, authentication, billing, and support.</p>
      <h2>Information we process</h2>
      <ul>
        <li>Account information such as email address and authentication identifiers.</li>
        <li>Videos and project metadata that you upload to create clips.</li>
        <li>Render job status and technical logs needed to operate the service.</li>
        <li>Payment and transaction identifiers when you purchase credits or plans. Payment card details are handled by the payment provider and are not stored by ClippNow.</li>
      </ul>
      <h2>How we use information</h2>
      <p>We use information to authenticate users, store and process videos, render requested clips, maintain credits and transactions, prevent abuse, troubleshoot failures, and provide customer support.</p>
      <h2>Video and storage</h2>
      <p>Uploaded videos and rendered outputs are stored in private storage. Access is limited to the owning account and authorized server workflows. Completed outputs are shared through short-lived signed URLs.</p>
      <h2>Account deletion</h2>
      <p>You can permanently delete your ClippNow account from the mobile app or request deletion through support. Account deletion removes the authentication account and user-owned videos and projects. Payment records may be retained without the account identifier when needed for transaction, fraud-prevention, tax, or legal obligations.</p>
      <h2>Security</h2>
      <p>ClippNow uses authenticated sessions, private storage, server-side secrets, access controls, and short-lived signed output URLs. Server secrets are never embedded in the mobile application.</p>
      <h2>Contact</h2>
      <p>For privacy requests, contact the ClippNow support address published with your account or store listing.</p>
    </main>
  );
}
