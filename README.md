# Client Data Storage

Using the Client Data Storage library, we can perform data management on the client side with a larger size than using regular storage, but also efficiently. This library uses Indexeddb to run the system. So we need to make sure that the device we are using supports Indexed DB. Because the storage system uses Indexed DB, the storage object is JSON (NoSQL Database).

## 📦 Introduction

This library consists of two kinds of storage
1. Client Database
2. Client Storage

Both types have the same system, namely using IndexedDB as a storage medium, but these two types have different implementations. We will discuss after this one by one.

## 💿 Client Database
Client Database is used to store data like a database in general, but it is done on the client side. to use ClientDatabase we need to define Collections which we will use when defining objects.
``` javascript
  // prepare the collection whitch we want to create
  const collections = [
    { collection: 'User', key: 'id', autoIncrement: true },
  ];

  // create collection list from collection
  CDatabase.upgrade(collections);
```

## 💾 Client Storage
ClientStorage is similar to ClientDatabase but ClientStorage has several different features. ClientStorage has two types:
1. Local
2. Global

### 📁 Local Storage
Client Storage Local is used to store data locally on each tab in the browser, so that data is isolated only on certain tabs and cannot be accessed on other tabs.

### 📂 Global Storage
Client Storage Global is used to store data globally for the browser environment, so that data can be accessed on other tabs.