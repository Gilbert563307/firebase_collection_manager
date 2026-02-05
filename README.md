# Firebase CRUD collection manager

## Use Firebase in your app

1. Initialize Firebase in your app and create a Firebase App object:

```js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Replace the following with your app's Firebase project configuration
const firebaseConfig = {
  apiKey: APP_FIREBASE_API_KEY,
  authDomain: APP_FIREBASE_AUTH_DOMAIN,
  projectId: APP_FIREBASE_PROJECT_ID,
  storageBucket: APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: APP_FIREBASE_APP_ID,
  measurementId: APP_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

## Using the collection manager

2. Import the collection manager, initialize the collection manager by passing in the collection name and db, the collection does not need to exist to be used.
   For this example we will use the cities collection

```js
import { CollectionManager } from "path";

const citiesManager = new CollectionManager("cities ", db);
```

## Adding a document into your collection

3. Create an object object with your desired keys & values

```js
const city = {
  name: "London",
  population: 5000000,
};

citiesManager.createDocument(city); //returns a boolean
```

## Reading a document from your collection

4. Read a document from your collection by providing the document id.

```js
const document = await citiesManager.readDocument(documentId); //returns an object
```

## Update an existing document from your collection

5. Update a document from your collection by providing the document id and the data object to update.

```js
const city = {
  name: "London",
  population: 6500000,
};

const updated = await citiesManager.updateDocument(documentId, city); // returns a boolean
```

## Delete an existing document from your collection

6. Delete a document from your collection by providing the document id.

```js
const deleted = await citiesManager.deleteDocument(documentId); //returns a boolean
```

## Fetch multiple documents from your collection with pagination and query items

7. Fetch multiple documents from your collection by providing the an array with query constraints, page number, and the items per page.

```js
const queryItems = [
  citiesManager.whereQuery("population", ">=", 1000000)
  ]; //queryItems Array can also be empty

// 2. Fetch page 1 (15 items per page)
const results = await citiesManager.getPaginatedDocumentsByQueryItems(
  filters, 
  1, // Page number
  15 // Items per page
);
```


### Npm
[Npm url](https://www.npmjs.com/package/firebase_collection_manager)
npm i firebase_collection_manager

### Youtube 
Package usage tutorial
[Tutorial](https://youtu.be/s6lvNcDyfQ8)
