import { addDoc, deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { QueryConstraintCollectionManager } from "./QueryConstraintCollectionManager";

export class CrudCollectionManager extends QueryConstraintCollectionManager {
  #collectionName;
  #collectionRef;
  #database;

  constructor(database, collectionName) {
    super(database, collectionName);
    this.#database = database;

    this.#collectionName = collectionName;
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
    const documentRef = doc(this.#database, this.#collectionName, documentId);
    await deleteDoc(documentRef);
    return true;
  }
}
