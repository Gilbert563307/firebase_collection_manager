import {
  collection,
  CollectionReference,
  Firestore,
  serverTimestamp,
  FieldValue,
  query,
  getDocs,
  startAfter,
  getCountFromServer,
  QuerySnapshot,
  QueryConstraint,
  limit,
  QueryFieldFilterConstraint,
  Query,
  Timestamp,
  writeBatch,
  WriteBatch,
  doc,
} from "firebase/firestore";
import { CrudCollectionManager } from "./CrudCollectionManager.js";
import { PageAble } from "./domain/PageAble.js";

const FIRST_PAGE = 1;

/**
 * Manages Firestore collection operations, providing utilities for
 * querying, pagination, and batching.
 * @extends CrudCollectionManager
 */
export class CollectionManager extends CrudCollectionManager {
  #collectionName;
  #collectionRef;
  #database;

  /**
   * Initializes the collection manager.
   * @param {string} collectionName - Name of the Firestore collection.
   * @param {Firestore} database - The Firestore database instance.
   */
  constructor(collectionName, database) {
    super(database, collectionName);
    this.#validate(collectionName, database);

    this.#collectionName = collectionName;
    this.#database = database;

    //init config
    this.#collectionRef = collection(this.#database, this.#collectionName);
  }

  /**
   * Gets the reference for the current collection.
   * @returns {CollectionReference}
   */
  getCollectionReference() {
    return this.#collectionRef;
  }

