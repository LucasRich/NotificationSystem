const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();
 
// -------------------------------------
//         NOTIFICATION TRIGGER
// -------------------------------------

exports.notification = functions.region('europe-west3').firestore.document('profiles/{profileId}/notification/{notificationId}').onCreate(async (snap, context) => {
    //GET NOTIFICATION DATA
  	let senderUserId = snap.data().senderUserId
  	let targetUserId = snap.data().targetUserId
  	let contentId = snap.data().contentId
    let code = snap.data().code
    
    //GET SENDER USER FIRSTNAME AND LASTNAME
    let senderProfileSnapshot = await db.collection('profiles').doc(senderUserId).get()
    let senderUserFirstname = senderUserProfileSnapshot.data().firstname
    let senderUserLastname = senderUserProfileSnapshot.data().lastname

    //GET TARGET USER TOKEN
    let targetProfileSnapshot = await db.collection('profiles').doc(targetUserId).get()
    let tokens = [targetProfileSnapshot.data().token]

    //SEND THE CORRECT NOTIFICATION BASED ON THE CODE
    switch (code) {
        case 1:
            sendPushNotification('New picture liked', `${senderUserFirstname} ${senderUserLastname} liked yout picture.`, tokens, code, contentId, senderUserId);
        break;

        case 2:
            sendPushNotification('New picture comment', `${senderUserFirstname} ${senderUserLastname} comment yout picture.`, tokens, code, contentId, senderUserId);
        break;

        case 23:
            sendPushNotification('New content', `Your friend ${senderUserFirstname} just post new picture.`, tokens, code, contentId, senderUserId);
        break;

        default:
            console.log(`Error, action code ${code} is not found.`);
    }
});

// -------------------------------------
//         CALLABLE FUNCTION
// -------------------------------------

exports.sendNotification = functions.region('europe-west3').https.onCall(async (data, context) => {
    let senderUserId = data.senderUserId
    let targetUserIdList = data.targetUserIdList
    let contentId = data.contentId
    let code = data.code

    for (let targetUserId of targetUserIdList) {
        if (senderUserId != targetUserId) {
            let id = db.collection('profiles').doc(targetUserId).collection('notification').doc().id

            admin.firestore().collection('profiles').doc(Doc.data().uid).collection('notification').doc(id).set({
                senderUserId: senderUserId,
                targetUserId: targetUserId,
                contentId: contentId,
                code: code,
                sendDate: new Date(),
                seen: false,
                id: id
            });
        }
    }
});


// -------------------------------------
//         UTILS FUNCTION
// -------------------------------------

async function sendNotification(title, body, tokens, code, contentId, userSenderId) {
    let message = {
      data: {
        code: '' + code,
        evendId: evendId,
        pictureId: pictureId,
        userSenderId: userSenderId,
      },

      //ADD THIS TO MANAGE NOTIFICATION CLIC ACTION ON ANDROID DEVICE
      android: {
            notification: {
                clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            },
      },
      notification: {
        title: title,
        body: body,
      },
      
      tokens: tokens,
    }
    admin.messaging().sendMulticast(message)
}