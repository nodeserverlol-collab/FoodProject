# test_basic.py
from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
import uvicorn

app = FastAPI()

@app.get("/ping")
async def ping():
    return {"message": "pong", "status": "ok"}

@app.get("/check_cookie")
async def check_cookie(request: Request):
    token = request.cookies.get("access_token")
    return {"has_token": token is not None, "token": token[:20] if token else None}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3000)