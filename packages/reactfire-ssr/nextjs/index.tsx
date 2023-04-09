import React, { createContext, useContext } from "react";
import {
  CollectionReference as CollectionReferenceAdmin,
  DocumentReference as DocumentReferenceAdmin,
  Query as QueryAdmin,
} from "firebase-admin/firestore";
import {
  DocumentData,
  DocumentReference as DocumentReferenceClient,
  Query,
} from "firebase/firestore";
import { useFirestoreCollectionData, useFirestoreDocData } from "reactfire";

type HydrateContext<T extends string[]> = Record<T[number], DocumentData>;

const HydrateContext = createContext<HydrateContext<any>>(undefined as any);

export function initializeReactfireSSR<const TQueryKeys extends string[]>() {
  return {
    dehydrate: dehydrate<TQueryKeys>,
    useHydratedFirestoreDocData: useHydratedFirestoreDocData<TQueryKeys>,
    useHydratedFirestoreCollectionData:
      useHydratedFirestoreCollectionData<TQueryKeys>,
  };
}

function useHydrate<const TQueryKeys extends string[]>() {
  return useContext<HydrateContext<TQueryKeys>>(HydrateContext);
}

export function Hydrate<const TQueryKeys extends string[]>({
  children,
  state,
}: {
  children: React.ReactNode;
  state: HydrateContext<TQueryKeys>;
}) {
  return (
    <HydrateContext.Provider value={state}>{children}</HydrateContext.Provider>
  );
}

async function dehydrateDocument<const TQueryKeys extends string[]>(
  dehydrateItem: DehydrateDocItem<TQueryKeys>
) {
  const [key, value] = Object.entries(dehydrateItem)[0] as [
    TQueryKeys[number],
    DocumentReferenceAdmin
  ];
  const docSnap = await value.get();
  return {
    [key]: docSnap.data(),
  };
}

function useHydratedFirestoreDocData<const T extends string[]>(
  docRef: DocumentReferenceClient,
  queryKey: T[number]
) {
  const hydrate = useHydrate<T>();
  return useFirestoreDocData(
    docRef,
    hydrate && queryKey in hydrate
      ? {
          initialData: hydrate[queryKey],
        }
      : {}
  );
}

async function dehydrateCollection<const TQueryKeys extends string[]>(
  dehydrateItem: DehydrateCollectionItem<TQueryKeys>
) {
  const [key, value] = Object.entries(dehydrateItem)[0] as [
    TQueryKeys[number],
    CollectionReferenceAdmin
  ];
  const collectionSnap = await value.get();
  return {
    [key]: collectionSnap.docs.map((docSnap) => docSnap.data()),
  };
}

function useHydratedFirestoreCollectionData<T extends string[]>(
  collectionRef: Query,
  queryKey: T[number]
) {
  const hydrate = useHydrate<T>();
  return useFirestoreCollectionData(
    collectionRef,
    hydrate && queryKey in hydrate
      ? {
          initialData: hydrate[queryKey],
        }
      : {}
  );
}

type DehydrateDocItem<TQueryKeys extends string[]> = PartialRecord<
  TQueryKeys[number],
  DocumentReferenceAdmin
>;
type DehydrateCollectionItem<TQueryKeys extends string[]> = PartialRecord<
  TQueryKeys[number],
  QueryAdmin
>;

type PartialRecord<K extends keyof any, T> = Partial<Record<K, T>>;

async function dehydrate<const TQueryKeys extends string[]>(
  docs?: DehydrateDocItem<TQueryKeys>,
  collections?: DehydrateCollectionItem<TQueryKeys>
) {
  const docsPromises =
    docs &&
    Object.entries(docs).map(([key, value]) =>
      dehydrateDocument({ [key]: value } as DehydrateDocItem<TQueryKeys>)
    );
  const dehydratedDocs = await Promise.all(docsPromises || []);
  const collectionsPromises =
    collections &&
    Object.entries(collections).map(([key, value]) =>
      dehydrateCollection({
        [key]: value,
      } as DehydrateCollectionItem<TQueryKeys>)
    );
  const dehydratedCollections = await Promise.all(collectionsPromises || []);
  return {
    dehydratedState: {
      ...Object.assign({}, ...(dehydratedDocs || {})),
      ...Object.assign({}, ...(dehydratedCollections || {})),
    },
  };
}
