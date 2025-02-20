/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@reown/appkit', '@reown/appkit-adapter-wagmi', 'preact'],
  webpack: (config) => {
    config.module.rules.push({
      test: /\.m?js$/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false,
      },
    })
    return config
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups'
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self' 'unsafe-eval' 'unsafe-inline' https: http: data: ws: wss: blob:; script-src 'self' 'unsafe-eval' 'unsafe-inline' https: http:; connect-src 'self' 'unsafe-eval' https: http: ws: wss:; style-src 'self' 'unsafe-inline' https: http:; img-src 'self' https: http: data: blob:; font-src 'self' https: http: data:; frame-src 'self' https: http:; worker-src 'self' blob:;"
          }
        ],
      },
    ]
  }
}

module.exports = nextConfig 