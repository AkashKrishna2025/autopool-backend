const axios = require('axios');
const db = require("../models");
const Notification = require("../models/notification.model")
const Users = db.users;
const { Storage } = require('@google-cloud/storage');

const getPaginate = function (data, total, page = 0, limit = 15) {
  const current_page = page;
  const total_page = Math.ceil(total / limit);

  return {
    is_error: false,
    data,
    meta: { total, current_page, total_page, per_page: limit },
  };
};

const AWS = require("aws-sdk");

const bucketName = process.env.BUCKETNAME;

const awsConfig = {
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET,
  region: process.env.AWS_REGION,
};

const S3 = new AWS.S3(awsConfig);

const firebase = require("firebase-admin");
const firebaseKey = require("../auto-pool-firebase-key.json");
firebase.initializeApp({
  credential: firebase.credential.cert(firebaseKey)
})

const storage = new Storage({keyFilename: 'auto-pool-firebase-key.json'});
const uploadToGCS = (fileData, fileName, mimetype) => {
  return new Promise((resolve, reject) => {
    const blob = storage.bucket(bucketName).file(fileName);
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: mimetype,
      },
      resumable: false, // small files -> false, large files -> true
    });

    blobStream.on('error', (err) => {
      console.error('Error uploading to GCS:', err);
      reject(err);
    });

    blobStream.on('finish', () => {
      const data = {};
      data.Location = `https://storage.googleapis.com/${bucketName}/${blob.name}`;
      resolve(data);
    });

    blobStream.end(fileData);
  });
};


//upload to s3
const uploadToS3 = (fileData, fileName, mimetype) => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: bucketName,
      Key: fileName,
      Body: fileData,
      ContentType: mimetype,
    };
    S3.upload(params, (err, data) => {
      if (err) {
        console.log(err);
        return reject(err);
      }
      console.log(data);
      return resolve(data);
    });
  });
};

const delteFromS3 = (fileName) => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: bucketName,
      Key: fileName,
    };
    S3.deleteObject(params, (err, data) => {
      if (err) {
        console.log(err);
        return reject(err);
      }
      console.log(data);
      return resolve(data);
    });
  });
};


