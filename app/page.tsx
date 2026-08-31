export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: "Arial" }}>
      <h1>🎬 ClipNow</h1>
      <p>AI Video Clip Studio untuk TikTok.</p>

      <input
        type="text"
        placeholder="Tempel link YouTube di sini"
        style={{ width: "100%", padding: 12, marginTop: 20 }}
      />

      <button style={{ marginTop: 16, padding: "12px 24px" }}>
        Analyze Video
      </button>
    </main>
  );
}
