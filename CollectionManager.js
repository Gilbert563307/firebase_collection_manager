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
} from "firebase/firestore";
import { CrudCollectionManager } from "./CrudCollectionManager.js";
import { PageAble } from "./domain/PageAble.js";

const FIRST_PAGE = 1;
export class CollectionManager extends CrudCollectionManager {
  #collectionName;
  #collectionRef;
  #database;

  /**
   * Collection name for the firebase collection
   * @param {string} collectionName
   * @param {Firestore} database
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
   *
   * @returns {CollectionReference<>}
   */
  getCollectionReference() {
    return this.#collectionRef;
  }

  /**
   *
   * @returns {FieldValue}
   */
  getCurrentServerTimestamp() {
    return serverTimestamp();
  }

  /**
   *
   * @returns {string}
   */
  getCollectionName() {
    return this.#collectionName;
  }

  /**
   *
   * @returns {Firestore}
   */
  getDatabase() {
    return this.#database;
  }

  /**
   * Returns a different collection  reference by the given collection name
   * @param {string} name
   *  @returns {CollectionReference<>}
   */
  getCollectionReferenceByCollectionName(name) {
    return collection(this.#database, name);
  }

  /**
   *
   * @param {Array<any>} queryItems
   */
  createQuery(queryItems) {
    return query(this.#collectionRef, ...queryItems);
  }

  /**
   *
   * @param {Array<QueryConstraint>} queryItems
   * @param {number} page
   * @param {number} itemsPerPage
   * @returns {Promise<Array<Object>>}
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
   *
   * @returns {Promise<Object>}
   */
  async getAllDocuments() {
    const querySnapshot = await getDocs(this.#collectionRef);
    return this.#convertQuerySnapShotDocs(querySnapshot);
  }

  /**
   *
   * @param {Array<Query<any, any>>} queryItems
   * @returns {Promise<Object>}
   */
  async getAllDocumentsByQuery(queryItems) {
    const resultsQuery = query(this.#collectionRef, ...queryItems);
    const querySnapshot = await getDocs(resultsQuery);
    return this.#convertQuerySnapShotDocs(querySnapshot);
  }

  /**
   *
   * @param {Array<any>} queryItems
   * @returns {Promise<number>}
   */
  async countDocumentsByQuery(queryItems) {
    const totalQuery = query(this.#collectionRef, ...queryItems);
    const totalRecordsSnapShot = await getCountFromServer(totalQuery);
    return totalRecordsSnapShot.data().count;
  }

  /**
   *
   * @param {Query} query
   * @returns {Promise<Array<Object>>}
   */
  async getDocumentsByQuery(query) {
    const querySnapshot = await getDocs(query);
    return this.#convertQuerySnapShotDocs(querySnapshot);
  }

  /**
   *
   * @param {number} currentPage
   * @param {number} itemsPerPage
   * @param {Array<QueryFieldFilterConstraint >} queryItems
   * @returns {Promise<Query<>>}
   */
  async #getPaginatedCollectionQuery(currentPage, itemsPerPage, queryItems) {
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
   *
   * @param {*} querySnapshot
   * @returns {Array<Object>}
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
   * @param {string} collectionName
   * @param {Firestore} database
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
