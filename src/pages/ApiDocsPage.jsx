import { useState } from 'react';
import { Link } from 'react-router-dom';

const TIERS = [
  {
    name: 'Starter',
    price: '$9',
    period: '/mo',
    requests: '1,000 req/mo',
    features: ['Face detection', 'Landmark extraction', 'Basic overlay', 'REST API'],
    highlight: false,
    badge: null,
  },
  {
    name: 'Pro',
    price: '$49',
    period: '/mo',
    requests: '20,000 req/mo',
    features: ['Everything in Starter', 'Real-time WebSocket', 'Background blur', 'Custom watermark', 'Priority support'],
    highlight: true,
    badge: 'Most Popular',
  },
  {
    name: 'Enterprise',
    price: '$199',
    period: '/mo',
    requests: 'Unlimited',
    features: ['Everything in Pro', 'SLA 99.9%', 'On-premise option', 'Custom model fine-tuning', 'Dedicated support'],
    highlight: false,
    badge: null,
  },
];

const ENDPOINTS = [
  {
    method: 'POST',
    path: '/v1/detect',
    desc: 'Detect face landmarks from a base64 image',
    body: `{
  "image": "<base64_image_data>",
  "format": "jpeg"  // jpeg | png | webp
}`,
    response: `{
  "success": true,
  "faces": [{
    "landmarks": [...],  // 468 points [{x, y, z}]
    "boundingBox": { "x": 120, "y": 80, "w": 200, "h": 240 },
    "confidence": 0.98
  }],
  "processingMs": 42
}`,
  },
  {
    method: 'POST',
    path: '/v1/swap',
    desc: 'Overlay a face image onto detected face landmarks',
    body: `{
  "sourceImage": "<base64_source>",   // image to put face onto
  "overlayImage": "<base64_overlay>", // face to use
  "options": {
    "blendMode": "seamless",  // seamless | hard | soft
    "opacity": 0.92,
    "matchLighting": true
  }
}`,
    response: `{
  "success": true,
  "resultImage": "<base64_result>",
  "processingMs": 87
}`,
  },
  {
    method: 'POST',
    path: '/v1/stream/token',
    desc: 'Get a WebSocket token for real-time streaming',
    body: `{
  "sessionId": "unique-session-id",
  "options": { "fps": 30, "blurBackground": false }
}`,
    response: `{
  "success": true,
  "wsToken": "wst_xxxx",
  "wsUrl": "wss://api.facecall.io/v1/stream",
  "expiresIn": 3600
}`,
  },
];

const CODE_EXAMPLES = {
  js: `// JavaScript / Node.js
const response = await fetch('https://api.facecall.io/v1/detect', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'fc_live_your_api_key_here'
  },
  body: JSON.stringify({
    image: imageBase64,
    format: 'jpeg'
  })
});

const { faces } = await response.json();
console.log(\`Detected \${faces.length} face(s)\`);`,

  python: `# Python
import requests, base64

with open("photo.jpg", "rb") as f:
    image_b64 = base64.b64encode(f.read()).decode()

resp = requests.post(
    "https://api.facecall.io/v1/detect",
    headers={"X-API-Key": "fc_live_your_api_key_here"},
    json={"image": image_b64, "format": "jpeg"}
)

data = resp.json()
print(f"Found {len(data['faces'])} face(s)")
for face in data['faces']:
    print(f"  Confidence: {face['confidence']:.2f}")`,

  curl: `# cURL
curl -X POST https://api.facecall.io/v1/detect \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: fc_live_your_api_key_here" \\
  -d '{
    "image": "'$(base64 -w0 photo.jpg)'",
    "format": "jpeg"
  }'`,
};

