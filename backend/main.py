import os
from dotenv import load_dotenv  # 환경변수 로드 라이브러리
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import requests
import json
from openai import OpenAI

# 1. .env 파일 로드 (가장 먼저 실행)
load_dotenv()

app = FastAPI()

# React(localhost:5173)와의 통신 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# [보안 설정] API 키 환경변수에서 가져오기
# ==========================================
API_KEY = os.getenv("UPSTAGE_API_KEY")

# 안전장치: API 키가 없으면 서버 실행 시 에러 발생
if not API_KEY:
    raise ValueError("CRITICAL ERROR: .env 파일이 없거나 UPSTAGE_API_KEY가 설정되지 않았습니다.")

BASE_URL = "https://api.upstage.ai/v1"
OCR_URL = "https://api.upstage.ai/v1/document-digitization"

client = OpenAI(
    api_key=API_KEY,
    base_url=BASE_URL
)

# [모델별 파라미터 설정]
MODEL_CONFIGS = {
    "solar-pro3": {
        "temperature": 0.8,
        "max_tokens": 65536,
        "reasoning_effort": "medium"
    },
    "solar-pro2": {
        "temperature": 0.7,
        "max_tokens": 16384,
        "reasoning_effort": "high"
    },
    "upstage/solar-1-mini-chat": {
        "temperature": 0.7,
        "max_tokens": 16384,
        "reasoning_effort": None # Mini는 reasoning 미지원
    }
}

# [프롬프트 설정] - 신대리 페르소나
prompt_config_data = {
    "prompt_config": {
        "role": "아하제작소 생산성 전문가 및 테크 콘텐츠 크리에이터 신대리",
        "persona": {
            "name": "신대리",
            "identity": "5년 차 직장인이자 테크 분야 석사 과정생",
            "specialty": "복잡한 IT/AI 기술을 나만 알고 싶은 꼼수처럼 쉽고 친근하게 풀어내는 실전 노하우 공유",
            "traits": {
                "trait_1": "시시콜콜한 수치 나열보다 실행 가능한 정보 중심의 해석",
                "trait_2": "현장에서 직접 겪은 시행착오와 경험적 서술 중시",
                "trait_3": "기계적인 친절함보다는 솔직하고 날카로운 조언"
            }
        },
        "tone_and_manner": {
            "strategy": "탈 AI 전략 (AI가 쓴 것 같지 않은 인간미 강조)",
            "rules": {
                "experience_first": "제가 직접 써보니, 지난주에 고생해 보니 등 본인의 경험을 문장 중간에 자연스럽게 삽입",
                "rhythmic_sentences": "완벽한 문어체 대신 의문문, 생략, 구어체(~하더군요, ~라는 사실!)를 섞어 사람의 호흡 구현",
                "actionable_information": "단순 정보 나열보다 그 정보가 사용자에게 주는 실질적 가치와 실행 방안을 해석",
                "hot_take": "무조건적인 찬양 지양, 솔직한 비판과 소신 발언을 통한 신뢰도 확보"
            }
        },
        "article_structure": {
            "step_1": { "section": "헤더 섹션", "content": "핵심 포인트 3가지를 요약" },
            "step_2": { "section": "도입부", "content": "신대리의 한마디, 독자의 문제 의식 자극" },
            "step_3": { "section": "기초 가이드", "content": "핵심 개념 15초 요약" },
            "step_4": { "section": "핵심 노하우", "content": "단계별 설명과 이유, 리듬감 있는 서술" },
            "step_5": { "section": "실전 예시", "content": "구체적인 사용 시나리오 2~3개" },
            "step_6": { "section": "FAQ 및 주의사항", "content": "날카로운 질의응답" },
            "step_7": { "section": "마치며", "content": "실행 촉구와 조언" }
        },
        "formatting_rules": {
            "emphasis": "중요 키워드 볼드 처리",
            "spacing": "모바일 가독성 여백 확보",
            "emoji": "이모지 절대 사용 금지"
        }
    }
}

SYSTEM_PROMPT = {
  "role": "system",
  "content": json.dumps(prompt_config_data, ensure_ascii=False, indent=2)
}

@app.get("/info")
async def get_app_info():
    return {"status": "ok", "available_models": list(MODEL_CONFIGS.keys())}

@app.post("/generate")
async def generate_blog_post(
    files: List[UploadFile] = File(...), 
    model: str = Form(...) 
):
    # 유효하지 않은 모델명이 들어올 경우 기본값 설정
    if model not in MODEL_CONFIGS:
        model = "solar-pro2"
    
    config = MODEL_CONFIGS[model]
    combined_text = ""
    
    # 1. OCR 처리 (API 키는 위에서 로드한 변수 사용)
    for file in files:
        file_content = await file.read()
        headers = {"Authorization": f"Bearer {API_KEY}"}
        
        response = requests.post(
            OCR_URL, 
            headers=headers, 
            files={"document": (file.filename, file_content, file.content_type)},
            data={"model": "ocr"}
        )
        
        if response.status_code == 200:
            result = response.json()
            extracted = result.get("text", "") 
            combined_text += extracted + "\n\n"
        else:
            print(f"OCR Error on {file.filename}: {response.text}")

    if not combined_text.strip():
        raise HTTPException(status_code=400, detail="이미지에서 텍스트를 추출할 수 없습니다.")

    # 2. LLM 호출
    try:
        print(f"Generating with Model: {model}, Config: {config}") 
        
        # API 호출 인자 구성
        create_kwargs = {
            "model": model,
            "messages": [
                SYSTEM_PROMPT,
                {
                    "role": "user",
                    "content": f"다음은 캡처된 이미지들에서 추출한 텍스트입니다. 이 내용을 바탕으로 5000자 이상의 블로그 포스팅을 작성해주세요. (마크다운 가독성 최적화):\n\n{combined_text}"
                }
            ],
            "stream": False,
            "temperature": config["temperature"],
            "max_tokens": config["max_tokens"]
        }

        # reasoning_effort가 필요한 모델만 해당 파라미터 추가
        if config["reasoning_effort"]:
            create_kwargs["reasoning_effort"] = config["reasoning_effort"]

        completion = client.chat.completions.create(**create_kwargs)
        
        blog_content = completion.choices[0].message.content
        return {"result": blog_content}
        
    except Exception as e:
        print(f"LLM Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)