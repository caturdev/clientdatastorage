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

``` javascript
CDatabase.add('User', { name: 'Indra Jati', email: null });
```

``` javascript
CDatabase.put('User', { name: 'Ferry Ferdian', email: null });
```

``` javascript
const userData = await CDatabase.get('UserData');
```

``` javascript
CDatabase.where('name', '==', 'Indra Jati');
const userData = await CDatabase.get('UserData');
```

The following is the notation that can be used in simple queries:
- \== <br />
to search for data equal to something, example:

``` javascript
CDatabase.where('keyData', '==', 'something');
```

- \< <br />
to search for data that is smaller than something, example:

``` javascript
CDatabase.where('keyData', '<', 'something');
```

- \<= <br />
to search for data that is less than or equal to something, example:

``` javascript
CDatabase.where('keyData', '<=', 'something');
```

- \> <br />
to search for data that is greater than something, example:

``` javascript
CDatabase.where('keyData', '>', 'something');
```

- \>= <br />
to search for data that is greater than or equal to something, example:

``` javascript
CDatabase.where('keyData', '>=', 'something');
```
### Multiple Queries
We can also add queries together using arrays

## 💾 Client Storage
ClientStorage is similar to ClientDatabase but ClientStorage has several different features. ClientStorage has two types:
1. Local
2. Global

### 📁 Local Storage
Client Storage Local is used to store data locally on each tab in the browser, so that data is isolated only on certain tabs and cannot be accessed on other tabs.

``` javascript
CStorage.addLocal('Animal', { name: 'Komodo', nation: 'Indonesia' });
```

``` javascript
CStorage.putLocal('Animal', { name: 'Panda', nation: 'China' });
```

``` javascript
const animalStore = await CStorage.getLocal('Animal');
```

### 📂 Global Storage
Client Storage Global is used to store data globally for the browser environment, so that data can be accessed on other tabs.

``` javascript
CStorage.addGlobal('Score', { win: 0, lose: 0 });
```

``` javascript
CStorage.putLocal('Score', { win: 12, lose: 10 });
```

``` javascript
const scoreStore = await CStorage.getGlobal('Score');
```

## Tips
- _When to use Database and when to use Storage?_ <br />
Adjust to your needs and the features of these two types of storage. If you need a large storage classification, use CDatabase. If you need storage that is temporary and lightweight and not too complex, use CStorage.
