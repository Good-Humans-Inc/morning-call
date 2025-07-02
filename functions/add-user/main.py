import os
import functions_framework
import pytz
import phonenumbers
from datetime import datetime
from google.cloud import firestore
from flask import jsonify
import uuid

# --- Environment Variables & Clients ---
# This secret must be shared with the Google Apps Script.
AUTH_SECRET = os.environ.get("ADD_USER_SECRET")
db = firestore.Client()

@functions_framework.http
def add_user(request):
    """
    HTTP-triggered function to add a new user to Firestore from a Google Form.
    """
    # 1. Authenticate the request
    if request.headers.get("X-Auth-Secret") != AUTH_SECRET:
        return jsonify({"error": "Unauthorized"}), 401

    # 2. Parse and validate the incoming data
    request_json = request.get_json(silent=True)
    required_fields = ["name", "phoneNumber", "city", "timezone", "localCallTime"]
    if not request_json or not all(field in request_json for field in required_fields):
        return jsonify({"error": "Missing required fields in request body"}), 400

    name = request_json["name"]
    phone_number_raw = request_json["phoneNumber"]
    city = request_json["city"]
    timezone_str_from_form = request_json["timezone"]
    local_call_time_str = request_json["localCallTime"]

    # 3. Clean and Validate Phone Number
    try:
        # With form validation requiring a '+', we no longer need to assume a default region.
        # The number must be in E.164 format.
        parsed_number = phonenumbers.parse(phone_number_raw, None)
        if not phonenumbers.is_valid_number(parsed_number):
            raise ValueError("Invalid phone number.")
        e164_phone_number = phonenumbers.format_number(
            parsed_number, phonenumbers.PhoneNumberFormat.E164
        )
    except Exception as e:
        return jsonify({"error": f"Invalid phone number format: {e}"}), 400

    # 4. Perform Timezone and Time Conversion
    try:
        iana_timezone_str = timezone_str_from_form.split(' ')[0]
        user_timezone = pytz.timezone(iana_timezone_str)
        
        # Use datetime.strptime for a standardized "h:mm AM/PM" format
        parsed_time = datetime.strptime(local_call_time_str, "%I:%M %p")
        
        now_in_timezone = datetime.now(user_timezone)
        local_dt = now_in_timezone.replace(
            hour=parsed_time.hour, minute=parsed_time.minute, second=0, microsecond=0
        )
        
        utc_dt = local_dt.astimezone(pytz.utc)
        utc_call_time = utc_dt.strftime("%H:%M")

    except Exception as e:
        return jsonify({"error": f"Invalid timezone or time format: {e}"}), 400

    # 5. Save to Firestore
    try:
        user_id = str(uuid.uuid4())
        user_ref = db.collection("users").document(user_id)
        user_ref.set({
            "name": name,
            "phoneNumber": e164_phone_number, # Save the clean E.164 number
            "city": city,
            "timezone": iana_timezone_str,
            "localCallTime": local_call_time_str,
            "callTime": utc_call_time
        })
        print(f"Successfully created user {user_id} ({name}) with UTC call time {utc_call_time}")
        return jsonify({"success": True, "userId": user_id}), 201

    except Exception as e:
        print(f"Error creating user in Firestore: {e}")
        return jsonify({"error": "Failed to create user in database"}), 500
