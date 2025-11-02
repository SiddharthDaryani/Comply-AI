echo [$(date)]: "START"
echo [$(date)]: "creating env with python version 3.10"
conda create --prefix ./compenv python==3.10 -y
echo [$(date)]: "activating the environment"
source activate ./compenv
echo [$(date)]: "installing the dev requirements"
pip install -r requirements.txt
echo [$(date)]: "NOW RUNNIG at localhost"
# Launch API server with uvicorn
uvicorn api_server:app --host 0.0.0.0 --port 8000
echo [$(date)]: "ALL COMMANDS COMPLETED!!!"