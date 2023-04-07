import { firestoreAdmin } from "@/firebase-admin";
import { burritoConverter, burritoConverterAdmin } from "@/firestore/converter";
import {
  CollectionReference,
  collection,
  doc,
  query,
} from "firebase/firestore";
import { useFirestore } from "reactfire";
import {
  dehydrate,
  useHydratedFirestoreCollectionData,
  useHydratedFirestoreDocData,
} from "reactfire-ssr/nextjs";

export async function getServerSideProps() {
  const burritoDocRef = firestoreAdmin
    .doc("tryreactfire/burrito")
    .withConverter(burritoConverterAdmin); // This converter is optional, but it provides better type safety
  const tryreactfireCollectionRef = firestoreAdmin.collection("tryreactfire");
  const dehydrateData = await dehydrate(
    [burritoDocRef],
    [tryreactfireCollectionRef]
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

  const burritoDoc = useHydratedFirestoreDocData(burritoDocRef);
  const tryreactfireCollection =
    useHydratedFirestoreCollectionData(collectionRef);

  if (
    burritoDoc.status === "loading" ||
    tryreactfireCollection.status === "loading"
  ) {
    /**
     * We are prefetching the required data on the server, so this scenario
     * should never happen on the client.
     */
    throw new Error("Should not happen!");
  }

  return (
    <p>
      There are {tryreactfireCollection.data.length} document(s) in the
      collection! <br />
      The burrito is {burritoDoc.data.yummy ? "good" : "bad"}!
    </p>
  );
}
