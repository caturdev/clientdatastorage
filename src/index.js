/**
 * Client Database
 * =
 * Client database menggunakan IndexedDB dalam sistemnya
 * sehingga perlu dipastikan bahwa browser support untuk IndexedDB versi stabil
 * -
 * bagian pertama adalah untuk memeriksa apakah browser mendukung indexedDB atau tidak
 * pada bagian function init disediakan callback function untuk menangani
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

const CLIENT_DATA_STORAGE_CONFIG = {
  where: [],
}

const CDatabase = {

  /**
   * Init Function
   * =
   * this function is for initialization the system
   * 
   * @param {Function} onError callback function
   * @returns 
   */

  init: (onError = null) => new Promise((resolve) => {

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
      resolve('error');
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

  /**
   * Upgrade System
   * =
   * this function for upgrade the database
   * when user want to create a collection, user need to upgrade the database with new collection list
   * -
   * warning: if define a collection, and the collection name is defined, it will be error
   * 
   * @param {Array} collections of list that will be create
   * @param {Function} callback funciton that will run after the function done
   * @returns 
   */
  upgrade: (collections = [], callback) => new Promise(async (resolve) => {

    await CDatabase.init();

    const versionSystem = await CDatabase.get(CLIENT_DATA_STORAGE_SYSTEM.systemKey, 'version');
    const currentVersion = versionSystem.value;
    const newVersion = currentVersion + 1;

    CLIENT_DATA_STORAGE_DATABASE.close()

    const request = window.indexedDB.open("ClientDB", newVersion);

    request.onsuccess = function (event) {
      CLIENT_DATA_STORAGE_DATABASE = request.result;
      // Update system version on database
      CDatabase.put(CLIENT_DATA_STORAGE_SYSTEM.systemKey, { id: 'version', value: newVersion });
      if (callback && typeof callback === 'function') callback()
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

  /**
   * Where Functions
   * =
   * used for make a simple query
   * 
   * @param {String} searched fields
   * @param {String} comparative notation
   * @param {String} the value condition
   * @returns 
   */
  where: (condition, notation, value) => {

    if (typeof condition === 'object') {
      CLIENT_DATA_STORAGE_CONFIG.where = [...CLIENT_DATA_STORAGE_CONFIG.where, condition];
      return;
    };

    if (typeof condition === 'string') {
      CLIENT_DATA_STORAGE_CONFIG.where = [...CLIENT_DATA_STORAGE_CONFIG.where, [condition, notation, value]];
      return;
    }

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

  /**
   * C Database GET
   * =
   * function to get data from database.
   * function will get all data if there is no key passed in the second parameter
   * and will get specified data id there is a key passed in the second parameter
   * 
   * @param {String} collection the database object name the want to search
   * @param {*} conditionalParameter string as key, or function as callback
   * @param {Function} callback a function what will be run after function run well
   * @returns object data or null (of error of no data available)
   */

  get: (collection, conditionalParameter, callback) => new Promise((resolve) => {
    CLIENT_DATA_STORAGE_SYSTEM.CDBFunctionRunner(() => {

      try {

        // ----------------------------
        // Get all data from collection
        // ----------------------------

        let req = null;

        if (conditionalParameter && typeof conditionalParameter === 'string') {
          // condition if the second argument is a string as key
          req = CLIENT_DATA_STORAGE_DATABASE.transaction(collection).objectStore(collection).get(conditionalParameter);
        } else {
          // condition if the second argument is a function
          req = CLIENT_DATA_STORAGE_DATABASE.transaction(collection).objectStore(collection).getAll();
        }

        if (!req) throw 'No object generated';

        // ------------------
        // On Success Process
        // ------------------

        req.onsuccess = () => {

          // return the data result

          let result = req.result;

          if (CLIENT_DATA_STORAGE_CONFIG.where && typeof CLIENT_DATA_STORAGE_CONFIG.where === 'object' && CLIENT_DATA_STORAGE_CONFIG.where.length) {

            let dataFiltered = [];
            for (const resultItem of req.result) {
              for (const whereArrData of CLIENT_DATA_STORAGE_CONFIG.where) {
                switch (whereArrData[1]) {
                  case '==':
                    if (resultItem[whereArrData[0]] == whereArrData[2]) dataFiltered = [...dataFiltered, resultItem];
                    break;

                  case '<':
                    if (resultItem[whereArrData[0]] < whereArrData[2]) dataFiltered = [...dataFiltered, resultItem];
                    break;

                  case '<=':
                    if (resultItem[whereArrData[0]] <= whereArrData[2]) dataFiltered = [...dataFiltered, resultItem];
                    break;

                  case '>':
                    if (resultItem[whereArrData[0]] > whereArrData[2]) dataFiltered = [...dataFiltered, resultItem];
                    break;

                  case '>=':
                    if (resultItem[whereArrData[0]] >= whereArrData[2]) dataFiltered = [...dataFiltered, resultItem];
                    break;

                  default:
                    break;
                }
              }
            }

            result = dataFiltered;

          }

          // Consider run the callback function by the condition
          if (conditionalParameter && typeof conditionalParameter === 'string' && typeof callback === 'function') {
            // condition if the second argument is a string as key
            callback(result);
          } else if (conditionalParameter && typeof conditionalParameter === 'function') {
            // condition if the second argument is a function
            conditionalParameter(result);
          }

          // Clear filter object
          CLIENT_DATA_STORAGE_CONFIG.where = [];

          // Resolve the promise callback
          resolve(result);

        };

        // ----------------
        // On Error Process
        // ----------------

        req.onerror = (err) => {
          resolve(null);
        };

      } catch (error) {
        // if there are an error like bellow
        // Failed to execute 'transaction' on 'IDBDatabase': One of the specified object stores was not found.
        resolve(null);
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

(async () => {

  await CDatabase.init();

})();
