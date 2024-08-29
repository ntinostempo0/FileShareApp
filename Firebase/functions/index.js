const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { v4: uuidv4 } = require('uuid');

admin.initializeApp();

exports.createNewUser = functions.https.onRequest(async (req, res) => {
    
    // Set CORS headers for preflight requests
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');


    if (req.method !== 'POST') {
        // Send response to OPTIONS requests
        res.status(204).send('Request must be a POST method.');
        return;
    }

    try {
        const { email, password, displayName } = req.body;

        const userRecord = await admin.auth().createUser({
            email: email,
            password: password
        });


        // Create Document Here
        const user_details={
            'email':email,
            'display_name':displayName,
            'files':[]
          }
        await admin.firestore().collection('Users').doc(userRecord.uid).set(user_details);

        
        res.status(201).send({
            message: "User created successfully",
            user: userRecord
        });

    } catch (error) {
        console.error("Error creating new user:", error);
        res.status(500).send({
            message: "Failed to create user",
            error: error.message
        });
    }
});

exports.get_User_Details = functions.https.onRequest(async (req, res) => {

    console.log("heeere")
    // Set CORS headers for preflight requests
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    console.log("Seeeeeeeeeeeet")
    const uid = req.query.uid;

    console.log(uid)
  
    if (!uid) {
        res.status(400).send('UID is required');
        return;
    }
  
    try {

        // Reference to the user document in Firestore
        const userDoc = await admin.firestore().collection('Users').doc(uid).get(); 
  
        console.log(userDoc)
        console.log(userDoc.data())

        res.status(200).send(userDoc.data());
  
    } catch (error) {
        console.error('Error retrieving user details:', error);
        res.status(500).send(`Error retrieving user details: ${error.message}`);
    }
});


exports.uploadFile = functions.https.onRequest(async (req, res) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.status(204).send('');
        return;
    }

    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    try {
        // Extracting content type
        const contentType = req.headers['content-type'];

        // Extracting the file buffer (binary data)
        const fileBuffer = req.rawBody;

        // Extracting uid and keywords from query parameters
        const uid = req.query.uid;
        const docName = req.query.name;
        const keywords = req.query.keywords ? req.query.keywords.split(',') : []; // Split the keywords string into an array

        if (!fileBuffer || !uid || keywords.length === 0) {
            throw new Error('Missing required fields.');
        }

        const fileName = `${uuidv4()}.pdf`;
        const bucket = admin.storage().bucket();
        const file = bucket.file(fileName);

        // Upload file to Firebase Storage
        await file.save(fileBuffer, {
            metadata: {
                contentType: contentType,
                metadata: {
                    firebaseStorageDownloadTokens: uuidv4(),
                },
            },
        });

        const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media&token=${file.metadata.metadata.firebaseStorageDownloadTokens}`;

        // Save metadata to Firestore and get the document ID
        const docRef = await admin.firestore().collection('Files').add({
            url: downloadURL,
            name:docName,
            owner: uid,
            keywords: keywords, // Store the keywords array
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });


        // Store the document ID in the user's collection
        await admin.firestore().collection('Users').doc(uid).update({
            files: admin.firestore.FieldValue.arrayUnion(docRef.id)
        });

        res.status(200).send({ downloadURL, fileID: docRef.id });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).send({ error: error.message });
    }
});


exports.getFile = functions.https.onRequest(async (req, res) => {

    console.log("heeere")
    // Set CORS headers for preflight requests
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    


    console.log("Seeeeeeeeeeeet")
    const fid = req.query.fid;

    console.log(fid)
  
    if (!fid) {
        res.status(400).send('UID is required');
        return;
    }
  
    try {

        // Reference to the user document in Firestore
        const fileDoc = await admin.firestore().collection('Files').doc(fid).get(); 
  
        console.log(fileDoc)
        console.log(fileDoc.data())

        const {name,url} = fileDoc.data()

        res.status(200).send({'name':name,'url':url,'id':fid});
  
    } catch (error) {
        console.error('Error retrieving user details:', error);
        res.status(500).send(`Error retrieving user details: ${error.message}`);
    }
});


exports.getFilesByKeys = functions.https.onRequest(async (req, res) => {

    console.log("heeere")
    // Set CORS headers for preflight requests
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    const keys = req.query.keys ? req.query.keys.split(',') : []; // Split the keywords string into an array

    console.log(keys)

    if (keys.length === 0) {
        res.status(400).send('Keywords are required');
        return;
    }
  
    try {
        // Reference to the Files collection in Firestore
        const allFiles = await admin.firestore().collection('Files').get();
        const filesReturn = [];

        allFiles.forEach(doc => {
            const fileData = doc.data();
            const { keywords } = fileData;
            if (keywords && keywords.some(key => keys.includes(key))) {
                filesReturn.push(fileData);
            }
        });

        res.status(200).send(filesReturn);
  
    } catch (error) {
        console.error('Error retrieving files:', error);
        res.status(500).send(`Error retrieving files: ${error.message}`);
    }
});