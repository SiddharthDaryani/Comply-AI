# Comply AI – Real-time Social Media Compliance Checker

## Comply AI instantly checks your LinkedIn or Twitter post drafts for compliance with your defined organizational or legal guidelines. It works as a browser extension, highlighting your draft box with a green or red outline (compliant/non-compliant), powered by a FastAPI backend and an LLM (via Groq API).
# Features

    Real-time feedback: See compliance results before posting, directly in the editor.

    Privacy-first: No posts are stored, all checks happen on your machine via locally running API.

    Customizable policy: Easily modify compliance rules to suit your organization.

Quickstart Setup
1. Clone the repository

bash
git clone https://github.com/your-username/comply-ai.git
cd comply-ai

2. Configure your environment variables

    Create a .env file in the project root:

    text
    GROQ_API_KEY=your_groq_api_key_here

    Never commit your .env to public repos.

3. Run the setup script

    Make sure you have Miniconda/Anaconda installed.

    Run the initialization script (recommended on Linux/macOS/WSL):

bash
chmod +x init_setup.sh
./init_setup.sh

This script:

    Creates a new conda environment (comply_ai_env) with Python 3.10

    Installs all required dependencies

    Launches the FastAPI server

On Windows CMD/PowerShell, run each command in the script manually. First, create and activate the conda env, then install with pip install -r requirements.txt and run the server.
4. Load the Chrome Extension

    In Chrome, go to chrome://extensions/

    Enable "Developer mode" (top right)

    Click "Load unpacked" and select the comply-ai-extension folder from this repo

5. Usage

    With the FastAPI server running on port 8000 (default), visit LinkedIn/Twitter and start typing a post.

    The extension will show a green box if your text is compliant, or red if non-compliant, as per your policy.

Troubleshooting

    If the box is yellow: the API server may not be running, or the key in .env is missing.

    If the overlay persists after closing the edit box, ensure you are using the latest content script.
