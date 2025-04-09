const mongoose = require('mongoose');
const { Schema } = mongoose;

const message_db = require(process.cwd() + '/model/msg-model.js');


module.exports = function (app) {
    const connectToDatabase = async(maxRetries = 5, retryInterval = 5000, timeout = 10000) => {    
        let retries = 0
        const connect = async () => {
            try {
                if (!process.env.DB) throw new Error("Database URL (DB) is missing in environment variables.");

                const connectionPromise = await mongoose.connect(process.env.DB);
                const timeoutPromise = new Promise((_,reject) =>{
                    setTimeout(() => reject(new Error('Database connection timeout')) )
                })
                
                await Promise.race([connectionPromise,timeoutPromise])
                console.log('Database connected successfully');
                
                app.locals.message_db = message_db;
            
            } catch (error) {
                retries++;
                if (retries < maxRetries){
                    console.log(`Retrying to connect to the database in ${retryInterval / 1000} seconds...`);
                    setTimeout(connect, retryInterval);  // Retry after some time
                } else {
                    console.error('Max retries reached. Could not connect to the database.');
                    process.exit(1);  // Exit the process after failing to connect
                }
            }
        }
        connect()   
    }
    connectToDatabase()
};