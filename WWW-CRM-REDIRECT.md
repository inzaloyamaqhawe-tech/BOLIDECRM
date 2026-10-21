# Redirect www CRM requests at Railway

`www.bolide.co.za` currently reaches a Next.js app on Railway. The Xneelo CRM directory's `.htaccess` cannot intercept those requests. Keep the www website on Railway; add the following rule to that app's existing `next.config.js` / `next.config.mjs` redirects instead. Merge it with existing configuration and redirects rather than overwriting them.

```js
async redirects() {
  return [
    {
      source: '/crm/:path*',
      has: [{ type: 'host', value: 'www.bolide.co.za' }],
      destination: 'https://bolide.co.za/crm/:path*',
      permanent: true,
    },
    // Keep the application's existing redirects here.
  ];
}
```

Deploy through the existing Railway project. Verify `/crm`, `/crm/login` and `/crm/deals?open=example` redirect to the equivalent apex-domain URL and preserve the query string. Routes such as `/` and `/crm-other` must remain unchanged.

The CRM's `.htaccess` also has a canonical-host redirect as a fallback if www traffic reaches Xneelo in future. Uploading that file alone does not fix the current Railway 404.