export default function ApiDocsPage() {
  const [activeTab, setActiveTab] = useState('js');
  const [openEndpoint, setOpenEndpoint] = useState(0);
  const [copied, setCopied] = useState('');

  const copy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="min-h-screen relative z-10">
      {/* Nav */}
      <nav className="glass border-b border-white/6 px-6 py-3 sticky top-0 z-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-display font-bold text-white text-sm">FaceCall <span className="text-brand-400">API</span></span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <a href="#endpoints" className="text-white/50 hover:text-white transition">Endpoints</a>
          <a href="#pricing" className="text-white/50 hover:text-white transition">Pricing</a>
          <a href="#quickstart" className="text-white/50 hover:text-white transition">Quickstart</a>
          <button className="btn-neon px-4 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold">
            Get API Key
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-16">

        {/* Hero */}
        <div className="text-center mb-20 animate-slide-up">
          <span className="inline-block px-3 py-1 rounded-full text-xs bg-brand-600/20 border border-brand-500/30 text-brand-300 mb-4 font-mono">
            v1.0 · REST + WebSocket
          </span>
          <h1 className="font-display text-5xl font-bold text-white mb-4 leading-tight">
            Face Swap API<br/>
            <span className="text-brand-400">Built for Developers</span>
          </h1>
          <p className="text-white/50 max-w-lg mx-auto leading-relaxed">
            Real-time face detection, landmark extraction, and face overlay in milliseconds.
            Power your apps with browser-safe, privacy-first face AI.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8">
            <button className="btn-neon px-6 py-3 rounded-xl bg-brand-600 text-white font-semibold text-sm shadow-lg shadow-brand-600/30">
              Start Free Trial →
            </button>
            <a href="#quickstart" className="px-6 py-3 rounded-xl border border-white/10 text-white/70 text-sm hover:border-white/20 hover:text-white transition">
              View Docs
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-20">
          {[
            { val: '<50ms', label: 'Avg. latency' },
            { val: '99.9%', label: 'Uptime SLA' },
            { val: '468pt', label: 'Landmark precision' },
          ].map((s) => (
            <div key={s.val} className="glass rounded-2xl p-6 text-center">
              <p className="font-display text-3xl font-bold text-brand-400">{s.val}</p>
              <p className="text-white/40 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Quickstart */}
        <section id="quickstart" className="mb-20">
          <h2 className="font-display text-2xl font-bold text-white mb-2">Quickstart</h2>
          <p className="text-white/40 text-sm mb-6">Get your first face detected in under 2 minutes.</p>

          <div className="glass rounded-2xl overflow-hidden">
            {/* Language tabs */}
            <div className="flex border-b border-white/6 px-4 pt-3 gap-1">
              {Object.keys(CODE_EXAMPLES).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveTab(lang)}
                  className={`px-4 py-2 rounded-t-lg text-xs font-medium transition ${
                    activeTab === lang ? 'bg-surface-600 text-white' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  {lang === 'js' ? 'JavaScript' : lang === 'python' ? 'Python' : 'cURL'}
                </button>
              ))}
              <div className="flex-1" />
              <button
                onClick={() => copy(CODE_EXAMPLES[activeTab], 'code')}
                className="text-xs text-white/30 hover:text-white/60 transition mb-2 flex items-center gap-1"
              >
                {copied === 'code' ? '✓ Copied' : '⎘ Copy'}
              </button>
            </div>
            <pre className="p-6 text-xs font-mono text-green-300/90 overflow-x-auto leading-relaxed">
              <code>{CODE_EXAMPLES[activeTab]}</code>
            </pre>
          </div>
        </section>

        {/* Endpoints */}
        <section id="endpoints" className="mb-20">
          <h2 className="font-display text-2xl font-bold text-white mb-2">API Endpoints</h2>
          <p className="text-white/40 text-sm mb-6">Base URL: <code className="text-brand-300 font-mono">https://api.facecall.io</code></p>

          <div className="space-y-3">
            {ENDPOINTS.map((ep, i) => (
              <div key={i} className="glass rounded-2xl overflow-hidden">
                <button
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/3 transition"
                  onClick={() => setOpenEndpoint(openEndpoint === i ? -1 : i)}
                >
                  <span className={`px-2 py-0.5 rounded font-mono text-xs font-bold ${
                    ep.method === 'POST' ? 'bg-brand-600/30 text-brand-300' : 'bg-green-600/30 text-green-300'
                  }`}>{ep.method}</span>
                  <span className="font-mono text-sm text-white/90">{ep.path}</span>
                  <span className="text-white/40 text-xs ml-2">{ep.desc}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={`ml-auto text-white/30 transition-transform ${openEndpoint === i ? 'rotate-180' : ''}`}>
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {openEndpoint === i && (
                  <div className="px-5 pb-5 border-t border-white/6 grid md:grid-cols-2 gap-4 pt-4">
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Request Body</p>
                      <pre className="text-xs font-mono text-blue-300/80 bg-surface-700 rounded-xl p-4 overflow-x-auto leading-relaxed">
                        {ep.body}
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Response</p>
                      <pre className="text-xs font-mono text-green-300/80 bg-surface-700 rounded-xl p-4 overflow-x-auto leading-relaxed">
                        {ep.response}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Authentication */}
        <section className="mb-20">
          <h2 className="font-display text-2xl font-bold text-white mb-4">Authentication</h2>
          <div className="glass rounded-2xl p-6">
            <p className="text-white/60 text-sm mb-4">
              All API requests require a valid API key passed in the <code className="text-brand-300 font-mono">X-API-Key</code> header.
            </p>
            <div className="bg-surface-700 rounded-xl p-4 font-mono text-sm">
              <span className="text-white/40">X-API-Key: </span>
              <span className="text-yellow-300">fc_live_xxxxxxxxxxxxxxxxxxxxxxxx</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-surface-700 rounded-xl p-4">
                <p className="text-xs font-mono text-green-400 mb-1">fc_live_...</p>
                <p className="text-xs text-white/40">Production key — charges apply</p>
              </div>
              <div className="bg-surface-700 rounded-xl p-4">
                <p className="text-xs font-mono text-blue-400 mb-1">fc_test_...</p>
                <p className="text-xs text-white/40">Sandbox key — free, rate limited</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mb-20">
          <h2 className="font-display text-2xl font-bold text-white mb-2 text-center">Simple Pricing</h2>
          <p className="text-white/40 text-sm mb-10 text-center">Start free, scale as you grow.</p>

          <div className="grid md:grid-cols-3 gap-4">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-2xl p-6 relative ${
                  tier.highlight
                    ? 'bg-brand-600/10 border-2 border-brand-500/50 shadow-xl shadow-brand-600/10'
                    : 'glass'
                }`}
              >
                {tier.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs bg-brand-600 text-white font-semibold">
                    {tier.badge}
                  </span>
                )}
                <p className="font-display text-lg font-bold text-white mb-1">{tier.name}</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="font-display text-3xl font-bold text-white">{tier.price}</span>
                  <span className="text-white/40 text-sm">{tier.period}</span>
                </div>
                <p className="text-brand-300 text-xs font-mono mb-5">{tier.requests}</p>
                <ul className="space-y-2 mb-6">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                      <span className="text-brand-400">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-2.5 rounded-xl text-sm font-semibold transition ${
                  tier.highlight
                    ? 'btn-neon bg-brand-600 text-white shadow-md shadow-brand-600/30'
                    : 'border border-white/15 text-white/70 hover:border-white/30 hover:text-white'
                }`}>
                  {tier.name === 'Enterprise' ? 'Contact Us' : 'Get Started'}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Rate limits */}
        <section className="mb-20">
          <h2 className="font-display text-2xl font-bold text-white mb-4">Rate Limits & Headers</h2>
          <div className="glass rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/6">
                  <th className="text-left px-5 py-3 text-xs text-white/40 font-medium uppercase tracking-wider">Header</th>
                  <th className="text-left px-5 py-3 text-xs text-white/40 font-medium uppercase tracking-wider">Description</th>
                  <th className="text-left px-5 py-3 text-xs text-white/40 font-medium uppercase tracking-wider">Example</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {[
                  ['X-RateLimit-Limit', 'Max requests per window', '1000'],
                  ['X-RateLimit-Remaining', 'Requests left in window', '983'],
                  ['X-RateLimit-Reset', 'Unix timestamp of reset', '1718000000'],
                  ['X-Processing-Ms', 'Server processing time', '43'],
                ].map(([h, d, e]) => (
                  <tr key={h}>
                    <td className="px-5 py-3 font-mono text-xs text-brand-300">{h}</td>
                    <td className="px-5 py-3 text-white/60 text-xs">{d}</td>
                    <td className="px-5 py-3 font-mono text-xs text-white/40">{e}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* CTA */}
        <div className="glass rounded-2xl p-10 text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-3">Ready to build?</h2>
          <p className="text-white/40 mb-8 max-w-sm mx-auto">Get your free API key and start swapping faces in minutes.</p>
          <button className="btn-neon px-8 py-4 rounded-xl bg-brand-600 text-white font-bold text-sm shadow-lg shadow-brand-600/30">
            Get Free API Key →
          </button>
        </div>

      </div>
    </div>
  );
}
