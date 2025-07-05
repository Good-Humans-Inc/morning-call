import os
import pytz
from datetime import datetime
from google.cloud import firestore
import functions_framework

# Updated imports for elevenlabs SDK v2.5.0+
from elevenlabs.client import ElevenLabs

# Import the modular data fetcher
from data_fetchers.weather import get_weather_for_cities

# TODO: Set these environment variables in your Cloud Function settings
ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY")
ELEVENLABS_AGENT_ID = os.environ.get("ELEVENLABS_AGENT_ID")
ELEVENLABS_PHONE_NUMBER_ID = os.environ.get("ELEVENLABS_PHONE_NUMBER_ID")

client = ElevenLabs(api_key=ELEVENLABS_API_KEY)
db = firestore.Client()

@functions_framework.cloud_event
def dispatch_calls(cloud_event):
    """
    Triggered by a Pub/Sub message. Orchestrates calls by:
    1. Finding users scheduled for a call.
    2. Pre-fetching all necessary data (e.g., weather).
    3. Making individual calls to each user immediately.
    
    NOTE: This uses individual calls for immediate execution and precise timing.
    When we scale in the future (>50 users per time slot), we should consider 
    switching to ElevenLabs batch calls API for better efficiency and rate limiting.
    Batch calls require scheduled_time_unix parameter for future scheduling.
    """
    now_utc = datetime.now(pytz.utc)
    current_time = now_utc.strftime("%H:%M")
    print(f"Checking for calls scheduled at: {current_time} UTC")

    # 1. Get all users for the current time
    users_ref = db.collection("users")
    query = users_ref.where(filter=firestore.FieldFilter("callTime", "==", current_time))
    users_to_call = list(query.stream())

    if not users_to_call:
        print("No users to call at this time.")
        return

    # 2. Pre-fetch weather data for all unique cities
    cities_to_fetch = {user.to_dict().get("city") for user in users_to_call if user.to_dict().get("city")}
    weather_forecasts = get_weather_for_cities(cities_to_fetch)

    # 3. Make individual calls to each user
    successful_calls = 0
    for user in users_to_call:
        user_data = user.to_dict()
        phone_number = user_data.get("phoneNumber")
        city = user_data.get("city")
        character_id = user_data.get("character") # e.g., 'love-and-deepspace-caleb'
        character_description = user_data.get("characterDescription") # The prompt with the user's name

        if not phone_number:
            print(f"Skipping user {user.id} due to missing phone number.")
            continue
        
        if not character_id or not character_description:
            print(f"Skipping user {user.id} due to missing character data.")
            continue

        # Fetch the character's voiceId from the 'characters' collection
        try:
            character_ref = db.collection("characters").document(character_id)
            character_doc = character_ref.get()
            if character_doc.exists:
                voice_id = character_doc.to_dict().get("voiceId")
            else:
                print(f"Character {character_id} not found for user {user.id}. Skipping.")
                continue
        except Exception as e:
            print(f"Error fetching character {character_id} for user {user.id}: {e}")
            continue

        if not voice_id or 'placeholder' in voice_id:
            print(f"Skipping user {user.id} due to missing or placeholder voiceId for character {character_id}.")
            continue

        try:
            # Make an immediate call using the conversational AI
            print(f"Making call to {user_data.get('name', 'User')} at {phone_number} with character {character_id} and voice {voice_id}")
            
            # As per the documentation, we should use the twilio.outbound_call method
            # and pass dynamic variables inside the conversation_initiation_client_data object.
            # The voice_id override also goes in this object, under the "tts" key.
            # Ref: https://elevenlabs.io/docs/conversational-ai/customization/overrides
            conversation_data = {
                "dynamic_variables": {
                    "user_id": user.id,
                    "user": user_data.get("name", "User"),
                    "user_city": city,
                    "todays_weather": weather_forecasts.get(city, "No data available."),
                    "character_description": character_description
                },
                "tts": {
                    "voice_id": voice_id
                }
            }

            call = client.conversational_ai.twilio.outbound_call(
                agent_id=ELEVENLABS_AGENT_ID,
                agent_phone_number_id=ELEVENLABS_PHONE_NUMBER_ID,
                to_number=phone_number,
                conversation_initiation_client_data=conversation_data,
            )
            
            print(f"Successfully initiated call for {user_data.get('name', 'User')}. Conversation ID: {call.conversation_id}")
            successful_calls += 1

        except Exception as e:
            print(f"Error making call to {user_data.get('name', 'User')} at {phone_number}: {e}")

    print(f"Finished dispatching calls. Successfully initiated {successful_calls} out of {len(users_to_call)} calls.")
