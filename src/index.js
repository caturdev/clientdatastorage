/**
 * Client Database
 * =
 * Client database menggunakan IndexedDB dalam sistemnya
 * sehingga perlu dipastikan bahwa browser support untuk IndexedDB versi stabil
 * -
 * bagian pertama adalah untuk memeriksa apakah browser mendukung indexedDB atau tidak
 * pada bagian function CDB_init disediakan callback function untuk menangani
 * apabila browser tidak mendukung IndexedDB
 * 
 * 
 */

// prefixes of implementation that we want to test
window.indexedDB = window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB;

// prefixes of window.IDB objects
window.IDBTransaction = window.IDBTransaction ||
  window.webkitIDBTransaction ||
  window.msIDBTransaction;

window.IDBKeyRange = window.IDBKeyRange ||
  window.webkitIDBKeyRange ||
  window.msIDBKeyRange;

/**
 * Main System
 * =
 * bagian dibawah ini adalah sistem utama dari Client Database
 * 
 */

let CLIENT_DATA_STORAGE_DATABASE;

const CLIENT_DATA_STORAGE_SYSTEM = {

  collection: 'ClientDB',

  timeoutConnection: 5,

  systemKey: '__system__',

  storageKey: '__storage__',

  tabId: (str) => {
    const id = sessionStorage.tabID ? sessionStorage.tabID : sessionStorage.tabID = Math.random();
    return `TID${id}#${str}`;
  },

  CDB_init: (onError = null) => new Promise((resolve) => {

    // validation: memeriksa apakah browser mendukung IndexedDB atau tidak
    if (onError && typeof onError === 'function') {
      if (!window.indexedDB) {
        onError('Browser tidak support IndexedDB versi stabil');
        resolve('error');
      }
    }

    // main init indexedDB
    const request = window.indexedDB.open(CLIENT_DATA_STORAGE_SYSTEM.collection);

    request.onsuccess = function (event) {
      CLIENT_DATA_STORAGE_DATABASE = request.result;
      resolve('success');
    };

    request.onerror = function (event) {
      console.error("Error Initializing Client Database", event);
    };

    request.onupgradeneeded = function (event) {

      const CDB_result = event.target.result;

      // Define Default Collection
      const objectStoreSystem = CDB_result.createObjectStore(CLIENT_DATA_STORAGE_SYSTEM.systemKey, { keyPath: 'id', autoIncrement: false });
      const objectStoreStorage = CDB_result.createObjectStore(CLIENT_DATA_STORAGE_SYSTEM.storageKey, { keyPath: 'id', autoIncrement: false });

      // Add Current Version of Database
      objectStoreSystem.add({ id: 'version', value: 1 });

    }

  }),

  CDBUpgradeStore: (collections = []) => new Promise(async (resolve) => {

    await CLIENT_DATA_STORAGE_SYSTEM.CDB_init();

    const versionSystem = await CDatabase.get(CLIENT_DATA_STORAGE_SYSTEM.systemKey, 'version');
    const currentVersion = versionSystem.value;
    const newVersion = currentVersion + 1;

    CLIENT_DATA_STORAGE_DATABASE.close()

    const request = window.indexedDB.open("ClientDB", newVersion);

    request.onsuccess = function (event) {
      CLIENT_DATA_STORAGE_DATABASE = request.result;
      // Update system version on database
      CDatabase.put(CLIENT_DATA_STORAGE_SYSTEM.systemKey, { id: 'version', value: newVersion });
      resolve('success');
    };

    request.onerror = function (event) {
      console.error("Upgrade Error", event);
    };

    request.onupgradeneeded = function (event) {

      const CDB_result = event.target.result;

      // Initializing Custom Collection
      for (const collectionData of collections) {
        CDB_result
          .createObjectStore(
            collectionData.collection, {
            keyPath: collectionData.key,
            autoIncrement: collectionData.autoIncrement,
          });
      }

    }

  }),

  CDBFunctionRunner: (callback) => {

    let trials = 0;

    const intervalID = setInterval(() => {

      ++trials;

      if (CLIENT_DATA_STORAGE_DATABASE) {
        callback();
        return clearInterval(intervalID);
      }

      if (trials > CLIENT_DATA_STORAGE_SYSTEM.timeoutConnection) {
        console.error('timeout connection dengan Client Database');
        return clearInterval(intervalID);
      }

      console.info('mencoba menghubungkan dengan Client Database');

    }, 10);

  },

}

