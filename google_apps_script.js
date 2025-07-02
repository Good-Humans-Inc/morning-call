// This is Google Apps Script code, to be pasted into the script editor of your Google Form.

// --- Configuration ---
// 1. Replace with the URL of your deployed 'add-user' Cloud Function.
const FUNCTION_URL = 'https://add-user-ick4zvuzvq-uc.a.run.app'; 

// 2. Replace with the secret key you set as an environment variable for the 'add-user' function.
const SECRET = 'XFve8obR513QR4W4X5qTxP4UNERjH6';

/**
 * This function is triggered when the Google Form is submitted.
 * It packages the form responses and sends them to a secure Cloud Function.
 */
function onFormSubmit(e) {
  // Get the responses from the form submission event.
  const itemResponses = e.response.getItemResponses();
  
  // Assuming your form questions are in this order:
  // 1. Name
  // 2. Phone Number
  // 3. City + State/Country
  // 4. Preferred Local Call Time (e.g., 6:00 AM)
  // 5. Timezone
  
  const payload = {
    name: itemResponses[0].getResponse(),
    phoneNumber: itemResponses[1].getResponse(),
    city: itemResponses[2].getResponse(),
    localCallTime: itemResponses[3].getResponse(),
    timezone: itemResponses[4].getResponse()
  };

  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'headers': {
      'X-Auth-Secret': SECRET
    },
    'payload': JSON.stringify(payload),
    'muteHttpExceptions': true // Prevent Apps Script from halting on error, so we can log it.
  };

  try {
    const response = UrlFetchApp.fetch(FUNCTION_URL, options);
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();

    if (responseCode === 201) {
      console.log('Successfully created user: ' + responseBody);
    } else {
      console.error('Error creating user. Status: ' + responseCode + ', Response: ' + responseBody);
      // Optional: Send an email notification on failure
      // MailApp.sendEmail('your-email@example.com', 'Google Form Error', 'Failed to create user: ' + responseBody);
    }
  } catch (error) {
    console.error('Failed to invoke Cloud Function: ' + error.toString());
  }
}

/**
 * Converts a time string from "h:mm AM/PM" format to "HH:MM" 24-hour format.
 * @param {string} timeString The time string to convert (e.g., "7:30 AM").
 * @return {string} The time in 24-hour format (e.g., "07:30").
 */
function convertTo24Hour(timeString) {
  const [time, modifier] = timeString.split(' ');
  let [hours, minutes] = time.split(':');

  if (hours === '12') {
    hours = '00';
  }

  if (modifier === 'PM') {
    hours = parseInt(hours, 10) + 12;
  }

  // Pad with a leading zero if necessary
  if (parseInt(hours, 10) < 10) {
    hours = '0' + hours;
  }
  
  return `${hours}:${minutes}`;
} 