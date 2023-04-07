import React from "react";
import {
  CollectionReference,
  DocumentReference,
} from "firebase-admin/firestore";
import {
  DocumentData,
  DocumentReference as DocumentReferenceClient,
  CollectionReference as CollectionReferenceClient,
} from "firebase/firestore";
import { createContext, useContext } from "react";
import { useFirestoreCollectionData, useFirestoreDocData } from "reactfire";

type HydrateContext = {
  [key: string]: DocumentData;
};

const HydrateContext = createContext<HydrateContext | undefined>(undefined);

export function useHydrate() {
  return useContext(HydrateContext);
}

export function Hydrate({
  children,
  state,
}: {
  children: React.ReactNode;
  state: HydrateContext;
}) {
  return (
    <HydrateContext.Provider value={state}>{children}</HydrateContext.Provider>
  );
}

export async function dehydrateDocument(docRef: DocumentReference) {
  const docSnap = await docRef.get();
  return {
    [docRef.path]: docSnap.data(),
  };
}

export function useHydratedFirestoreDocData<T = unknown>(
  docRef: DocumentReferenceClient<T>,
) {
  const hydrate = useHydrate();
  const data = useFirestoreDocData(
    docRef,
    hydrate && Object.keys(hydrate).includes(docRef.path)
      ? {
          initialData: hydrate[docRef.path],
        }
      : {},
  );
  return data;
}

export async function dehydrateCollection(collectionRef: CollectionReference) {
  const collectionSnap = await collectionRef.get();
  return {
    [collectionRef.path]: collectionSnap.docs.map((docSnap) => docSnap.data()),
  };
}

export function useHydratedFirestoreCollectionData<T = unknown>(
  collectionRef: CollectionReferenceClient<T>,
) {
  const hydrate = useHydrate();
  const data = useFirestoreCollectionData(
    collectionRef,
    hydrate && Object.keys(hydrate).includes(collectionRef.path)
      ? {
          initialData: hydrate[collectionRef.path],
        }
      : {},
  );
  return data;
}

export async function dehydrate(
  docs?: DocumentReference[],
  collections?: CollectionReference[],
): Promise<{
  dehydratedState: { [key: string]: DocumentData | undefined | DocumentData[] };
}> {
  const docsPromises = docs?.map(
    async (docRef) => await dehydrateDocument(docRef),
  );
  const dehydratedDocs = docsPromises && (await Promise.all(docsPromises));
  const collectionsPromises = collections?.map(
    async (collectionRef) => await dehydrateCollection(collectionRef),
  );
  const dehydratedCollections =
    collectionsPromises && (await Promise.all(collectionsPromises));
  return {
    dehydratedState: {
      ...Object.assign({}, ...(dehydratedDocs || [])),
      ...Object.assign({}, ...(dehydratedCollections || [])),
    },
  };
}