const CDatabase = {

  init: async (callback) => {
    return await CLIENT_DATA_STORAGE_SYSTEM.CDB_init(callback);
  },

  upgrade: async (collections, callback) => {
    await CLIENT_DATA_STORAGE_SYSTEM.CDBUpgradeStore(collections);
    if (callback && typeof callback === 'function') callback()
    return;
  },

  add: (collection, data, callback) => {
    CLIENT_DATA_STORAGE_SYSTEM.CDBFunctionRunner(() => {

      const req = CLIENT_DATA_STORAGE_DATABASE
        .transaction([collection], "readwrite")
        .objectStore(collection)
        .add(data);

      req.onsuccess = (event) => { if (callback && typeof callback === 'function') callback() };
      req.onerror = (event) => console.error('CDB Error: Add data to ' + collection);
      // req.onerror = (event) => console.error('CDB Error: Add data to ' + collection + ' ' + req.error);

    });
  },

  put: (collection, data, callback) => {
    CLIENT_DATA_STORAGE_SYSTEM.CDBFunctionRunner(() => {

      const req = CLIENT_DATA_STORAGE_DATABASE
        .transaction([collection], "readwrite")
        .objectStore(collection)
        .put(data);

      req.onsuccess = (event) => { if (callback && typeof callback === 'function') callback() };
      req.onerror = (event) => console.error('CDB Error : Put data to ' + collection);

    });
  },

  get: (collection, key, callback) => new Promise((resolve) => {
    CLIENT_DATA_STORAGE_SYSTEM.CDBFunctionRunner(() => {

      // get all data from collection
      let req = null;

      if (key) {
        req = CLIENT_DATA_STORAGE_DATABASE.transaction(collection).objectStore(collection).get(key);
      } else {
        req = CLIENT_DATA_STORAGE_DATABASE.transaction(collection).objectStore(collection).getAll();
      }

      if (req) {
        // on success
        req.onsuccess = () => {
          resolve(req.result);
          if (callback && typeof callback === 'function') callback();
        };
        // on error
        req.onerror = (err) => console.error(`DCB Error : Get data to: ${collection}`);
      } else {
        resolve('SDB error connenction');
      }

    });
  }),

  getKeys: (collection) => new Promise((resolve) => {
    CLIENT_DATA_STORAGE_SYSTEM.CDBFunctionRunner(() => {

      const rq = CLIENT_DATA_STORAGE_DATABASE.transaction(collection).objectStore(collection).getAllKeys();

      // on success
      rq.onsuccess = () => resolve(rq.result);
      // on error
      rq.onerror = (err) => console.error(`Error to get all data: ${err}`)

    });
  }),

  count: (collection) => new Promise((resolve) => {
    CLIENT_DATA_STORAGE_SYSTEM.CDBFunctionRunner(() => {

      const rq = CLIENT_DATA_STORAGE_DATABASE.transaction([collection], "readwrite").objectStore(collection).count();

      rq.onsuccess = (event) => resolve(rq.result);

    });
  }),

  delete: (collection, key, callback) => {
    CLIENT_DATA_STORAGE_SYSTEM.CDBFunctionRunner(() => {
      const request = CLIENT_DATA_STORAGE_DATABASE.transaction([collection], "readwrite").objectStore(collection).delete(key);
      request.onsuccess = (event) => { if (callback && typeof callback === 'function') callback() };
    });
  },

  clear: (collection, callback) => {
    CLIENT_DATA_STORAGE_SYSTEM.CDBFunctionRunner(() => {
      const request = CLIENT_DATA_STORAGE_DATABASE.transaction([collection], "readwrite").objectStore(collection).clear();
      request.onsuccess = (event) => { if (callback && typeof callback === 'function') callback() };
    });
  },

};

