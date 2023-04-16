import React, { createContext, useContext } from "react";
import {
  CollectionReference as CollectionReferenceAdmin,
  DocumentReference as DocumentReferenceAdmin,
  Query as QueryAdmin,
} from "firebase-admin/firestore";
import {
  DocumentData,
  DocumentReference as DocumentReferenceClient,
  Query as QueryClient,
} from "firebase/firestore";
import { useFirestoreCollectionData, useFirestoreDocData } from "reactfire";

type HydrateContext<T extends string[]> = Record<T[number], string>;

const HydrateContext = createContext<HydrateContext<any>>(undefined as any);

export function initializeReactfireSSR<const TQueryKeys extends string[]>() {
  return {
    dehydrate: dehydrate<TQueryKeys>,
    useHydratedFirestoreDocData: function <TDocType extends DocumentData>(
      docRef: DocumentReferenceClient<TDocType>,
      queryKey: TQueryKeys[number],
    ) {
      return useHydratedFirestoreDocData<TQueryKeys, TDocType>(
        docRef,
        queryKey,
      );
    },
    useHydratedFirestoreCollectionData: function <
      TDocType extends DocumentData,
    >(collectionRef: QueryClient<TDocType>, queryKey: TQueryKeys[number]) {
      return useHydratedFirestoreCollectionData<TQueryKeys, TDocType>(
        collectionRef,
        queryKey,
      );
    },
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
  dehydrateItem: DehydrateDocItem<TQueryKeys>,
) {
  const [key, value] = Object.entries(dehydrateItem)[0] as [
    TQueryKeys[number],
    DocumentReferenceAdmin,
  ];
  const docSnap = await value.get();
  try {
    return {
      [key]: JSON.stringify(docSnap.data()),
    };
  } catch (error) {
    throw new Error("Your document data must be JSON serializable");
  }
}

function useHydratedFirestoreDocData<
  const T extends string[],
  TDocType extends DocumentData = DocumentData,
>(docRef: DocumentReferenceClient<TDocType>, queryKey: T[number]) {
  const hydrate = useHydrate<T>();
  return useFirestoreDocData<TDocType>(
    docRef,
    hydrate && queryKey in hydrate
      ? {
          initialData: JSON.parse(hydrate[queryKey]),
        }
      : {},
  );
}

async function dehydrateCollection<const TQueryKeys extends string[]>(
  dehydrateItem: DehydrateCollectionItem<TQueryKeys>,
) {
  const [key, value] = Object.entries(dehydrateItem)[0] as [
    TQueryKeys[number],
    QueryAdmin,
  ];
  const collectionSnap = await value.get();
  try {
    return {
      [key]: collectionSnap.docs.map((docSnap) =>
        JSON.stringify(docSnap.data()),
      ),
    };
  } catch (error) {
    throw new Error("Your document data must be JSON serializable");
  }
}

function useHydratedFirestoreCollectionData<
  T extends string[],
  TDocType extends DocumentData,
>(collectionRef: QueryClient<TDocType>, queryKey: T[number]) {
  const hydrate = useHydrate<T>();
  return useFirestoreCollectionData(
    collectionRef,
    hydrate && queryKey in hydrate
      ? {
          initialData: JSON.parse(hydrate[queryKey]),
        }
      : {},
  );
}

type DehydrateDocItem<TQueryKeys extends string[]> = PartialRecord<
  TQueryKeys[number],
  DocumentReferenceAdmin
>;
type DehydrateCollectionItem<TQueryKeys extends string[]> = PartialRecord<
  TQueryKeys[number],
  CollectionReferenceAdmin | QueryAdmin
>;

type PartialRecord<K extends keyof any, T> = Partial<Record<K, T>>;

async function dehydrate<const TQueryKeys extends string[]>(
  docs?: DehydrateDocItem<TQueryKeys>,
  collections?: DehydrateCollectionItem<TQueryKeys>,
) {
  const docsPromises =
    docs &&
    Object.entries(docs).map(([key, value]) =>
      dehydrateDocument({ [key]: value } as DehydrateDocItem<TQueryKeys>),
    );
  const dehydratedDocs = await Promise.all(docsPromises || []);
  const collectionsPromises =
    collections &&
    Object.entries(collections).map(([key, value]) =>
      dehydrateCollection({
        [key]: value,
      } as DehydrateCollectionItem<TQueryKeys>),
    );
  const dehydratedCollections = await Promise.all(collectionsPromises || []);
  return {
    dehydratedState: {
      ...Object.assign({}, ...(dehydratedDocs || {})),
      ...Object.assign({}, ...(dehydratedCollections || {})),
    },
  };
}
