import { addDoc, collection, deleteDoc, doc, Firestore, getDoc, updateDoc } from "firebase/firestore";
import { QueryConstraintCollectionManager } from "./QueryConstraintCollectionManager.js";

export class CrudCollectionManager extends QueryConstraintCollectionManager {
  #collectionName;
  #collectionRef;
  #database;

  /**
   *
   * @param {Firestore} database
   * @param {string} collectionName
   */
  constructor(database, collectionName) {
    super(database, collectionName);
    this.#database = database;

    this.#collectionName = collectionName;
    //init config
    this.#collectionRef = collection(this.#database, this.#collectionName);
  }

  /**
   *
   * @param {Object} document
   * @returns {Promise<boolean>}
   */
  async createDocument(document) {
    await addDoc(this.#collectionRef, document);
    return true;
  }

  /**
   *
   * @param {string} documentId
   * @returns {Promise<Object>}
   */
  async readDocument(documentId) {
    if (documentId === null || documentId === undefined || typeof documentId !== "string") {
      throw new Error("Document id missing or is of incorrect type. Document type must be of type string");
    }

    // Get a reference to the document in the database
    const reference = doc(this.#database, this.#collectionName, documentId);

    // Fetch the document snapshot
    const snapshot = await getDoc(reference);

    // Check if the document exists
    if (!snapshot.exists()) {
      throw new Error("An error occurred while fetching the document.");
    }

    // Get the document data and assign document id to it also
    return { ...snapshot.data(), id: documentId };
  }

  /**
   *
   * @param {string} documentId
   * @param {Object} data
   * @returns {Promise<boolean>}
   */
  async updateDocument(documentId, data) {
    if (documentId === null || documentId === undefined || typeof documentId !== "string") {
      throw new Error("Document id missing or is of incorrect type. Document type must be of type string");
    }

    // get document
    const document = doc(this.#database, this.#collectionName, documentId);
    await updateDoc(document, data);
    return true;
  }

  /**
   *
   * @param {string} documentId
   * @returns {Promise<boolean>}
   */
  async deleteDocument(documentId) {
    if (documentId === null || documentId === undefined || typeof documentId !== "string") {
      throw new Error("Document id missing or is of incorrect type. Document type must be of type string");
    }

    const documentRef = doc(this.#database, this.#collectionName, documentId);
    await deleteDoc(documentRef);
    return true;
  }
}
