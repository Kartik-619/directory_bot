export default function Test() {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <h1>Test Page - If you see this, Next.js is working</h1>
        <button 
          onClick={() => localStorage.setItem('appInfo', JSON.stringify({
            url: 'https://test.com',
            name: 'Test App',
            type: 'webapp',
            description: 'Test description',
            targetAudience: 'Developers',
            mainFeatures: ['Feature 1', 'Feature 2']
          }))}
          style={{ padding: '10px 20px', margin: '10px' }}
        >
          Set Test Data
        </button>
        <button 
          onClick={() => window.location.href = '/dashboard'}
          style={{ padding: '10px 20px', margin: '10px' }}
        >
          Go to Dashboard
        </button>
      </div>
    );
  }