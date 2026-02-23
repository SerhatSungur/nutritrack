import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * This file is web-only and used to configure the root HTML for every web page during static rendering.
 * The contents of this function only run in Node.js environments and do not have access to the DOM or browser APIs.
 */
export default function Root({ children }: PropsWithChildren) {
    return (
        <html lang="de">
            <head>
                <meta charSet="utf-8" />
                <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
                <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

                {/* 
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native. 
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
                <ScrollViewStyleReset />

                {/* Google Identity Services (GSI) Script for Google Sign-In on Web (localhost & production) */}
                <script src="https://accounts.google.com/gsi/client" async defer></script>
                <script dangerouslySetInnerHTML={{
                    __html: `
                    // Global polyfill for process.env to prevent ReferenceErrors on Web (Vercel & Local)
                    window.process = window.process || {};
                    window.process.env = window.process.env || {};
                    window.process.env.NODE_ENV = window.process.env.NODE_ENV || 'development';

                    window.addEventListener('error', function(event) {
                        const div = document.createElement('div');
                        div.style.cssText = 'position:fixed;top:0;left:0;right:0;background:red;color:white;z-index:9999;padding:20px;font-size:16px;overflow:auto;max-height:100vh;';
                        div.textContent = 'ERROR: ' + event.message + '\\n' + event.filename + ':' + event.lineno + '\\n' + (event.error ? event.error.stack : '');
                        document.body.appendChild(div);
                    });
                    window.addEventListener('unhandledrejection', function(event) {
                        const div = document.createElement('div');
                        div.style.cssText = 'position:fixed;top:50%;left:0;right:0;background:orange;color:white;z-index:9999;padding:20px;font-size:16px;overflow:auto;max-height:50vh;';
                        div.textContent = 'PROMISE REJECTION: ' + (event.reason ? (event.reason.message || event.reason) : 'unknown reason') + '\\n' + (event.reason && event.reason.stack ? event.reason.stack : '');
                        document.body.appendChild(div);
                    });
                `}} />
            </head>
            <body>{children}</body>
        </html>
    );
}
