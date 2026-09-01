export default function AccountDeletionPage() {
  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '48px 20px', fontFamily: 'system-ui, sans-serif', lineHeight: 1.7 }}>
      <h1>Delete your ClippNow account</h1>
      <p>You can delete your account directly in the ClippNow mobile app.</p>
      <ol>
        <li>Sign in to ClippNow.</li>
        <li>Scroll to the <strong>Akun</strong> section.</li>
        <li>Choose <strong>Hapus akun permanen</strong>.</li>
        <li>Confirm the permanent deletion.</li>
      </ol>
      <p>Deletion removes the authentication account, user-owned projects, render jobs, and stored videos. Payment records may be retained without the account identifier when required for transaction, fraud-prevention, tax, or legal obligations.</p>
      <p>If you cannot sign in, contact ClippNow support using the contact information published in the app store listing.</p>
    </main>
  );
}
