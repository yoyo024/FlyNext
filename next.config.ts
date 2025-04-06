export default {
  images: {
    domains: [
      'external-content.duckduckgo.com',
      'static.vecteezy.com',
      'images.unsplash.com',
      'img.freepik.com',
      'cdn.pixabay.com',
      'images.pexels.com',
      "example.com",
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'external-content.duckduckgo.com',
        pathname: '/iu/**',
      },
    ],
  },
};
