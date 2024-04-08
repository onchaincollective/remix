import "./globals.css";
import { headers } from 'next/headers'
import { cookieToInitialState } from 'wagmi'
import { config } from '@/config'
import Web3ModalProvider from '@/context'



export const metadata = {
  title: "the Remix by OCC",
  description: "Create pfps by remixing your existing jpegs and adding flowers you own",
};

export default function RootLayout({ children }) {
  const initialState = cookieToInitialState(config, headers().get('cookie'))
  return (
    <html lang="en">
      <head>
        <title>the Remix by OCC</title>
        <meta name="title" content="the Remix by OCC"/>
        <meta name="description" content="Create pfps by remixing your existing jpegs and adding flowers you own"/>

        <meta property="og:type" content="website"/>
        <meta property="og:url" content="https://remix.occ.xyz/"/>
        <meta property="og:title" content="the Remix by OCC"/>
        <meta property="og:description" content="Create pfps by remixing your existing jpegs and adding flowers you own"/>
        <meta property="og:image" content="https://remix.occ.xyz/remix/social_image.png"/>

        <meta property="twitter:card" content="summary_large_image"/>
        <meta property="twitter:url" content="https://remix.occ.xyz/"/>
        <meta property="twitter:title" content="the Remix by OCC"/>
        <meta property="twitter:description" content="Create pfps by remixing your existing jpegs and adding flowers you own"/>
        <meta property="twitter:image" content="https://remix.occ.xyz/remix/social_image.png"/>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/remix/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
        {/* Global Site Tag (gtag.js) - Google Analytics */}
        {/* <script async src="https://www.googletagmanager.com/gtag/js?id=G-0QRHNTF9FY"></script>
        <script
            dangerouslySetInnerHTML={{
            __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-0QRHNTF9FY', {
            page_path: window.location.pathname,
            });
        `,
            }}
        /> */}
      </head>
      <body>
        <Web3ModalProvider initialState={initialState}>{children}</Web3ModalProvider>
      </body>
    </html>
  );
}
