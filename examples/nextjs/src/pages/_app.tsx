import { getFirestore } from "firebase/firestore";
import type { AppProps } from "next/app";
import { Suspense } from "react";
import {
  FirebaseAppProvider,
  FirestoreProvider,
  useFirebaseApp,
} from "reactfire";
import { Hydrate } from "reactfire-ssr/nextjs";

const firebaseConfig = {
  apiKey: "AIzaSyAc8gvOiWAiYhqx0-TxAGWjIDVISJn822E",
  authDomain: "reactfire-nextjs.firebaseapp.com",
  projectId: "reactfire-nextjs",
  storageBucket: "reactfire-nextjs.appspot.com",
  messagingSenderId: "1095484122934",
  appId: "1:1095484122934:web:3fee8b134fc223e98eb597",
};

export default function App({ Component, pageProps }: AppProps) {
  return (
    <FirebaseAppProvider firebaseConfig={firebaseConfig}>
      <ReactfireProviders>
        <Suspense fallback={<p>Root suspense boundary...</p>}>
          <Hydrate state={pageProps.dehydratedState}>
            <Component {...pageProps} />
          </Hydrate>
        </Suspense>
      </ReactfireProviders>
    </FirebaseAppProvider>
  );
}

function ReactfireProviders({ children }: { children: React.ReactNode }) {
  const sdk = getFirestore(useFirebaseApp());
  return <FirestoreProvider sdk={sdk}>{children}</FirestoreProvider>;
}
