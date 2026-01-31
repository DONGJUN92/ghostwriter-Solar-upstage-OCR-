import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { 
  Upload, X, FileText, Loader2, Sparkles, Copy, Check, Cpu, 
  Maximize2, ChevronDown, History, Trash2, Clock 
} from 'lucide-react';

// [상수] 로컬 스토리지 키
const STORAGE_KEY = 'ghostwriter_history_v1';

const AVAILABLE_MODELS = [
  { id: 'solar-pro3', name: 'Solar Pro 3 (Powerful MoE 102B)' },
  { id: 'solar-pro2', name: 'Solar Pro 2 (Reasoning High)' },
  { id: 'upstage/solar-1-mini-chat', name: 'Solar Mini (Efficient KO/EN)' },
];

function App() {
  // --- 기존 상태 ---
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id);
  const [selectedImage, setSelectedImage] = useState(null);

  // --- [NEW] History 관련 상태 ---
  const [history, setHistory] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // 초기 로드: 로컬 스토리지에서 히스토리 불러오기
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // 초기 설정: 탭 이름
  useEffect(() => {
    document.title = "Ghostwriter";
  }, []);

  // --- 헬퍼 함수: 첫 문장 추출 (Markdown 제거) ---
  const extractFirstSentence = (markdownText) => {
    if (!markdownText) return "제목 없음";
    // 1. 헤더(#), 볼드(**) 등 마크다운 문법 제거하고 순수 텍스트만 추출
    const plainText = markdownText
      .replace(/[#*`]/g, '') // 특수문자 제거
      .replace(/\n+/g, ' ')  // 줄바꿈을 공백으로
      .trim();
    
    // 2. 첫 문장 찾기 (. ! ? 로 끝나는 지점)
    const match = plainText.match(/[^.!?]+[.!?]/);
    return match ? match[0] : plainText.substring(0, 40) + "...";
  };

  // --- 파일 관련 로직 (기존 유지) ---
  const addFiles = useCallback((newFiles) => {
    const processedFiles = newFiles.map(file => ({
      file,
      id: crypto.randomUUID(),
      preview: URL.createObjectURL(file)
    }));
    setFiles((prev) => [...prev, ...processedFiles]);
  }, []);

  const handleFileUpload = (e) => {
    const uploadedFiles = Array.from(e.target.files);
    addFiles(uploadedFiles);
    e.target.value = '';
  };

  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData.items;
      const imageFiles = [];
      for (let item of items) {
        if (item.type.indexOf("image") !== -1) {
          imageFiles.push(item.getAsFile());
        }
      }
      if (imageFiles.length > 0) addFiles(imageFiles);
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [addFiles]);

  const removeFile = (idToRemove) => {
    setFiles(prevFiles => {
      const targetFile = prevFiles.find(f => f.id === idToRemove);
      if (targetFile) URL.revokeObjectURL(targetFile.preview);
      return prevFiles.filter(f => f.id !== idToRemove);
    });
    if (selectedImage && selectedImage.id === idToRemove) setSelectedImage(null);
  };

  // --- [NEW] 히스토리 저장 함수 ---
  const saveToHistory = (generatedText, modelName) => {
    const newEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      summary: extractFirstSentence(generatedText), // 첫 문장 추출
      content: generatedText,
      model: modelName
    };

    const newHistory = [newEntry, ...history];
    setHistory(newHistory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
  };

  // --- [NEW] 히스토리 삭제 함수 ---
  const deleteHistoryItem = (e, id) => {
    e.stopPropagation(); // 부모 클릭 이벤트 방지
    const newHistory = history.filter(item => item.id !== id);
    setHistory(newHistory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
  };

  // --- [NEW] 히스토리 불러오기 ---
  const loadHistoryItem = (item) => {
    setResult(item.content);
    setIsHistoryOpen(false); // 사이드바 닫기
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); // 결과 위치로 스크롤
  };

  // 블로그 글 생성 요청
  const handleGenerate = async () => {
    if (files.length === 0) return;

    setIsLoading(true);
    setResult(null);
    setIsCopied(false);

    const formData = new FormData();
    files.forEach(({ file }) => formData.append('files', file));
    formData.append('model', selectedModel);

    try {
      const response = await axios.post('http://localhost:8000/generate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const generatedText = response.data.result;
      setResult(generatedText);
      
      // [NEW] 성공 시 히스토리에 자동 저장
      const modelName = AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name;
      saveToHistory(generatedText, modelName);

      files.forEach(f => URL.revokeObjectURL(f.preview));
      setFiles([]); 
      
    } catch (error) {
      console.error("Error generating blog:", error);
      alert("글 생성 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); 
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-10 px-4 font-sans bg-[#F2F4F6] relative">
      
      {/* [NEW] 좌측 상단 History 아이콘 */}
      <div className="absolute top-6 left-6 z-30">
        <button 
          onClick={() => setIsHistoryOpen(true)}
          className="p-3 bg-white rounded-full shadow-md hover:shadow-lg text-gray-600 hover:text-toss-blue transition-all"
          title="기록 보기"
        >
          <History className="w-6 h-6" />
        </button>
      </div>

      {/* [NEW] History 사이드바 (슬라이드 오버) */}
      <div className={`fixed inset-0 z-40 flex ${isHistoryOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        {/* 배경 (클릭 시 닫힘) */}
        <div 
          className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${isHistoryOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsHistoryOpen(false)}
        />
        
        {/* 사이드바 패널 */}
        <div className={`relative w-80 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col transition-transform duration-300 transform ${isHistoryOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-[#191F28] flex items-center gap-2">
              <History className="w-5 h-5 text-toss-blue" />
              작성 기록
            </h2>
            <button onClick={() => setIsHistoryOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {history.length === 0 ? (
              <div className="text-center text-gray-400 mt-10 text-sm">
                아직 작성된 글이 없습니다.
              </div>
            ) : (
              history.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => loadHistoryItem(item)}
                  className="group relative p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-toss-blue hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="pr-6">
                    {/* 첫 문장 표시 */}
                    <h3 className="text-sm font-bold text-[#333D4B] line-clamp-2 mb-1.5 leading-snug">
                      {item.summary}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-[#8B95A1]">
                      <span className="bg-white px-1.5 py-0.5 rounded border border-gray-200">
                        {item.model?.split('(')[0] || 'AI'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* 삭제 버튼 */}
                  <button 
                    onClick={(e) => deleteHistoryItem(e, item.id)}
                    className="absolute top-3 right-3 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* --- 기존 헤더 영역 --- */}
      <header className="mb-8 text-center flex flex-col items-center animate-fade-in">
        <h1 className="text-3xl font-bold mb-2 text-[#191F28]">Ghostwriter</h1>
        <p className="text-[#8B95A1] mb-4">이미지만 넣으세요. 글은 신대리가 씁니다.</p>
        
        {/* 모델 선택 드롭다운 (기존 유지) */}
        <div className="relative group z-10">
            <div className="flex items-center gap-2 bg-white pl-3 pr-8 py-2 rounded-full border border-gray-200 shadow-sm hover:border-toss-blue transition-colors cursor-pointer">
                <Cpu className="w-4 h-4 text-toss-blue" />
                <span className="text-xs font-bold text-[#4E5968]">AI Model:</span>
                <select 
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none"
                >
                    {AVAILABLE_MODELS.map(model => (
                        <option key={model.id} value={model.id}>{model.name}</option>
                    ))}
                </select>
                <span className="text-sm font-semibold text-toss-blue whitespace-nowrap">
                    {AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name}
                </span>
                <ChevronDown className="absolute right-3 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
        </div>
      </header>

      {/* --- 메인 컨텐츠 카드 (기존 유지) --- */}
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-lg p-6 md:p-8 transition-all">
        {files.length === 0 && (
           <div className="mb-6">
           <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-50 hover:border-toss-blue transition-all bg-white group">
             <div className="flex flex-col items-center justify-center pt-5 pb-6">
               <Upload className="w-10 h-10 text-[#B0B8C1] group-hover:text-toss-blue mb-3 transition-colors" />
               <p className="mb-1 text-sm text-[#333D4B] font-bold group-hover:text-toss-blue transition-colors">클릭해서 업로드하거나</p>
               <p className="text-xs text-[#8B95A1]">이미지를 복사(Ctrl+C) 후 붙여넣기(Ctrl+V) 하세요</p>
             </div>
             <input id="file-upload" type="file" multiple className="hidden" onChange={handleFileUpload} accept="image/*" />
           </label>
         </div>
        )}

        {files.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-3 px-1">
                <h3 className="text-sm font-bold text-[#333D4B]">선택된 이미지 ({files.length})</h3>
                <label htmlFor="file-upload-add" className="text-xs text-toss-blue font-semibold cursor-pointer hover:underline">
                    + 추가하기
                    <input id="file-upload-add" type="file" multiple className="hidden" onChange={handleFileUpload} accept="image/*" />
                </label>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {files.map((fileData) => (
                <div key={fileData.id} className="relative group rounded-2xl overflow-hidden aspect-square border border-gray-200 bg-gray-50 cursor-pointer shadow-sm hover:shadow-md transition-shadow">
                  <img 
                    src={fileData.preview} 
                    alt="preview" 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onClick={() => setSelectedImage(fileData)}
                  />
                   <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10 pointer-events-none flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Maximize2 className="w-6 h-6 text-white drop-shadow-lg" />
                   </div>
                  <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        removeFile(fileData.id);
                    }} 
                    className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-[#4E5968] hover:text-red-500 hover:bg-white transition-all shadow-sm z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={files.length === 0 || isLoading}
          className={`w-full py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center transition-all transform active:scale-[0.98]
            ${files.length === 0 || isLoading ? 'bg-[#D1D6DB] cursor-not-allowed' : 'bg-toss-blue hover:bg-[#1B64DA] shadow-md hover:shadow-lg'}
          `}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span className="truncate max-w-[80%]">
                {AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name.split('(')[0].trim()}로 작성 중...
              </span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              블로그 글 생성하기
            </>
          )}
        </button>
      </div>

      {/* --- 결과 출력 영역 (기존 유지) --- */}
      {result && (
        <div className="w-full max-w-3xl mt-8 bg-white rounded-3xl shadow-lg p-8 animate-fade-in-up">
          <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2">
              <FileText className="text-toss-blue" />
              <h2 className="text-xl font-bold text-[#191F28]">생성된 블로그 초안</h2>
            </div>
            
            <button 
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#4E5968] bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-green-600">복사됨!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>복사</span>
                </>
              )}
            </button>
          </div>
          
          <div className="prose prose-slate max-w-none prose-headings:font-bold prose-h1:text-2xl prose-p:text-[#333D4B] prose-li:text-[#333D4B] prose-strong:text-[#191F28] prose-img:rounded-2xl">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* --- 라이트박스 모달 (기존 유지) --- */}
      {selectedImage && (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in"
            onClick={() => setSelectedImage(null)}
        >
            <button 
                onClick={() => setSelectedImage(null)}
                className="absolute top-5 right-5 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 p-2 rounded-full transition-all z-10"
            >
                <X className="w-8 h-8" />
            </button>
            <div 
                className="relative max-w-5xl w-full max-h-full flex items-center justify-center p-2"
                onClick={(e) => e.stopPropagation()}
            >
                <img 
                    src={selectedImage.preview} 
                    alt="original" 
                    className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl animate-zoom-in"
                />
            </div>
        </div>
      )}

    </div>
  );
}

export default App;