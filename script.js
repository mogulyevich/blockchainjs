const transactionNo = document.getElementById("transactions");
const userAddressBox = document.getElementById("userAddress");

// Function to create a UUID identifier
// Courtesy of https://www.w3resource.com/javascript-exercises/javascript-math-exercise-23.php
function createUuid() {
    let time = new Date().getTime();
    let uuid = 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        let r = (time + Math.random()*16)%16 | 0;
        time = Math.floor(time/16);
        
        return (c === 'x' ? r :(r&0x3|0x8)).toString(16);
    });

    return uuid;
}

// Basic Blockchain Construct
function Blockchain() {
    this.chain = [];
    this.pendingTransactions = [];
}

// Initiating a new blockchain on each load
blockchain = new Blockchain();

// Create a unique address for the user using the UUID Function above
const userAddress = createUuid();
userAddressBox.value = userAddress;

// Basic Block Building Function
Blockchain.prototype.createNewBlock = function(previousBlockHash, hash, nonce) {
    const newBlock = {
        index: this.chain.length + 1,
        timestamp: Date.now(),
        transactions: this.pendingTransactions,
        previousBlockHash: previousBlockHash,
        hash: hash,
        nonce: nonce,
    };

    this.pendingTransactions = [];
    this.chain.push(newBlock);

    return newBlock;
}

// Creating Genesis Block
// Data For Generating the Initial Hash of the Genesis Block (every piece of data goes into a new line)
// index: 1,
// transactions : [],
// previousBlockHash: 'GENESYS',
// nonce: 0,
const genesisBlock = blockchain.createNewBlock('GENESYS', '6f849ff3c13ba8209860d571003dbb47cbe7027df526b134ef7a7de1135fdce0', 0);

// Populating the Genesis Block Table Statically 
document.getElementById("genesisBlockNo").innerHTML = "Block " + genesisBlock.index;
document.getElementById("genesisIndex").innerHTML = genesisBlock.index;
document.getElementById("genesisTimestamp").innerHTML = new Date(Date.now());
document.getElementById("genesisTransactions").innerHTML = genesisBlock.transactions.length;
document.getElementById("genesisPreviousBlockHash").innerHTML = genesisBlock.previousBlockHash;
document.getElementById("genesisHash").innerHTML = genesisBlock.hash;
document.getElementById("genesisNonce").innerHTML = genesisBlock.nonce;

// Get the information from last block 
Blockchain.prototype.getLastBlock = function() {
    return this.chain[this.chain.length - 1];
}

// Using getLastBlock() to parse the previousBlockHash & the next index
const previousBlock = blockchain.getLastBlock();
const previousBlockHash = previousBlock['hash']
const currentBlockData = {
    transactions: blockchain.pendingTransactions,
    index: previousBlock['index'] + 1
}

// Hash Function based on Forge CDN Script -> Message Digest -> SHA256
// Go to https://github.com/digitalbazaar/forge for more info
Blockchain.prototype.hashBlock = function(previousBlockHash, currentBlockData, nonce) {
    var hashFunction = forge.md.sha256.create();
    hashFunction.update(previousBlockHash + JSON.stringify(currentBlockData) + nonce.toString());
    hash = hashFunction.digest().toHex();

    return hash;
}

// Proof of Work algorithm 
Blockchain.prototype.proofOfWork = function(previousBlockHash, currentBlockData) {
    // Nonce starts at 0
    let nonce = 0;
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);

    // Initiating a loop that will find the correct hash that starts with '00'
    while (hash.substring(0, 2)!== '00') {
        nonce++;
        hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    };

    return nonce;
}

// Basic Transaction Creation Construct
Blockchain.prototype.createNewTransaction = function(amount, sender, recipient) {
    const newTransaction = {
        transactionId: createUuid(),
        txTimestamp: Date.now(),
        sender: sender,
        recipient: recipient,
        amount: amount,
    };

    return newTransaction;
}

// Basic Time Ago Function that Retrieve the Seconds Passed Since The Event
const timeSince = (date) => {
    let seconds = Math.floor((new Date() - date) / 1000);

    return seconds;
}

