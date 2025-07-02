import os
import time
import hmac
import functions_framework
from hashlib import sha256
from fastapi import FastAPI, Request, HTTPException, Response
from google.cloud import firestore
from pydantic import BaseModel
from typing import Any, Optional, Dict

# --- Environment Variables & Clients ---
ELEVENLABS_WEBHOOK_SECRET = os.environ.get("ELEVENLABS_WEBHOOK_SECRET")
db = firestore.Client()
app = FastAPI()

# --- Pydantic Models for type validation ---
class DynamicVariables(BaseModel):
    user_id: str

class ConversationInitiationClientData(BaseModel):
    dynamic_variables: DynamicVariables

class DataCollectionResults(BaseModel):
    user_personal_info: Optional[str] = None
    user_feeling: Optional[str] = None
    sleep_quality: Optional[str] = None
    daily_agenda: Optional[str] = None

class Analysis(BaseModel):
    transcript_summary: str
    call_successful: Optional[bool] = None
    evaluation_criteria_results: Optional[Dict[str, Any]] = {}
    data_collection_results: Optional[DataCollectionResults] = None

class WebhookData(BaseModel):
     conversation_id: str
     agent_id: str
     analysis: Analysis
     conversation_initiation_client_data: ConversationInitiationClientData

class WebhookPayload(BaseModel):
    data: WebhookData


# --- Webhook Processing ---
@app.post("/")
async def process_summary_webhook(request: Request):
    """
    Handles the post-call webhook from ElevenLabs to save a call summary.
    This function acts as a router for different agents.
    """
    if ELEVENLABS_WEBHOOK_SECRET:
        await authenticate_webhook(request)

    try:
        payload = await request.json()
        validated_payload = WebhookPayload(**payload)
        
        data = validated_payload.data
        agent_id = data.agent_id

        # --- Agent-Based Routing ---
        if agent_id == os.environ.get("MORNING_CALL_AGENT_ID"):
            await process_morning_call(data)
        else:
            print(f"Received webhook from unhandled agent_id: {agent_id}")

    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Unable to process webhook payload: {e}")

    return Response(content='{"status": "received"}', media_type="application/json", status_code=200)

async def process_morning_call(data: WebhookData):
    """Processes and saves data specifically from the Morning Call agent."""
    try:
        analysis = data.analysis
        user_id = data.conversation_initiation_client_data.dynamic_variables.user_id
        conversation_id = data.conversation_id

        summary_ref = db.collection("call_summaries").document(conversation_id)
        
        # Create a dictionary of the data to save, starting with the basics
        data_to_save = {
            "userId": user_id,
            "createdAt": firestore.SERVER_TIMESTAMP,
            "transcriptSummary": analysis.transcript_summary,
            "callSuccessful": analysis.call_successful,
            "evaluationCriteria": analysis.evaluation_criteria_results,
        }

        # Add the structured data collection results if they exist
        if analysis.data_collection_results:
            data_to_save.update({
                "userPersonalInfo": analysis.data_collection_results.user_personal_info,
                "userFeeling": analysis.data_collection_results.user_feeling,
                "sleepQuality": analysis.data_collection_results.sleep_quality,
                "dailyAgenda": analysis.data_collection_results.daily_agenda,
            })

        summary_ref.set(data_to_save)
        
        print(f"Successfully saved summary for conversation {conversation_id}")
    except Exception as e:
        print(f"Error saving morning call summary to Firestore: {e}")
        # We raise an HTTPException to ensure the webhook call fails and we get alerted.
        raise HTTPException(status_code=500, detail="Failed to save summary to database.")

async def authenticate_webhook(request: Request):
    """
    Authenticates the incoming webhook request from ElevenLabs using HMAC.
    """
    signature_header = request.headers.get("elevenlabs-signature")
    if not signature_header:
        raise HTTPException(status_code=401, detail="Missing ElevenLabs-Signature header.")

    try:
        parts = signature_header.split(',')
        timestamp_str = next((p[2:] for p in parts if p.startswith('t=')), None)
        signature = next((p[3:] for p in parts if p.startswith('v0=')), None)

        if not timestamp_str or not signature:
            raise HTTPException(status_code=401, detail="Invalid signature format.")

        timestamp = int(timestamp_str)
        if int(time.time()) - timestamp > 300: # 5 minute tolerance
            raise HTTPException(status_code=403, detail="Webhook timestamp expired.")

        payload_body = await request.body()
        signed_payload = f"{timestamp}.{payload_body.decode('utf-8')}"
        
        expected_signature = hmac.new(
            key=ELEVENLABS_WEBHOOK_SECRET.encode('utf-8'),
            msg=signed_payload.encode('utf-8'),
            digestmod=sha256
        ).hexdigest()

        if not hmac.compare_digest(signature, expected_signature):
            raise HTTPException(status_code=401, detail="Signature mismatch.")

    except Exception as e:
         raise HTTPException(status_code=401, detail=f"Webhook authentication failed: {e}")

@functions_framework.http
def main(request: Request):
    """
    Main entry point for the Cloud Function.
    Delegates requests to the FastAPI app for processing.
    """
    return functions_framework.adapter(app)(request)
