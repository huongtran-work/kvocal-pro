'use client';

import { Sparkles, BookOpen, Mic, Award, ChevronRight, Zap, Volume2, TrendingUp } from 'lucide-react';

interface Props {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: Props) {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shadow">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight">K-Vocal AI</span>
          </div>
          <button
            onClick={onGetStarted}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Đăng nhập
          </button>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-5 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <Zap className="w-3.5 h-3.5" />
          Powered by Google Gemini AI
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 mb-4 leading-tight">
          Phát âm tiếng Hàn<br />
          <span className="text-blue-600">chuẩn như người bản ngữ</span>
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto mb-8">
          Luyện tập liên âm (연음) và phát âm tiếng Hàn thông minh với AI — nhận phản hồi tức thì, theo dõi tiến trình của bạn.
        </p>
        <button
          onClick={onGetStarted}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-base font-semibold rounded-xl shadow hover:bg-blue-700 active:scale-95 transition-all"
        >
          Bắt đầu học ngay
          <ChevronRight className="w-5 h-5" />
        </button>
        <p className="mt-3 text-xs text-gray-400">Miễn phí · Không cần cài đặt</p>
      </section>

      <section className="max-w-4xl mx-auto px-5 pb-16">
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-100">
          <img
            src="/screenshot.jpeg"
            alt="Giao diện K-Vocal AI"
            className="w-full object-cover"
          />
        </div>
      </section>

      <section className="bg-gray-50 border-y border-gray-100 py-14">
        <div className="max-w-5xl mx-auto px-5">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">
            Mọi thứ bạn cần để luyện phát âm
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: BookOpen,
                title: '40+ bài học AI',
                desc: 'Từ cơ bản đến nâng cao, tập trung vào hiện tượng liên âm (연음) thường gặp trong hội thoại thực tế.',
              },
              {
                icon: Mic,
                title: 'Đánh giá phát âm thực',
                desc: 'Ghi âm giọng nói của bạn, AI phân tích và cho điểm từng âm tiết một cách chi tiết.',
              },
              {
                icon: TrendingUp,
                title: 'Theo dõi tiến trình',
                desc: 'Xem điểm số qua từng bài luyện tập, biết rõ mình đang cải thiện ở đâu.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-5 py-14">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">
          Cách hoạt động
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {[
            { step: '01', icon: BookOpen, label: 'Chọn bài học', desc: 'Chọn chủ đề phù hợp với trình độ của bạn.' },
            { step: '02', icon: Volume2, label: 'Nghe & luyện nói', desc: 'Nghe mẫu phát âm, sau đó ghi âm giọng mình.' },
            { step: '03', icon: Award, label: 'Nhận phản hồi AI', desc: 'AI chấm điểm và gợi ý cải thiện ngay lập tức.' },
          ].map(({ step, icon: Icon, label, desc }) => (
            <div key={step} className="flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-3 shadow">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-xs font-bold text-blue-400 mb-1">BƯỚC {step}</div>
              <div className="font-semibold text-gray-900 mb-1">{label}</div>
              <div className="text-sm text-gray-500">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-blue-600 py-14 text-center">
        <div className="max-w-lg mx-auto px-5">
          <h2 className="text-2xl font-bold text-white mb-3">Sẵn sàng luyện tập chưa?</h2>
          <p className="text-blue-100 mb-7 text-sm">
            Chỉ cần đăng nhập và bắt đầu — không cần tạo tài khoản, hoàn toàn miễn phí.
          </p>
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 text-base font-semibold rounded-xl shadow hover:bg-blue-50 active:scale-95 transition-all"
          >
            Bắt đầu ngay
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} K-Vocal AI · Powered by Google Gemini AI
      </footer>
    </div>
  );
}
