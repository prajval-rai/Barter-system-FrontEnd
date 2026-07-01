import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/swaps',
        '/messages',
        '/bookmarks',
        '/profile',
        '/notifications',
        '/add',
      ],
    },
    sitemap: 'https://www.lenden.co.in/sitemap.xml',
  }
}