const CStorage = {

  addGlobal: async (key, data, callback) => {
    CDatabase.add(CLIENT_DATA_STORAGE_SYSTEM.storageKey, {
      id: key,
      data: data,
      location: {
        protocol: window.location.protocol,
        host: window.location.host,
        pathname: window.location.pathname,
        search: window.location.search,
      },
      time: Date.now(),
    }, callback);
  },

  addLocal: async (key, data, callback) => {
    CDatabase.add(CLIENT_DATA_STORAGE_SYSTEM.storageKey, {
      id: CLIENT_DATA_STORAGE_SYSTEM.tabId(key),
      data: data,
      location: {
        protocol: window.location.protocol,
        host: window.location.host,
        pathname: window.location.pathname,
        search: window.location.search,
      },
      time: Date.now(),
    }, callback);

  },

  getGlobal: (key, callback) => new Promise(async (resolve) => {

    const res = await CDatabase.get(
      CLIENT_DATA_STORAGE_SYSTEM.storageKey,
      key,
      callback
    );
    resolve(res);

  }),

  getLocal: (key, callback) => new Promise(async (resolve) => {

    const res = await CDatabase.get(
      CLIENT_DATA_STORAGE_SYSTEM.storageKey,
      CLIENT_DATA_STORAGE_SYSTEM.tabId(key),
      callback,
    );
    resolve(res);

  }),

  putGlobal: async (key, data, callback) => {
    CDatabase.put(CLIENT_DATA_STORAGE_SYSTEM.storageKey, {
      id: key,
      data: data,
      location: {
        protocol: window.location.protocol,
        host: window.location.host,
        pathname: window.location.pathname,
        search: window.location.search,
      },
      time: Date.now(),
    }, callback);
  },

  putLocal: async (key, data, callback) => {
    CDatabase.put(CLIENT_DATA_STORAGE_SYSTEM.storageKey, {
      id: CLIENT_DATA_STORAGE_SYSTEM.tabId(key),
      data: data,
      location: {
        protocol: window.location.protocol,
        host: window.location.host,
        pathname: window.location.pathname,
        search: window.location.search,
      },
      time: Date.now(),
    }, callback);
  },

  getAllKey: () => new Promise(async (resolve) => {
    const rq = CDatabase.getKeys(CLIENT_DATA_STORAGE_SYSTEM.storageKey);
    // on success
    rq.onsuccess = () => resolve(rq.result);
    // on error
    rq.onerror = (err) => console.error(`Error to get all data: ${err}`)
  }),

  deleteGlobal: (key, callback) => {
    CDatabase.delete(
      CLIENT_DATA_STORAGE_SYSTEM.storageKey,
      key,
      callback,
    );
  },

  deleteLocal: (key, callback) => {
    CDatabase.delete(
      CLIENT_DATA_STORAGE_SYSTEM.storageKey,
      CLIENT_DATA_STORAGE_SYSTEM.tabId(key),
      callback,
    );
  },

  clearGlobal: async (callback) => new Promise(async (resolve) => {

    const keys = await CDatabase.getKeys(CLIENT_DATA_STORAGE_SYSTEM.storageKey);

    for (const key of keys) {
      const prefixes = key.slice(0, 5);
      console.log(prefixes !== 'TID0.', key);
      // data akan dihapus apabila diawali dengan 'TID0.'
      if (prefixes !== 'TID0.') CDatabase.delete(CLIENT_DATA_STORAGE_SYSTEM.storageKey, key);
    }

    if (callback && typeof callback === 'function') callback()

  }),

  clearLocal: async (callback) => new Promise(async (resolve) => {

    const keys = await CDatabase.getKeys(CLIENT_DATA_STORAGE_SYSTEM.storageKey);

    for (const key of keys) {
      const prefixes = key.slice(0, 5);
      // data akan dihapus apabila diawali dengan 'TID0.'
      if (prefixes === 'TID0.') CDatabase.delete(CLIENT_DATA_STORAGE_SYSTEM.storageKey, key);
    }

    if (callback && typeof callback === 'function') callback()

  }),

  clearStorage: (callback) => {
    CDatabase.clear(CLIENT_DATA_STORAGE_SYSTEM.storageKey, callback);
  },

};
