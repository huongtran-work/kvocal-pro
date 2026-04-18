'use client';

import { useState, useRef, useEffect } from 'react';
import { Loader2, Volume2, Mic, Square, Award, List, Edit3, ChevronDown } from 'lucide-react';
import { AudioPlayer } from '@/lib/audioUtils';
import { useAuth } from '@/contexts/AuthContext';

export type AnnotatedWord = {
  word: string;
  pronounced: string;
  rule: string;
  explanation: string;
};

export type LessonData = {
  originalText: string;
  pronouncedText: string;
  translation: string;
  annotatedWords: AnnotatedWord[];
};

const LEVELS = [
  { id: 'beginner', label: 'Sơ cấp', color: 'bg-emerald-600', lightColor: 'bg-emerald-50', textColor: 'text-emerald-700', borderColor: 'border-emerald-200', ring: 'ring-emerald-400' },
  { id: 'intermediate', label: 'Trung cấp', color: 'bg-blue-600', lightColor: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200', ring: 'ring-blue-400' },
  { id: 'advanced', label: 'Cao cấp', color: 'bg-purple-600', lightColor: 'bg-purple-50', textColor: 'text-purple-700', borderColor: 'border-purple-200', ring: 'ring-purple-400' },
];

const TOPICS_BY_LEVEL: Record<string, { id: string; title: string }[]> = {
  beginner: [
    { id: 'beg-1', title: 'Giới thiệu bản thân' },
    { id: 'beg-2', title: 'Mua sắm ở chợ' },
    { id: 'beg-3', title: 'Gọi món ở nhà hàng' },
    { id: 'beg-4', title: 'Hỏi đường đi' },
    { id: 'beg-5', title: 'Sở thích cá nhân' },
    { id: 'beg-6', title: 'Gia đình của tôi' },
    { id: 'beg-7', title: 'Thời tiết hôm nay' },
    { id: 'beg-8', title: 'Lịch trình hàng ngày' },
    { id: 'beg-9', title: 'Kế hoạch cuối tuần' },
    { id: 'beg-10', title: 'Đi khám bệnh' },
  ],
  intermediate: [
    { id: 'int-1', title: 'Đổi và trả hàng' },
    { id: 'int-2', title: 'Mở tài khoản ngân hàng' },
    { id: 'int-3', title: 'Đặt vé và phòng khách sạn' },
    { id: 'int-4', title: 'Xin lỗi và giải thích lý do' },
    { id: 'int-5', title: 'Miêu tả tính cách' },
    { id: 'int-6', title: 'Kinh nghiệm học ngoại ngữ' },
    { id: 'int-7', title: 'Ưu nhược điểm sống ở phố' },
    { id: 'int-8', title: 'Kể về kỷ niệm đáng nhớ' },
    { id: 'int-9', title: 'Thói quen ăn uống & sức khỏe' },
    { id: 'int-10', title: 'Tham gia câu lạc bộ' },
    { id: 'int-11', title: 'Phỏng vấn xin việc' },
    { id: 'int-12', title: 'Chuẩn bị cho kỳ thi' },
    { id: 'int-13', title: 'Lễ hội truyền thống Hàn Quốc' },
    { id: 'int-14', title: 'Công việc tình nguyện' },
    { id: 'int-15', title: 'Sử dụng mạng xã hội' },
    { id: 'int-16', title: 'Kế hoạch du lịch nước ngoài' },
    { id: 'int-17', title: 'Thuê nhà và chuyển nhà' },
    { id: 'int-18', title: 'Giải quyết mâu thuẫn bạn bè' },
    { id: 'int-19', title: 'Văn hóa nhà ở Hàn Quốc' },
    { id: 'int-20', title: 'Văn hóa công sở Hàn Quốc' },
  ],
  advanced: [
    { id: 'adv-1', title: 'Vấn đề môi trường hiện đại' },
    { id: 'adv-2', title: 'Sự phát triển của trí tuệ nhân tạo' },
    { id: 'adv-3', title: 'Tỷ lệ sinh thấp và già hóa dân số' },
    { id: 'adv-4', title: 'Tầm quan trọng của giáo dục suốt đời' },
    { id: 'adv-5', title: 'Năng lực truyền thông trong thời đại số' },
    { id: 'adv-6', title: 'Đa dạng văn hóa và sự chung sống' },
    { id: 'adv-7', title: 'Tiêu dùng và sản xuất bền vững' },
    { id: 'adv-8', title: 'Sức khỏe tâm thần trong xã hội hiện đại' },
    { id: 'adv-9', title: 'Trách nhiệm đạo đức của khoa học công nghệ' },
    { id: 'adv-10', title: 'Giá trị cốt lõi của dân chủ' },
  ],
};

export function TopicLessons() {
  const { user } = useAuth();
  const [level, setLevel] = useState('beginner');
  const [activeTopic, setActiveTopic] = useState('beg-1');
  const [lessons, setLessons] = useState<Record<string, LessonData>>({});
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(false);
  const [error, setError] = useState('');
  const [mobileTopicsOpen, setMobileTopicsOpen] = useState(false);

  const [activeMode, setActiveMode] = useState<'none' | 'full' | 'sentence'>('none');
  const [selectedSentence, setSelectedSentence] = useState('');
  const [customSentenceInput, setCustomSentenceInput] = useState('');

  const [isRecording, setIsRecording] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<{ score: number; feedback: string } | null>(null);

  const [progress, setProgress] = useState<Record<string, { bestScore: number; completed: boolean; attempts: number }>>({});

  const playerRef = useRef<AudioPlayer | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const evalTextRef = useRef('');

  const currentLesson = lessons[activeTopic];
  const currentLevelData = LEVELS.find(l => l.id === level);
  const currentTopicTitle = TOPICS_BY_LEVEL[level]?.find(t => t.id === activeTopic)?.title ?? '';

  useEffect(() => {
    if (!user) return;
    fetch('/api/user/progress')
      .then(r => r.json())
      .then((data: Array<{ topicId: string; bestScore: number; completed: boolean; attempts: number }>) => {
        if (Array.isArray(data)) {
          const map: Record<string, { bestScore: number; completed: boolean; attempts: number }> = {};
          data.forEach(p => { map[p.topicId] = p; });
          setProgress(map);
        }
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (activeTopic && !lessons[activeTopic] && !loadingLesson) {
      fetchLesson(activeTopic);
    }
    setActiveMode('none');
    setIsRecording(false);
    setEvaluation(null);
    setSelectedSentence('');
    setCustomSentenceInput('');
    setMobileTopicsOpen(false);
  }, [activeTopic, level]);

  const fetchLesson = async (topicId: string) => {
    setLoadingLesson(true);
    setError('');
    try {
      const res = await fetch(`/api/lessons/${topicId}`);
      if (res.ok) {
        const data = await res.json();
        setLessons(prev => ({ ...prev, [topicId]: data }));
        return;
      }
      const levelLabel = LEVELS.find(l => l.id === level)?.label || 'Sơ cấp';
      const topicTitle = TOPICS_BY_LEVEL[level]?.find(t => t.id === topicId)?.title || '';
      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId, topicTitle, levelLabel }),
      });
      if (!genRes.ok) throw new Error('Failed to generate lesson');
      const data = await genRes.json();
      setLessons(prev => ({ ...prev, [topicId]: data }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải bài học. Vui lòng thử lại.';
      setError(message);
    } finally {
      setLoadingLesson(false);
    }
  };

  const playAudio = async (text: string) => {
    if (!text || playingAudio) return;
    setPlayingAudio(true);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error('TTS failed');
      const { audio } = await res.json();
      if (audio) {
        if (!playerRef.current) playerRef.current = new AudioPlayer();
        const duration = playerRef.current.playBase64Pcm(audio);
        setTimeout(() => setPlayingAudio(false), duration * 1000 + 500);
      } else {
        setPlayingAudio(false);
      }
    } catch {
      setPlayingAudio(false);
    }
  };

  const getSentences = (text: string) => {
    if (!text) return [];
    const matches = text.match(/[^.!?]+[.!?]*/g);
    return matches ? matches.map(s => s.trim()).filter(s => s.length > 0) : [text];
  };

  const startRecording = async (textToEvaluate: string) => {
    evalTextRef.current = textToEvaluate;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await evaluateAudio(audioBlob);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
      setEvaluation(null);
    } catch {
      alert('Không thể truy cập micro. Vui lòng kiểm tra quyền truy cập.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const evaluateAudio = async (audioBlob: Blob) => {
    setEvaluating(true);
    try {
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') resolve(reader.result.split(',')[1]);
          else reject(new Error('Failed to convert'));
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: base64Audio,
          mimeType: audioBlob.type || 'audio/webm',
          evalText: evalTextRef.current,
          topicId: activeTopic,
        }),
      });
      if (!res.ok) throw new Error('Evaluation failed');
      const result = await res.json();
      setEvaluation(result);
      setProgress(prev => ({
        ...prev,
        [activeTopic]: {
          bestScore: Math.max(prev[activeTopic]?.bestScore ?? 0, result.score),
          completed: result.score >= 70 || (prev[activeTopic]?.completed ?? false),
          attempts: (prev[activeTopic]?.attempts ?? 0) + 1,
        },
      }));
    } catch {
      alert('Có lỗi xảy ra khi chấm điểm. Vui lòng thử lại.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleLevelClick = (id: string) => {
    setLevel(id);
    setActiveTopic(TOPICS_BY_LEVEL[id][0].id);
    setActiveMode('none');
    setIsRecording(false);
    setEvaluation(null);
    setSelectedSentence('');
    setCustomSentenceInput('');
  };

  const renderMergedText = (text: string, annotations: AnnotatedWord[]) => {
    if (!annotations || annotations.length === 0)
      return (
        <p className="text-xl md:text-2xl text-gray-900 font-medium" style={{ lineHeight: '2.8' }}>
          {text}
        </p>
      );

    const sortedAnnotations = [...annotations].sort((a, b) => b.word.length - a.word.length);
    let processedText = text;
    const placeholderMap: Record<string, AnnotatedWord> = {};

    sortedAnnotations.forEach((ann, idx) => {
      const placeholder = `__ANN_${idx}__`;
      placeholderMap[placeholder] = ann;
      processedText = processedText.split(ann.word).join(placeholder);
    });

    const parts = processedText.split(/(__ANN_\d+__)/);

    return (
      <p className="text-xl md:text-2xl text-gray-900 font-medium" style={{ lineHeight: '2.8' }}>
        {parts.map((part, i) => {
          const ann = placeholderMap[part];
          if (ann) {
            return (
              <ruby key={i} className="group">
                <span className="border-b-2 border-dashed border-gray-300 group-hover:border-current transition-colors">
                  {ann.word}
                </span>
                <rt className={`text-[0.45em] font-bold not-italic tracking-tight ${currentLevelData?.textColor ?? 'text-blue-600'}`}>
                  {ann.pronounced}
                </rt>
              </ruby>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </p>
    );
  };

  const topics = TOPICS_BY_LEVEL[level] ?? [];

  return (
    <div className="flex flex-col gap-3 md:gap-4">

      {/* ── Level selector ── */}
      <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
        {LEVELS.map(l => (
          <button
            key={l.id}
            onClick={() => handleLevelClick(l.id)}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-sm transition-all ${
              level === l.id
                ? `${l.color} text-white shadow-md`
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* ── Two-column body ── */}
      <div className="flex flex-col lg:flex-row gap-3 md:gap-4 items-start">

        {/* ── LEFT: Topic sidebar ── */}
        <div className="w-full lg:w-60 xl:w-64 flex-shrink-0">

          {/* Mobile: collapsible topic picker */}
          <div className="lg:hidden">
            <button
              onClick={() => setMobileTopicsOpen(o => !o)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border font-semibold text-sm transition-all ${currentLevelData?.lightColor} ${currentLevelData?.borderColor} ${currentLevelData?.textColor}`}
            >
              <span className="truncate">{currentTopicTitle}</span>
              <ChevronDown className={`w-4 h-4 flex-shrink-0 ml-2 transition-transform ${mobileTopicsOpen ? 'rotate-180' : ''}`} />
            </button>

            {mobileTopicsOpen && (
              <div className="mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                <div className="max-h-60 overflow-y-auto divide-y divide-gray-100">
                  {topics.map(topic => {
                    const prog = progress[topic.id];
                    return (
                      <button
                        key={topic.id}
                        onClick={() => setActiveTopic(topic.id)}
                        className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between gap-2 transition-colors ${
                          activeTopic === topic.id
                            ? `${currentLevelData?.lightColor} ${currentLevelData?.textColor} font-semibold`
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="truncate">{topic.title}</span>
                        {prog && (
                          <span className={`text-[10px] font-medium flex-shrink-0 ${prog.completed ? 'text-green-600' : 'text-gray-400'}`}>
                            {prog.completed ? `✓ ${prog.bestScore}đ` : `${prog.attempts}×`}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Desktop: always-visible sidebar */}
          <div className="hidden lg:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className={`px-4 py-3 border-b ${currentLevelData?.lightColor} ${currentLevelData?.borderColor}`}>
              <p className={`text-xs font-bold uppercase tracking-widest ${currentLevelData?.textColor}`}>
                Chủ đề · {topics.length} bài
              </p>
            </div>
            <div className="overflow-y-auto max-h-[calc(100vh-180px)]">
              {topics.map((topic, idx) => {
                const prog = progress[topic.id];
                const isActive = activeTopic === topic.id;
                return (
                  <button
                    key={topic.id}
                    onClick={() => setActiveTopic(topic.id)}
                    className={`w-full text-left px-4 py-3 flex items-start justify-between gap-2 border-b border-gray-50 transition-colors last:border-0 ${
                      isActive
                        ? `${currentLevelData?.lightColor} ${currentLevelData?.textColor} font-semibold`
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-start gap-2 min-w-0">
                      <span className={`text-[10px] font-bold mt-0.5 flex-shrink-0 w-5 text-right ${isActive ? currentLevelData?.textColor : 'text-gray-400'}`}>
                        {idx + 1}
                      </span>
                      <span className="text-sm leading-snug">{topic.title}</span>
                    </span>
                    {prog && (
                      <span className={`text-[10px] font-medium flex-shrink-0 mt-0.5 ${prog.completed ? 'text-green-600' : 'text-gray-400'}`}>
                        {prog.completed ? `✓${prog.bestScore}` : `${prog.attempts}×`}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Lesson content ── */}
        <div className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-100 shadow-sm">

          {/* Content header */}
          <div className={`px-4 md:px-6 py-3 border-b ${currentLevelData?.lightColor} ${currentLevelData?.borderColor} flex items-center justify-between rounded-t-2xl`}>
            <div>
              <p className={`text-xs font-bold uppercase tracking-widest ${currentLevelData?.textColor}`}>{currentLevelData?.label}</p>
              <h2 className="text-base md:text-lg font-bold text-gray-900 mt-0.5">{currentTopicTitle}</h2>
            </div>
            {progress[activeTopic] && (
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                <Award className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-bold text-gray-700">
                  {progress[activeTopic].bestScore}<span className="text-gray-400 font-normal">/100</span>
                </span>
              </div>
            )}
          </div>

          {/* Content body */}
          <div className="p-4 md:p-6">
            {loadingLesson ? (
              <div className="flex flex-col items-center justify-center gap-4 py-24">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                <p className="text-gray-500 font-medium text-center">Đang chuẩn bị bài học...</p>
              </div>
            ) : error ? (
              <div className="text-center py-16 bg-red-50 rounded-xl border border-red-100 p-6">
                <p className="text-red-600">{error}</p>
                <button
                  onClick={() => fetchLesson(activeTopic)}
                  className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-bold"
                >
                  Thử lại
                </button>
              </div>
            ) : currentLesson ? (
              <div className="flex flex-col gap-6">

                {/* Lesson text + audio */}
                <div className={`relative p-4 md:p-5 rounded-xl border ${currentLevelData?.lightColor} ${currentLevelData?.borderColor}`}>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className={`text-xs font-bold uppercase tracking-widest ${currentLevelData?.textColor}`}>Nội dung bài học</h4>
                    <button
                      onClick={() => playAudio(currentLesson.originalText)}
                      disabled={playingAudio}
                      className={`p-2.5 rounded-xl transition-all shadow-sm ${
                        playingAudio
                          ? `${currentLevelData?.color} text-white animate-pulse`
                          : `bg-white ${currentLevelData?.textColor} hover:opacity-80 border ${currentLevelData?.borderColor}`
                      }`}
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="overflow-x-auto no-scrollbar">
                    {renderMergedText(currentLesson.originalText, currentLesson.annotatedWords)}
                  </div>
                </div>

                {/* Translation */}
                <div className="px-1">
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-widest">Dịch nghĩa</h4>
                  <p className="text-base md:text-lg text-gray-700 italic leading-relaxed font-serif">"{currentLesson.translation}"</p>
                </div>

                {/* Pronunciation rules */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-widest">Quy tắc phát âm</h4>
                  <div className="flex flex-col gap-2">
                    {currentLesson.annotatedWords.map((ann, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 md:p-4 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="font-bold text-lg text-gray-900">{ann.word}</span>
                            <span className="text-gray-300">→</span>
                            <span className={`font-bold text-lg ${currentLevelData?.textColor}`}>[{ann.pronounced}]</span>
                          </div>
                          <div className="flex-1">
                            <span className={`inline-block font-bold text-[10px] uppercase tracking-tighter px-2 py-0.5 rounded mr-2 ${currentLevelData?.lightColor} ${currentLevelData?.textColor}`}>
                              {ann.rule}
                            </span>
                            <span className="text-gray-600 text-sm">{ann.explanation}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Practice buttons */}
                <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveMode(activeMode === 'full' ? 'none' : 'full')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                      activeMode === 'full' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                    Luyện toàn bài
                  </button>
                  <button
                    onClick={() => setActiveMode(activeMode === 'sentence' ? 'none' : 'sentence')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                      activeMode === 'sentence' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <List className="w-4 h-4" />
                    Luyện từng câu
                  </button>
                </div>

                {/* Full reading practice */}
                {activeMode === 'full' && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Mic className="w-5 h-5 text-blue-600" />
                      Luyện đọc và chấm điểm (Toàn bài)
                    </h4>
                    <div className="bg-blue-50 p-5 md:p-6 rounded-2xl border border-blue-100 flex flex-col items-center text-center">
                      {!isRecording && !evaluating && !evaluation && (
                        <>
                          <p className="text-blue-800 mb-5">Nhấn nút và đọc to đoạn văn bản để AI chấm điểm phát âm của bạn.</p>
                          <button onClick={() => startRecording(currentLesson.originalText)} className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all">
                            <Mic className="w-7 h-7" />
                          </button>
                        </>
                      )}
                      {isRecording && (
                        <>
                          <p className="text-red-600 font-medium mb-5 animate-pulse">Đang ghi âm... Hãy đọc to đoạn văn bản.</p>
                          <button onClick={stopRecording} className="w-14 h-14 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all animate-pulse">
                            <Square className="w-6 h-6" fill="currentColor" />
                          </button>
                        </>
                      )}
                      {evaluating && (
                        <div className="flex flex-col items-center gap-3 py-4">
                          <Loader2 className="w-9 h-9 animate-spin text-blue-600" />
                          <p className="text-blue-800 font-medium">AI đang phân tích phát âm của bạn...</p>
                        </div>
                      )}
                      {evaluation && <EvalResult evaluation={evaluation} onRetry={() => startRecording(currentLesson.originalText)} />}
                    </div>
                  </div>
                )}

                {/* Sentence practice */}
                {activeMode === 'sentence' && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <List className="w-5 h-5 text-blue-600" />
                      Luyện tập theo từng câu
                    </h4>
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Edit3 className="h-4 w-4 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            placeholder="Nhập câu tiếng Hàn bạn muốn luyện..."
                            className="w-full pl-9 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            value={customSentenceInput}
                            onChange={e => setCustomSentenceInput(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && customSentenceInput.trim()) {
                                setSelectedSentence(customSentenceInput.trim());
                                setEvaluation(null);
                              }
                            }}
                          />
                        </div>
                        <button
                          onClick={() => { if (customSentenceInput.trim()) { setSelectedSentence(customSentenceInput.trim()); setEvaluation(null); } }}
                          className="px-5 py-3 bg-gray-800 text-white rounded-xl font-medium text-sm hover:bg-gray-900 whitespace-nowrap"
                        >
                          Luyện câu này
                        </button>
                      </div>

                      <div>
                        <h5 className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Chọn câu từ bài học:</h5>
                        <div className="flex flex-col gap-2">
                          {getSentences(currentLesson.originalText).map((sentence, idx) => (
                            <button
                              key={idx}
                              onClick={() => { setSelectedSentence(sentence); setEvaluation(null); setCustomSentenceInput(''); }}
                              className={`text-left p-3 rounded-xl border text-sm transition-all ${
                                selectedSentence === sentence
                                  ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-sm ring-1 ring-blue-400'
                                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {sentence}
                            </button>
                          ))}
                        </div>
                      </div>

                      {selectedSentence && (
                        <div className="bg-blue-50 p-5 rounded-2xl border border-blue-200 flex flex-col items-center text-center shadow-inner">
                          <h5 className="text-xs font-bold text-blue-500 uppercase mb-3 tracking-wider">Câu đang luyện tập</h5>
                          <p className="text-xl font-medium text-gray-900 mb-6 leading-relaxed">{selectedSentence}</p>
                          <div className="flex flex-wrap justify-center gap-3 mb-4">
                            <button onClick={() => playAudio(selectedSentence)} disabled={playingAudio} className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all shadow-sm ${playingAudio ? 'bg-blue-200 text-blue-700 animate-pulse' : 'bg-white border border-blue-300 text-blue-700 hover:bg-blue-50'}`}>
                              <Volume2 className="w-4 h-4" />
                              Nghe mẫu
                            </button>
                            {!isRecording && !evaluating && (
                              <button onClick={() => startRecording(selectedSentence)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium text-sm shadow-md transition-all hover:scale-105">
                                <Mic className="w-4 h-4" />
                                Ghi âm
                              </button>
                            )}
                            {isRecording && (
                              <button onClick={stopRecording} className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full font-medium text-sm shadow-md transition-all animate-pulse hover:scale-105">
                                <Square className="w-4 h-4" fill="currentColor" />
                                Dừng ghi âm
                              </button>
                            )}
                          </div>
                          {evaluating && (
                            <div className="flex flex-col items-center gap-3 py-4">
                              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                              <p className="text-blue-800 font-medium text-sm">AI đang phân tích phát âm của bạn...</p>
                            </div>
                          )}
                          {evaluation && <EvalResult evaluation={evaluation} onRetry={() => startRecording(selectedSentence)} compact />}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function EvalResult({
  evaluation,
  onRetry,
  compact = false,
}: {
  evaluation: { score: number; feedback: string };
  onRetry: () => void;
  compact?: boolean;
}) {
  return (
    <div className={`w-full text-left bg-white p-5 rounded-xl shadow-sm border border-blue-100 ${compact ? 'mt-3' : ''}`}>
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-4">
        <div className={`${compact ? 'w-16 h-16' : 'w-20 h-20'} rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shadow-inner flex-shrink-0`}>
          <div className="text-center">
            <span className={`${compact ? 'text-xl' : 'text-2xl'} font-bold`}>{evaluation.score}</span>
            <span className="text-xs block opacity-80">/100</span>
          </div>
        </div>
        <div className="text-center sm:text-left">
          <h5 className={`${compact ? 'text-base' : 'text-lg'} font-bold text-gray-900 flex items-center justify-center sm:justify-start gap-2`}>
            <Award className="w-5 h-5 text-yellow-500" />
            Kết quả đánh giá
          </h5>
          <p className="text-gray-600 mt-1 text-sm">
            {evaluation.score >= 80
              ? 'Tuyệt vời! Phát âm của bạn rất tốt.'
              : evaluation.score >= 60
              ? 'Khá tốt! Hãy chú ý thêm một vài lỗi nhỏ nhé.'
              : 'Cần cố gắng hơn! Hãy nghe đọc mẫu và luyện tập thêm.'}
          </p>
        </div>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h6 className="font-bold text-gray-800 mb-2 text-sm">Nhận xét chi tiết:</h6>
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">{evaluation.feedback}</p>
      </div>
      <div className="mt-4 flex justify-center">
        <button onClick={onRetry} className="px-5 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium rounded-lg transition-colors flex items-center gap-2 text-sm">
          <Mic className="w-4 h-4" />
          Thử lại
        </button>
      </div>
    </div>
  );
}