function uploadFileToS3(filePath, fileName) {
  return new Promise((resolve, reject) => {
    const fileContent = fs.readFileSync(filePath);

    const params = {
      Bucket: process.env.AWS_BUCKETNAME,
      Key: fileName,
      Body: fileContent,
      ACL: "public-read", // Set the appropriate ACL for your use case
      ContentType: "image/jpeg", // Set the appropriate content type
    };

    s3.upload(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

const generateRandomStrings = function (length = 10) {
  let randomString = "";
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    const randomChar = chars.charAt(randomIndex);
    randomString += randomChar;
  }
  return randomString;
};

const generateSharedRideId = () => {
  const randomChars = Math.random().toString(36).substr(2, 10);
  const timestamp = Date.now().toString(36);
  const uniqueId = randomChars + timestamp;
  console.log({ randomChars, timestamp });
  return uniqueId;
}


const capitalizeLetter = function (string) {
  if (string != "") {
    const words = string.split(" ");
    const capitalizedWords = words.map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    });
    const capitalizedString = capitalizedWords.join(" ");
    return capitalizedString;
  } else {
    return string;
  }
};

const sendNotification = async (userId, notificationMsgRes, saveNotification = true, sendToMobile = false) => {
  try {
    let user = await Users.findOne({ _id: userId })
    if (user) {

      if (saveNotification) {
        const notification = new Notification({
          userId: userId._id,
          msg: notificationMsgRes?.msg,
          title: notificationMsgRes?.title
        });
        await notification.save();
      }

      if (sendToMobile && user?.firebase_token) {
        const message = {
          token: (user.firebase_token).toString(),
          notification: {
            title: notificationMsgRes?.title,
            body: notificationMsgRes?.msg,
          }
        }

        const firebaseResp = await firebase.messaging().send(message);
        console.log("firebase response  ----------- >", firebaseResp);
      }
    } else {
      console.log("Notification error no user id " + userId)
    }
  } catch (error) {
    console.error("Notification sending error -> ", error);
  }
};

const getNotification = async (ride) => {
  const rideNotifications = await Notification.find({
    userId: ride.userId._id,
    msg: { $regex: '.*ride.*' }
  });

  return rideNotifications
}

const getCurrentTimestamp = () => {
  const date = new Date();
  const timestamp = date.toISOString().replace('Z', `.${('000' + date.getMilliseconds()).slice(-3)}Z`);
  return timestamp;
}
const generateReceiptId = () => {
  const timestamp = Date.now().toString(36);
  const randomString = Math.random().toString(36).substr(2, 5); 
  return `${timestamp}-${randomString}`;
};

const secretKey = 'M4zBOP0fJ1TftXcQyKG0';
const senderId = 'SHRAUO';
const templateId = '1707172414800087723';

const sendOtpMessage = async (contactNumber, otp) => {
  try {
    // Format phone number - remove '+' if present
    const formattedNumber = contactNumber.replace('+', '');
    
    // Check SMS provider documentation for the exact URL format
    const url = 'https://sms.staticking.com/index.php/smsapi/httpapi/';
    
    // Approach 1: Standard parameters with template variable
    const params = {
      secret: secretKey,
      sender: senderId,
      tempid: templateId,
      receiver: formattedNumber,
      route: 'TA',
      msgtype: '1',
      var1: otp
    };
    
    console.log("Trying Approach 1 - Template with var1");
    console.log("SMS API Request URL:", url);
    console.log("SMS API Params:", JSON.stringify(params));
    
    // Make the request with URL parameters
    const response = await axios.get(url, { params });
    console.log('SMS API Response:', response.data);
    
    if (response.data && !response.data.includes("Invalid Parameters")) {
      return response.data;
    }
    
    // If Approach 1 fails, try Approach 2: Using 'text' instead of 'var1'
    console.log("Trying Approach 2 - Template with text parameter");
    const params2 = {
      secret: secretKey,
      sender: senderId,
      tempid: templateId,
      receiver: formattedNumber,
      route: 'TA',
      msgtype: '1',
      text: `Your OTP is ${otp}. Use this to verify your mobile number on ShareAuto. Valid for 5 minutes.`
    };
    
    console.log("SMS API Params:", JSON.stringify(params2));
    const response2 = await axios.get(url, { params: params2 });
    console.log('SMS API Response 2:', response2.data);
    
    if (response2.data && !response2.data.includes("Invalid Parameters")) {
      return response2.data;
    }
    
    // If Approach 2 fails, try Approach 3: No template, direct message
    console.log("Trying Approach 3 - Direct message without template");
    const params3 = {
      secret: secretKey,
      sender: senderId,
      receiver: formattedNumber,
      route: 'TA',
      msgtype: '1',
      sms: `Your OTP is ${otp}. Use this to verify your mobile number on ShareAuto. Valid for 5 minutes.`
    };
    
    console.log("SMS API Params:", JSON.stringify(params3));
    const response3 = await axios.get(url, { params: params3 });
    console.log('SMS API Response 3:', response3.data);
    
    return response3.data;
  } catch (error) {
    console.error('Error sending SMS:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
    return 'Failed to send SMS: ' + error.message;
  }
};

// Alternative implementation using POST instead of GET if needed


// const sendOtpMessageAlt = async (contactNumber, otp) => {
//   try {
//     const formattedNumber = contactNumber.replace('+', '');
//     const url = 'https://sms.staticking.com/index.php/smsapi/httpapi/';
    
//     // Try with POST method and form data
//     const formData = new URLSearchParams();
//     formData.append('secret', secretKey);
//     formData.append('sender', senderId);
//     formData.append('tempid', templateId);
//     formData.append('receiver', formattedNumber);
//     formData.append('route', 'TA');
//     formData.append('msgtype', '1');
//     formData.append('var1', otp.toString());
    
//     console.log("Trying POST method with form data");
//     const response = await axios.post(url, formData, {
//       headers: {
//         'Content-Type': 'application/x-www-form-urlencoded'
//       }
//     });
    
//     console.log('SMS API POST Response:', response.data);
//     return response.data;
//   } catch (error) {
//     console.error('Error in alternative SMS method:', error.message);
//     return 'Failed to send SMS (alt method): ' + error.message;
//   }
// };



module.exports = {
  getPaginate,
  uploadToS3,
  uploadToGCS,
  generateRandomStrings,
  generateSharedRideId,
  uploadFileToS3,
  delteFromS3,
  capitalizeLetter,
  sendNotification,
  getNotification,
  getCurrentTimestamp,
  generateReceiptId,
  sendOtpMessage
};
