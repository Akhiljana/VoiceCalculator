import os
from fastapi import FastAPI, Depends, Request
from fastapi.responses import HTMLResponse, FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from config import settings
from database import get_db, CalculationHistory
from calculator import calculator
from logging_config import logger

app = FastAPI(title="Voice Calculator")

class CalcRequest(BaseModel):
    expression: str

class CalcResponse(BaseModel):
    expression: str
    result: str
    error: str = None

@app.get("/", response_class=HTMLResponse)
async def index():
    with open("index.html", "r", encoding="utf-8") as f:
        return f.read()

@app.get("/style.css")
async def css():
    return FileResponse("style.css")

@app.get("/app.js")
async def js():
    return FileResponse("app.js")

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/calculate", response_model=CalcResponse)
async def calculate(req: CalcRequest, db: Session = Depends(get_db)):
    logger.info(f"Received expression: {req.expression}")
    try:
        result = calculator.evaluate(req.expression)
        hist = CalculationHistory(expression=req.expression, result=result)
        db.add(hist)
        db.commit()
        db.refresh(hist)
        return CalcResponse(expression=req.expression, result=result)
    except ValueError as e:
        logger.warning(f"Calculation error: {e}")
        return CalcResponse(expression=req.expression, result="", error=str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return CalcResponse(expression=req.expression, result="", error="An unexpected error occurred.")

@app.get("/history")
async def get_history(db: Session = Depends(get_db)):
    records = db.query(CalculationHistory).order_by(CalculationHistory.timestamp.desc()).limit(20).all()
    return [{"expression": r.expression, "result": r.result, "time": r.timestamp.strftime("%H:%M:%S")} for r in records]

@app.delete("/history")
async def clear_history(db: Session = Depends(get_db)):
    db.query(CalculationHistory).delete()
    db.commit()
    return {"status": "cleared"}
