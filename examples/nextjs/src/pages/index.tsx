import { firestoreAdmin } from "@/firebase-admin";
import { burritoConverter, burritoConverterAdmin } from "@/firestore/converter";
import { collection, doc, query, where } from "firebase/firestore";
import { useFirestore } from "reactfire";
import { initializeReactfireSSR } from "reactfire-ssr/nextjs";

const reactfireSSR =
  initializeReactfireSSR<
    [
      "burritoDocument",
      "burritoDocument2",
      "tryreactfireCollection",
      "tryreactfireCollectionYummy"
    ]
  >();

export async function getServerSideProps() {
  const burritoDocRef = firestoreAdmin
    .doc("tryreactfire/burrito")
    .withConverter(burritoConverterAdmin); // This converter is optional, but it provides better type safety
  const tryreactfireCollectionRef = firestoreAdmin
    .collection("tryreactfire")
    .withConverter(burritoConverterAdmin);

  const tryreactfireCollectionRefYummy = tryreactfireCollectionRef.where(
    "yummy",
    "==",
    true
  );
  const dehydrateData = await reactfireSSR.dehydrate(
    {
      burritoDocument: burritoDocRef,
      burritoDocument2: burritoDocRef,
    },
    {
      tryreactfireCollection: tryreactfireCollectionRef,
      tryreactfireCollectionYummy: tryreactfireCollectionRefYummy,
    }
  );
  return {
    props: dehydrateData,
    // props: { ...dehydrateData, myOtherProp: "goesHere" } // Or pass other props alongside the dehydrated data
  };
}

export default function Home() {
  const burritoDocRef = doc(
    useFirestore(),
    "tryreactfire",
    "burrito"
  ).withConverter(burritoConverter);
  const collectionRef = collection(
    useFirestore(),
    "tryreactfire"
  ).withConverter(burritoConverter); // This converter is optional, but it provides better type safety

  const burritoDoc = reactfireSSR.useHydratedFirestoreDocData(
    burritoDocRef,
    "burritoDocument"
  );
  const tryreactfireCollection =
    reactfireSSR.useHydratedFirestoreCollectionData(
      collectionRef,
      "tryreactfireCollection"
    );

  const tryreactfireCollectionYummy =
    reactfireSSR.useHydratedFirestoreCollectionData(
      query(collectionRef, where("yummy", "==", true)),
      "tryreactfireCollectionYummy"
    );

  if (
    burritoDoc.status === "loading" ||
    tryreactfireCollectionYummy.status === "loading"
  ) {
    /**
     * We are prefetching the required data on the server, so this scenario
     * should never happen on the client.
     */
    throw new Error("Should not happen!");
  }

  return (
    <p>
      There are {tryreactfireCollection.data.length} documents in the
      collection!
      <br />
      There are {tryreactfireCollectionYummy.data.length} yummy documents in the
      collection! <br />
      The burrito is {burritoDoc.data.yummy ? "good" : "bad"}!
    </p>
  );
}
