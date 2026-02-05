import {
  collection,
  CollectionReference,
  Firestore,
  serverTimestamp,
  FieldValue,
  Timestamp,
  query,
  getDocs,
  startAfter,
  getCountFromServer,
  QuerySnapshot,
  QueryConstraint,
  limit,
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
   * @returns {Promise<QuerySnapshot<>>}
   */
  async getAllDocuments() {
    const querySnapshot = query(this.#collectionRef);
    return await getDocs(querySnapshot);
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

  async getDocumentsByQuery(query) {
    const querySnapshot = await getDocs(query);
    return this.#convertQuerySnapShotDocs(querySnapshot);
  }

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
   * @returns {Array<any>}
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
        created_at: data.created_at.toDate(),
        updated_at: data.updated_at.toDate(),
      };
    });
  }

  /**
   * @param {{ seconds: number, nanoseconds: number } } object
   * @returns { Date }
   */
  #convertTimeStampToDate(object) {
    if (object.nanoseconds === null || object.seconds === null) {
      throw new Error("Something went wrong while converting time stamp to date");
    }
    return new Timestamp(object.seconds, object.nanoseconds).toDate();
  }
}