// Event Listeners
document.getElementById("mineBtn").addEventListener("click", () => {
    // Mining Process
    // Gather the information needed with getLastBlock Construct
    const previousBlock = blockchain.getLastBlock();
    const previousBlockHash = previousBlock['hash'];
    const currentBlockData = {
        transactions: blockchain.pendingTransactions,
        index: previousBlock['index'] +1
    };
    // Initiate Proof of Work algorithm
    const nonce = blockchain.proofOfWork(previousBlockHash, currentBlockData);
    // The Hash of the New Block
    const hash = blockchain.hashBlock(previousBlockHash, currentBlockData, nonce);
    // Create the Block and Add it to the Blockchain
    const newBlock = blockchain.createNewBlock(previousBlockHash, hash, nonce);
    // Add the mining reward to the pendingTransactions array
    const miningReward = blockchain.createNewTransaction(50, "REWARD", userAddress);
    blockchain.pendingTransactions.push(miningReward);
    
    // Reset the HTML code parsed with Javascript In Other Sections Whenever A New Block Is Mined
    document.getElementById("fundsMessage").innerHTML = "";
    document.getElementById("newPendingTransactionTable").innerHTML = "";

    // The Block Number
    document.getElementById("blockNo").innerHTML = "Block " + newBlock.index;

    // Loop That Builds The NewBlock Table Dynamically Adding Values based on the Keys Which Are IDs in HTML
    Object.entries(newBlock).forEach(([key, value]) => {
        document.getElementById(key).textContent = value;
    });
    
    // The Number of Transactions in NewBlock based on array length property
    function noOfTransactions() {
        document.getElementById("transactions").textContent = newBlock.transactions.length;
    };
    
    noOfTransactions();

    // Transforms the timestamp into a readable Date format
    document.getElementById("timestamp").textContent = new Date(newBlock.timestamp);

    // Retrieves ALL Transactions since the beginning of the blockchain 
    function blockTransactions() {
        // If no transactions, give message to user
        if (newBlock.transactions.length === 0) {
            document.getElementById("txErrorMessage").innerHTML = "Nothing to see here!";
        } else {
            // Prepare the table
            document.getElementById("txErrorMessage").innerHTML = "";
            document.getElementById("transactionTable").hidden = false;
            // Loop that sequentially builds the table body and fills the cells with the information from each & every transaction
            newBlock.transactions.forEach(transaction => {                
                const table = document.getElementById("newTransactionTable")
                
                let row = table.insertRow();
                let transactionId = row.insertCell(0);
                transactionId.innerHTML = transaction.transactionId;
                let txTimestamp = row.insertCell(1);
                txTimestamp.innerHTML = (new Date(transaction.txTimestamp)).toLocaleTimeString();
                let sender = row.insertCell(2);
                sender.innerHTML = transaction.sender;
                let recipient = row.insertCell(3);
                recipient.innerHTML = transaction.recipient;
                let amount = row.insertCell(4);
                amount.innerHTML = transaction.amount;
                let index = row.insertCell(5);
                index.innerHTML = newBlock.index;
            });
        };
    };

    blockTransactions();
});

document.getElementById("fundsBtn").addEventListener("click", () => {
    const yourAddress = userAddress;
    const yourTransactions = [];

    // Get all custom transactions from the blockchain using a loop and add them to an array
    blockchain.chain.forEach(block => {
        block.transactions.forEach(transaction => {
            if (transaction.sender === yourAddress || transaction.recipient === yourAddress) {
                yourTransactions.push(transaction);
            };
        });
    });

    // Initial user Balance
    let balance = 0;
    // Search through the transactions in the array and use add or subtract to retrieve the final balance
    yourTransactions.forEach(transaction => {
        if (transaction.recipient === yourAddress) {
            balance += transaction.amount;
        } else if (transaction.sender === yourAddress) {
            balance -= transaction.amount;
        };
    });

    // Notifies user of the balance
    document.getElementById("fundsMessage").hidden = false;
    document.getElementById("fundsMessage").innerHTML = `You now have ${balance} Coins.`
});