  /**
   * Creates a new document reference with an auto-generated ID.
   * @returns {DocumentReference}
   */
  createDocumentReference() {
    return doc(this.#collectionRef);
  }

  /**
   * Returns a Firestore server timestamp FieldValue.
   * @returns {FieldValue}
   */
  getCurrentServerTimestamp() {
    return serverTimestamp();
  }

  /**
   * Returns the name of the managed collection.
   * @returns {string}
   */
  getCollectionName() {
    return this.#collectionName;
  }

  /**
   * Returns the Firestore database instance.
   * @returns {Firestore}
   */
  getDatabase() {
    return this.#database;
  }

  /**
   * Returns a collection reference for a different collection by name.
   * @param {string} name - The name of the target collection.
   * @returns {CollectionReference}
   */
  getCollectionReferenceByCollectionName(name) {
    if (typeof name !== "string" || !name.trim()) {
      throw new Error("Collection name must be a non-empty string.");
    }
    return collection(this.#database, name);
  }

  /**
   * Creates a Firestore Query based on provided constraints.
   * @param {Array<QueryConstraint>} queryItems - Array of Firestore query constraints (where, orderBy, etc).
   * @returns {Query}
   */
  createQuery(queryItems) {
    if (!Array.isArray(queryItems)) throw new Error("queryItems must be an array.");
    return query(this.#collectionRef, ...queryItems);
  }

  /**
   * Creates a query for a different collection without instantiating a new manager.
   * @param {string} collectionName - The name of the collection to query.
   * @param {Array<QueryConstraint>} queryItems - Array of Firestore query constraints.
   * @returns {Query}
   */
  createQueryByGivenCollectionName(collectionName, queryItems) {
    if (typeof collectionName !== "string" || !collectionName.trim()) {
      throw new Error("Collection name must be a non-empty string.");
    }

    if (!Array.isArray(queryItems)) {
      throw new Error("queryItems must be an array of Firestore constraints.");
    }
    return query(collection(this.#database, collectionName), ...queryItems);
  }

  /**
   * Returns the Firestore Timestamp class.
   * @returns {typeof Timestamp}
   */
  getTimestampClass() {
    return Timestamp;
  }

  /**
   * Creates a new write batch operation.
   * @returns {WriteBatch}
   */
  createBatchOperation() {
    return writeBatch(this.#database);
  }

  /**
   * Fetches a specific page of documents based on query constraints.
   * @param {Array<QueryConstraint>} queryItems - Constraints for the query.
   * @param {number} page - The page number to retrieve.
   * @param {number} itemsPerPage - Number of documents per page.
   * @returns {Promise<Array<Object>>} Resolved array of document data with IDs.
   */
  async getPaginatedDocumentsByQueryItems(queryItems, page, itemsPerPage) {
    const pageAble = new PageAble(queryItems, page, itemsPerPage);

    let resultsQuery;
    if (pageAble.getPage() === FIRST_PAGE) {
      resultsQuery = query(this.#collectionRef, ...pageAble.getQueryItems(), limit(pageAble.getItemsPerPage()));
    } else {
      resultsQuery = await this.#getPaginatedCollectionQuery(
        pageAble.getPage(),
        pageAble.getItemsPerPage(),
        pageAble.getQueryItems(),
      );
    }

    // Execute the query to get the tasks.
    const querySnapshot = await getDocs(resultsQuery);
    return this.#convertQuerySnapShotDocs(querySnapshot);
  }

  /**
   * Retrieves all documents within the collection.
   * @returns {Promise<Array<Object>>}
   */
  async getAllDocuments() {
    const querySnapshot = await getDocs(this.#collectionRef);
    return this.#convertQuerySnapShotDocs(querySnapshot);
  }

  /**
   * Retrieves all documents matching the provided query constraints.
   * @param {Array<QueryConstraint>} queryItems - Firestore query constraints.
   * @returns {Promise<Array<Object>>}
   */
  async getAllDocumentsByQuery(queryItems) {
    if (!Array.isArray(queryItems)) throw new Error("queryItems must be an array.");

    const resultsQuery = query(this.#collectionRef, ...queryItems);
    const querySnapshot = await getDocs(resultsQuery);
    return this.#convertQuerySnapShotDocs(querySnapshot);
  }

  /**
   * Returns raw document snapshots based on a query.
   * @param {Array<QueryConstraint>} queryItems - Firestore query constraints.
   * @returns {Promise<QuerySnapshot>}
   */
  async getDocumentSnapShotsByQuery(queryItems) {
    if (!Array.isArray(queryItems)) throw new Error("queryItems must be an array.");

    const resultsQuery = query(this.#collectionRef, ...queryItems);
    return await getDocs(resultsQuery);
  }

  /**
   * Counts the total number of documents matching a specific query.
   * @param {Array<QueryConstraint>} queryItems - Firestore query constraints.
   * @returns {Promise<number>} The total count of matching documents.
   */
  async countDocumentsByQuery(queryItems) {
    if (!Array.isArray(queryItems)) throw new Error("queryItems must be an array.");

    const totalQuery = query(this.#collectionRef, ...queryItems);
    const totalRecordsSnapShot = await getCountFromServer(totalQuery);
    return totalRecordsSnapShot.data().count;
  }

  /**
   * Executes a pre-constructed Firestore Query and returns the data.
   * @param {Query} query - The Firestore Query object.
   * @returns {Promise<Array<Object>>}
   */
  async getDocumentsByQuery(query) {
    if (!query) throw new Error("A valid Firestore Query object is required.");
    const querySnapshot = await getDocs(query);
    return this.#convertQuerySnapShotDocs(querySnapshot);
  }

  /**
   * Internal helper to calculate pagination using cursor-based logic.
   * @param {number} currentPage
   * @param {number} itemsPerPage
   * @param {Array<QueryConstraint>} queryItems
   * @returns {Promise<Query>}
   * @private
   */
  async #getPaginatedCollectionQuery(currentPage, itemsPerPage, queryItems) {
    // 1. Validation Check
    if (
      !Number.isInteger(currentPage) ||
      currentPage <= 1 ||
      !Number.isInteger(itemsPerPage) ||
      itemsPerPage <= 0 ||
      !Array.isArray(queryItems)
    ) {
      throw new Error(
        `Invalid pagination parameters: currentPage(${currentPage}), itemsPerPage(${itemsPerPage}). ` +
          `Ensure page is > 1 and itemsPerPage is > 0.`,
      );
    }

    // Calculate the limit for fetching documents up to the current page
    const newPageLimit = currentPage * itemsPerPage;

    // Fetch tasks limited by the new page limit
    const allDocsLimitedByThePageNumber = query(this.#collectionRef, ...queryItems, limit(newPageLimit));

    // Get document snapshots for the calculated limit clause
    const documentSnapshots = await getDocs(allDocsLimitedByThePageNumber);

    // Calculate the offset to start from the last doc in the array
    const offset = (currentPage - 1) * itemsPerPage;

    // Get the document to start after, based on the offset
    const startFromDocument = documentSnapshots.docs[offset - 1];

    if (!startFromDocument) {
      throw new Error("No document found to start after for the given page.");
    }
    // Return a query that starts after the last visible document of the previous page
    return query(this.#collectionRef, ...queryItems, startAfter(startFromDocument), limit(itemsPerPage));
  }

  /**
   * Maps a QuerySnapshot into a standard array of objects including document IDs.
   * @param {QuerySnapshot} querySnapshot - The snapshot from Firestore.
   * @returns {Array<Object>}
   * @private
   */
  #convertQuerySnapShotDocs(querySnapshot) {
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();

      if (!data.created_at || !data.updated_at) {
        console.warn(`Missing timestamps for doc ${doc.id}`);
        return {
          ...data,
          id: doc.id,
          created_at: null,
          updated_at: null,
        };
      }

      return {
        ...data,
        id: doc.id,
      };
    });
  }

  /**
   * Validates the integrity of constructor arguments.
   * @param {string} collectionName
   * @param {Firestore} database
   * @throws {Error} If validation fails.
   * @private
   */
  #validate(collectionName, database) {
    // Validate collectionName: Must be a string and not just whitespace
    if (typeof collectionName !== "string" || !collectionName.trim()) {
      throw new Error("Invalid collectionName: must be a non-empty string.");
    }

    // Validate database: Check if the 'type' property matches the Firestore definition
    const validTypes = ["firestore-lite", "firestore"];

    if (!database || !validTypes.includes(database.type)) {
      throw new Error(`Invalid database: expected firestore or firestore-lite, but got ${database?.type}`);
    }
  }
}
