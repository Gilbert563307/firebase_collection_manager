import { limit, orderBy, QueryFieldFilterConstraint, where } from "firebase/firestore";

export class QueryConstraintCollectionManager {
  #collectionName;
  #database;

  constructor(database, collectionName) {
    this.#database = database;
    this.#collectionName = collectionName;
  }

  /**
   * Creates a {@link QueryFieldFilterConstraint} that enforces that documents
   * must contain the specified field and that the value should satisfy the
   * relation constraint provided.
   *
   * @param fieldPath - The path to compare
   * @param opStr - The operation string (e.g "&lt;", "&lt;=", "==", "&lt;",
   *   "&lt;=", "!=").
   * @param value - The value for comparison
   * @returns The created {@link QueryFieldFilterConstraint}.
   */
  whereQuery(fieldPath, opStr, value) {
    return where(fieldPath, opStr, value);
  }

  /**
   * Creates a {@link QueryOrderByConstraint} that sorts the query result by the
   * specified field, optionally in descending order instead of ascending.
   *
   * Note: Documents that do not contain the specified field will not be present
   * in the query result.
   *
   * @param fieldPath - The field to sort by.
   * @param directionStr - Optional direction to sort by ('asc' or 'desc'). If
   * not specified, order will be ascending.
   * @returns The created {@link QueryOrderByConstraint}.
   */
  orderByQuery(fieldPath, directionStr) {
    return orderBy(fieldPath, directionStr);
  }

  /**
   *
   * @param {number} limitNumber
   * @returns
   */
  limitByQuery(limitNumber) {
    return limit(limitNumber);
  }

  /**
   *
   * @param {string} fieldName
   * @param {string} searchText
   * @returns {QueryFieldFilterConstraint}
   */
  getSearchQueryBeforeFieldName(fieldName, searchText) {
    if (!fieldName) {
      throw new Error("Field name required");
    }
    const startText = searchText;
    return where(fieldName, ">=", startText);
  }

  /**
   *
   * @param {string} fieldName
   * @param {string} searchText
   * @returns {QueryFieldFilterConstraint}
   */
  getSearchQueryAfterFieldName(fieldName, searchText) {
    if (!fieldName) {
      throw new Error("Field name required");
    }

    const startText = searchText;
    const endText = startText + "\uf8ff";
    return where(fieldName, "<=", endText);
  }
}