document.getElementById("transactionBtn").addEventListener("click", () => {
    // Get IDs from HTML - Main text boxes necessary to create a transaction
    let recipientsAddress = document.getElementById("recipientsAddress").value; 
    let transactionAmount = parseInt(document.getElementById("transactionAmount").value);

    document.getElementById("pendingTransactionsContainer").hidden = false;

    if (recipientsAddress !== "" && transactionAmount !== "") {
        // If both boxes have inputs, then create transaction & add it to the pendingTransactions array 
        const userTransaction = blockchain.createNewTransaction(transactionAmount, userAddress, recipientsAddress);
        blockchain.pendingTransactions.push(userTransaction);
        document.getElementById("successMessageTx").innerHTML = "Your transaction is in the mempool and will be included in the next block...";
    } else if (recipientsAddress === "" && transactionAmount !== "") {
        // If the recipient address is empty, show error Message
        document.getElementById("successMessageTx").innerHTML = "";
        document.getElementById("errorMessage").innerHTML = "Please type down the recipient's address to create the transaction..."
    } else if (recipientsAddress !== "" && transactionAmount === "") {
        // If the amount box is empty, show error message
        document.getElementById("successMessageTx").innerHTML = "";
        document.getElementById("errorMessage").innerHTML = "Please type down the amount you want to send to create the transaction..."
    } else {
        // If both boxes are empty, show error message
        document.getElementById("successMessageTx").innerHTML = "";
        document.getElementById("errorMessage").innerHTML = "Please type down both the recipient's address & the amount you want to send to create the transaction..."
    }

    // Loops through the pendingTransactions array and builds a table body based on the information retrieved
    function addPendingTransactions() {
        blockchain.pendingTransactions.forEach(transaction => {
            const pendingTransactionsTable = document.getElementById("newPendingTransactionTable");

            if (!document.getElementById("transactionId") || transaction.transactionId !== document.getElementById("transactionId").innerHTML) {
                let row = pendingTransactionsTable.insertRow();
                let transactionId = row.insertCell(0);
                transactionId.innerHTML = transaction.transactionId;
                transactionId.id = "transactionId";
                let txTimestamp = row.insertCell(1);
                txTimestamp.innerHTML = (new Date(transaction.txTimestamp)).toLocaleTimeString();
                let sender = row.insertCell(2);
                sender.innerHTML = transaction.sender;
                let recipient = row.insertCell(3);
                recipient.innerHTML = transaction.recipient;
                let amount = row.insertCell(4);
                amount.innerHTML = transaction.amount;
            } else {
                return;
            };
        });
    };

    addPendingTransactions();
});

document.getElementById("confirmTxBtn").addEventListener("click", () => {
    // Loop through the blockchain and retries a table with information on each block
    blockchain.chain.forEach(block => {
        const blockchainTable = document.getElementById("blockchainTable");

        let row = blockchainTable.insertRow();
        let height = row.insertCell(0);
        height.innerHTML = block.index;
        let hash = row.insertCell(1);
        hash.innerHTML = block.hash;
        let mined = row.insertCell(2);
        mined.innerHTML = `${timeSince(block.timestamp)} seconds ago`
        let miner = row.insertCell(3);
        miner.innerHTML = userAddress;
    });
});

