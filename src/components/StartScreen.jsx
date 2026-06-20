// StartScreen.jsx — shown while MediaPipe loads
export default function StartScreen({ error, onBypass }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(160deg, #0a0a1a 0%, #1a0a2a 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontFamily: '"Segoe UI", system-ui, sans-serif',
      zIndex: 10,
    }}>
      <div style={{ fontSize: 72, marginBottom: 16 }}>🍉</div>
      <h1 style={{ fontSize: 48, fontWeight: 800, margin: 0, letterSpacing: -1 }}>
        Fruit Ninja
      </h1>
      <p style={{ color: '#aaaacc', marginTop: 8, fontSize: 18 }}>
        Web Edition
      </p>

      {error ? (
        <div style={{
          marginTop: 40, padding: '20px 32px',
          background: 'rgba(255,60,60,0.15)',
          border: '1px solid #ff4444',
          borderRadius: 12, maxWidth: 420, textAlign: 'center',
        }}>
          <p style={{ color: '#ff8888', margin: 0, fontSize: 15 }}>
            ⚠️ Camera error: {error}
          </p>
          <p style={{ color: '#aaaacc', margin: '12px 0 0', fontSize: 13, marginBottom: 20 }}>
            Make sure you've allowed camera access in your browser, then refresh the page.
          </p>
          <button
            onClick={onBypass}
            style={{
              padding: '10px 20px',
              background: '#38d438',
              border: 'none',
              borderRadius: 8,
              color: '#0a0a1a',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Play with Touch / Mouse instead
          </button>
        </div>
      ) : (
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, margin: '0 auto 20px',
            border: '3px solid #38d438',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.9s linear infinite',
          }} />
          <p style={{ color: '#aaaacc', fontSize: 16, margin: 0 }}>
            Loading hand tracking model…
          </p>
          <p style={{ color: '#666688', fontSize: 13, marginTop: 8, marginBottom: 20 }}>
            Allow camera access when prompted
          </p>
          <button
            onClick={onBypass}
            style={{
              background: 'transparent',
              border: '1px solid #555577',
              color: '#aaaacc',
              padding: '8px 16px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
              transition: 'background 0.2s',
            }}
            onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
            onMouseOut={(e) => e.target.style.background = 'transparent'}
          >
            Play with Touch / Mouse instead
          </button>
        </div>
      )}

      <div style={{
        position: 'absolute', bottom: 32, left: 0, right: 0,
        textAlign: 'center', color: '#444466', fontSize: 13,
      }}>
        Uses your webcam locally — nothing is sent to any server
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
