//importing
import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import cors from "cors";

//app config
const app = express();
const port = process.env.port || 9000;

const pusher = new Pusher({
    appId: "1729595",
    key: "49ff8c1c45875ead577c",
    secret: "cadeb313ec12bfe75550",
    cluster: "ap2",
    useTLS: true
  });

//middleware
app.use(express.json());
app.use(cors());

//DB Config
const connection_url = 'mongodb+srv://sahilsinghiscool:JAvVRKvARIsrKTmR@cluster0.5qthifk.mongodb.net/Whatsapp-mern-backend?';

mongoose.connect(connection_url,{
    // useCreateIndex: true,
    // useNewUrlParser: true,
    // useUnifiedTopology: false
});

const db = mongoose.connection;

db.once("open", () => {
    console.log("DB connected");

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on('change',(change)=>{
        console.log('A change occured', change);

        if(change.operationType === 'insert'){
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted',
                {
                    name: messageDetails.name,
                    message: messageDetails.message,
                    timestamp: messageDetails.timestamp,
                    received: messageDetails.received,
                });
        } else{
            console.log('Error triggering Pusher')
        }
    });
});

// ????

//api routes
app.get('/',(req, res)=>res.status(200).send('hello world'));

app.get('/messages/sync', (req, res) => {
    Messages.find()
        .then(data => {
            res.status(200).send(data);
        })
        .catch(err => {
            res.status(500).send(err);
        });
});


app.post('/messages/new', (req, res) => {
    const dbMessage = req.body;

    Messages.create(dbMessage)
        .then(data => {
            res.status(201).send(data);
        })
        .catch(err => {
            res.status(500).send(err);
        });
});


//listen
app.listen(port,()=>console.log(`Listening on locallhost:${port}`));