document.getElementById("searchBtn").addEventListener("click", () =>{
    // Retrieve the value of the text box & option select
    let searchBlockchain = document.getElementById("searchBlockchain").value;
    let searchOptions = document.getElementById("searchOptions").value;
    
    // If option is block & box is NOT empty, loop through the blockchain to search for the correctBlock
    if  (searchBlockchain !== "" && searchOptions === "block") {
        let correctBlock = null;
        blockchain.chain.forEach(block => {
            if (searchBlockchain === block['hash']) {
                correctBlock = block;
            };
        });

        // Parse the correctBlock info into a table & show it IF the correctBlock is found
        document.getElementById("searchBlockNo").innerHTML = "Block " + correctBlock.index;
        document.getElementById("searchBlockIndex").textContent = correctBlock.index;
        document.getElementById("searchBlockTimestamp").textContent = new Date(correctBlock.timestamp); 
        document.getElementById("searchBlockTransactions").textContent = correctBlock.transactions.length;
        document.getElementById("searchPreviousBlockHash").textContent = correctBlock.previousBlockHash;
        document.getElementById("searchBlockHash").textContent = correctBlock.hash;
        document.getElementById("searchBlockNonce").textContent = correctBlock.nonce;

        // If option is transaction & text box is not empty
    } else if (searchBlockchain !== "" && searchOptions === "transaction") {
        let correctTransaction = null;
        let correctBlock = null;
        // Loop through the blockchain to find the correctBlock that contains the correctTransaction
        blockchain.chain.forEach(block => {
            block.transactions.forEach(transaction =>{
                if (searchBlockchain === transaction['transactionId']) {
                    correctTransaction = transaction;
                    correctBlock = block;
                };
            });
        });

        // Parse the correctTransaction info alongside a correctBlock.index into a table & shot it IF the correctTransaction is found
        document.getElementById("searchTransactionId").textContent = correctTransaction.transactionId;
        document.getElementById("searchTransactionDate").innerHTML = (new Date(correctTransaction.txTimestamp)).toLocaleTimeString();
        document.getElementById("searchTransactionSender").textContent = correctTransaction.sender;
        document.getElementById("searchTransactionRecipient").textContent = correctTransaction.recipient;
        document.getElementById("searchTransactionAmount").textContent = correctTransaction.amount;
        document.getElementById("searchTransactionBlockIndex").textContent = correctBlock.index;

        // If option is address & text box is not empty
    } else if (searchBlockchain !== "" && searchOptions === "address") {
        let addressTransaction = [];
        // Loop through the blockchain to find the correct blocks that may or may not contain the addressTransaction
        blockchain.chain.forEach(block => {
            block.transactions.forEach(transaction => {
                if (transaction.sender === searchBlockchain || transaction.recipient === searchBlockchain) {
                    addressTransaction.push(transaction);
                };
            });
        });
        
        // Initial balance of the addressTransaction
        let balance = 0;
        // Add or subtract to the balance based on the address location: sender or recipient
        addressTransaction.forEach(transaction => {
            if (transaction.recipient === searchBlockchain) {
                balance += transaction.amount;
            } else if (transaction.sender === searchBlockchain) {
                balance -= transaction.amount;
            };
        });

        // Loops through the addressTransaction array and parse the info into a table in multiple rows IF address is found
        addressTransaction.forEach(transaction => {
            const table = document.getElementById("newSearchAddressTransaction");
                
            let row = table.insertRow();
            let transactionId = row.insertCell(0);
            transactionId.innerHTML = transaction.transactionId;
            let txTimestamp = row.insertCell(1);
            txTimestamp.innerHTML = (new Date(transaction.txTimestamp)).toLocaleTimeString();
            let sender = row.insertCell(2);
            sender.innerHTML = transaction.sender;
            if (transaction.sender === searchBlockchain) {
                recipient.style.fontWeight = "bold";
            }
            let recipient = row.insertCell(3);
            recipient.innerHTML = transaction.recipient;
            if (transaction.recipient === searchBlockchain) {
                recipient.style.fontWeight = "bold";
            }
            let amount = row.insertCell(4);
            amount.innerHTML = transaction.amount;
        });

        // Parse total balance of the address searched
        document.getElementById("totalBalance").textContent = balance;

        // If text box is empty, return message to user
    } else if (searchBlockchain === "") {
        document.getElementById("errorMessageBlockExplorer").innerHTML = "Please type a block hash, a transaction ID, or an address to search the blockchain..."
        // If select value is the default/initial one, return message to user
    } else if (searchOptions === "default") {
        document.getElementById("errorMessageBlockExplorer").innerHTML = "Please select the block hash, the transaction ID, or the address option to search the blockchain..."
    }
});