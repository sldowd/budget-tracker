let db;
// establish connection to IDB and set it to version 1
const request = indexedDB.open('budget_tracker', 1);
//event will emit if db vers changes
request.onupgradeneeded = function(event) {
    //save ref to db
    const db = event.target.result
    //create object store & set to auto increment
    db.createObjectStore('new_transaction', { autoIncrement: true });
}

//upon successful request
request.onsuccess = function(event) {
    // when db is successfully created w object store save ref to db in global variable
    db = event.target.result;

    //check if app is online--if yes, upload to api
    if (navigator.online) {
        uploadTransaction();
    }
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
}

// function executed if we submit a new transaction and there is not internet
function saveRecord(record) {
    console.log('saveRecord function call');
    // open a new transaction with the database w read/write ability
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // access objectStore
    const transactionObjectStore = transaction.objectStore('new_transaction');

    // add record to your store with add method
    transactionObjectStore.add(record);
}

function uploadTransaction() {
    console.log('upload function called')
    // open a transaction w db
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // access objectStore
    const transactionObjectStore = transaction.objectStore('new_transaction');
    
    // get all records from store and set to var
    const getAll = transactionObjectStore.getAll();

    // upon a successful getAll execution run function>
    getAll.onsuccess = function() {
        // if data in idb store, send to api
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                // open another transaction
                const transaction = db.transaction(['new_transaction'], 'readwrite');
                // access objectstore
                const transactionObjectStore = transaction.objectStore('new_transaction');
                // clear all items in store
                transactionObjectStore.clear();

                alert('All stored transactions have been submitted💰')
            })
            .catch(err => console.log(err));
        }
    }
};

window.addEventListener('online', uploadTransaction)
//module.exports = { saveRecord };