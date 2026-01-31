GitHub 리포지토리의 대문인 `README.md`에 들어갈 내용을 **전문적이고 상세하게** 작성해 드립니다.

이 내용을 그대로 복사해서 `README.md` 파일에 붙여넣으시면, 다른 개발자들이나 채용 담당자가 봤을 때 **"이 사람, 문서화까지 제대로 하는구나"** 라는 인상을 줄 수 있습니다.

---

# Ghostwriter (AI Blog Post Generator)

**Ghostwriter** is an AI-powered productivity tool designed to transform fragmented information from images into perfectly structured, engaging blog posts. Leveraging **Upstage's Document OCR** and **Solar LLMs**, it acts as your personal "Ghostwriter," converting raw visual data into professional content in seconds.

This project focuses on maximizing productivity for content creators by automating the most time-consuming parts of writing: extraction, structuring, and drafting. It features a unique persona-driven generation engine ("Shin Daeri") that produces human-like, experience-based articles.

---

**Ghostwriter**는 캡처된 이미지 속 텍스트를 추출하여, 전문적인 블로그 포스팅으로 자동 변환해주는 AI 생산성 도구입니다. **Upstage의 Document OCR**과 **Solar LLM**을 활용하여, 단순한 정보 나열이 아닌 '생산성 전문가 신대리' 페르소나가 적용된 완성도 높은 글을 작성합니다.

이 프로젝트는 정보 추출, 구조화, 초안 작성이라는 가장 시간이 많이 걸리는 작업을 자동화하여 콘텐츠 크리에이터의 생산성을 극대화하는 데 초점을 맞췄습니다.

---

## ✨ Key Features (주요 기능)

### 🚀 Core Functionality

* **Image-to-Blog Workflow**: Seamlessly extracts text from uploaded images or clipboard content (Ctrl+V) using high-performance OCR.
* **Multi-Model AI Selection**: Users can dynamically switch between AI models based on their needs:
* **Solar Pro 3**: Large-scale MoE model (102B) for high-quality, nuanced writing.
* **Solar Pro 2**: Optimized for logical reasoning and structured outputs.
* **Solar Mini**: Lightweight and fast, specialized for Korean/English efficiency.


* **Persona-Driven Generation**: Generates content using the "Shin Daeri" persona—an IT productivity expert. The output features a conversational tone, experience-based insights, and a logical structure (Header -> Intro -> Guide -> Examples -> FAQ).

### 💻 UI/UX Design

* **Modern Interface**: Clean, minimalist design inspired by financial apps (Toss), focusing on readability and usability.
* **Smart Preview System**: Features a responsive grid layout for image management and a **Lightbox** viewer to inspect original images with a backdrop blur effect.
* **One-Click Action**: Instant "Copy to Clipboard" functionality for the generated Markdown text.

---

### 🚀 핵심 기능

* **이미지 기반 자동 글쓰기**: 고성능 OCR을 통해 업로드하거나 붙여넣은(Ctrl+V) 이미지에서 텍스트를 추출하고, 이를 바탕으로 글을 작성합니다.
* **다양한 AI 모델 지원**: 상황에 맞춰 최적의 모델을 선택할 수 있습니다.
* **Solar Pro 3**: 102B 매개변수의 고성능 모델 (뉘앙스 및 퀄리티 중시)
* **Solar Pro 2**: 논리적 추론 능력이 강화된 모델 (구조적 글쓰기 중시)
* **Solar Mini**: 빠르고 효율적인 모델 (한국어/영어 최적화)


* **페르소나 기반 생성**: '생산성 전문가 신대리' 페르소나를 탑재하여, 기계적인 느낌 없이 경험담과 노하우가 녹아든 자연스러운 글을 작성합니다.

### 💻 UI/UX 디자인

* **현대적인 인터페이스**: 토스(Toss) 앱 스타일의 직관적이고 깔끔한 디자인을 적용했습니다.
* **스마트 미리보기**: 반응형 그리드 레이아웃과 **라이트박스(Lightbox)** 기능을 통해 원본 이미지를 편하게 확인할 수 있습니다.
* **사용자 편의성**: 생성된 마크다운 원고를 버튼 하나로 즉시 복사할 수 있습니다.

---

## 🛠️ Tech Stack (기술 스택)

### Frontend

* **React (Vite)**: Component-based UI architecture.
* **Tailwind CSS**: Utility-first CSS framework for rapid styling.
* **Axios**: Promise-based HTTP client for API requests.
* **Lucide React**: Beautiful & consistent icon pack.
* **React Markdown**: Safe and easy Markdown rendering.

### Backend

* **Python 3.10+**: Core programming language.
* **FastAPI**: High-performance web framework for building APIs.
* **Uvicorn**: ASGI web server implementation.
* **Python-multipart**: Handling file uploads.
* **OpenAI SDK**: Interface for Upstage Solar API.

### AI & Cloud API

* **OCR**: Upstage Document Digitization API.
* **LLM**: Upstage Solar API (Pro 3, Pro 2, Mini).

---

## 🔧 Installation & Setup (설치 및 실행)

### Prerequisites (준비물)

* Node.js & npm
* Python 3.10 or higher
* **Upstage API Key** (Get it from [Upstage Console](https://console.upstage.ai/))

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/ghostwriter.git
cd ghostwriter

```

### 2. Backend Setup

Create a virtual environment and install dependencies.

```bash
cd backend
# Create virtual environment (Recommended)
python -m venv venv
source venv/bin/activate  # Mac/Linux
# venv\Scripts\activate   # Windows

# Install dependencies
pip install python-dotenv fastapi uvicorn python-multipart requests openai

```

**Security Configuration (Crucial) / 보안 설정 (중요)**
Create a `.env` file in the `backend` directory and add your API Key.
`backend` 폴더 안에 `.env` 파일을 생성하고 API 키를 입력하세요.

```env
UPSTAGE_API_KEY=your_upstage_api_key_here

```

### 3. Frontend Setup

Install the necessary node modules.

```bash
cd ../frontend
npm install

```

---

## 🏃‍♂️ How to Run (실행 방법)

You need to run both the Backend and Frontend servers concurrently.
백엔드와 프론트엔드 서버를 각각 실행해야 합니다.

**Terminal 1: Backend**

```bash
cd backend
uvicorn main:app --reload

```

* Server runs at: `http://localhost:8000`

**Terminal 2: Frontend**

```bash
cd frontend
npm run dev

```

* App runs at: `http://localhost:5173`

---

## 📝 License

This project is licensed under the **MIT License**.

---

## ⚠️ Disclaimer

This project utilizes the Upstage API. Please ensure you comply with their usage policies. Do not expose your `.env` file or API keys in public repositories.
이 프로젝트는 Upstage API를 사용합니다. API 키가 포함된 `.env` 파일이 외부에 노출되지 않도록 각별히 주의해주세요.
