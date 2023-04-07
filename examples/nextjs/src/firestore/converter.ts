import { z } from "zod";
import {
  type DocumentData,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import type {
  DocumentData as AdminDocumentData,
  FirestoreDataConverter as AdminFirestoreDataConverter,
  QueryDocumentSnapshot as AdminQueryDocumentSnapshot,
} from "firebase-admin/firestore";

const BurritoDocSchema = z.object({
  yummy: z.boolean(),
});

export type Order = z.infer<typeof BurritoDocSchema>;

export const burritoConverter: FirestoreDataConverter<Order> = {
  toFirestore: (order: Order) => order,
  fromFirestore: (snapshot: QueryDocumentSnapshot<DocumentData>) => {
    return BurritoDocSchema.parse(snapshot.data());
  },
};

export const burritoConverterAdmin: AdminFirestoreDataConverter<Order> = {
  toFirestore: (order: Order) => order,
  fromFirestore: (snapshot: AdminQueryDocumentSnapshot<AdminDocumentData>) => {
    return BurritoDocSchema.parse(snapshot.data());
  },
};
