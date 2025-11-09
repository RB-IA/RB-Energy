from fastapi import FastAPI
from openai import OpenAI
import os

app = FastAPI()
client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

WORKFLOW_ID = "wf_690f89e6ad3481908e6b3aaf13d73648023a37965a01916e"

@app.post("/api/chatkit/session")
def create_chatkit_session():
    """
    Creates a new ChatKit session for the BizScanFix Tier 1 Audit.
    The client_secret is returned for frontend initialization.
    """
    session = client.chatkit.sessions.create(
        workflow={"id": WORKFLOW_ID},
        # Optional: tag for analytics or session tracking
        metadata={"source": "bizscanfix_web_portal"}
    )

    return {"client_secret": session.client_secret}
