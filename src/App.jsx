import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  BookOpen, Flame, CheckCircle, Home, Library, Settings, Eye, RotateCcw, 
  ChevronRight, Trophy, Volume2, Sparkles, Moon, Sun, Search, Plus, 
  Trash2, Star, Target, Brain, Award, Play, Check, X, ArrowRight,
  Filter, Download, Upload, RefreshCw, BarChart2, Layers, HelpCircle, FileText
} from 'lucide-react';

const PRESET_VOCABULARIES = {
  cet4: {
    id: 'cet4',
    name: '新单词',
    desc: '新单词',
    words: [
      { id: 'c1', word: 'Abandon', phonetic: '/əˈbændən/', type: 'v.', translation: '放弃，遗弃，离弃', example_en: 'He decided to abandon his car and continue on foot.', example_cn: '他决定放弃汽车，继续步行。', root: 'a-(加强) + bandon(控制) -> 放弃', tags: ['CET4', '核心'] },
      { id: 'c2', word: 'Acknowledge', phonetic: '/əkˈnɒlɪdʒ/', type: 'v.', translation: '承认，对…表示感谢', example_en: 'She acknowledged receiving the letter.', example_cn: '她确认收到了信件。', root: 'ac-(朝向) + know(知道) + ledge -> 知道并承认', tags: ['CET4', '高频'] },
      { id: 'c3', word: 'Benefit', phonetic: '/ˈbenɪfɪt/', type: 'n./v.', translation: '利益，好处；有益于', example_en: 'The new hospital will benefit the entire community.', example_cn: '新医院将造福整个社区。', root: 'bene(好) + fit(做) -> 做好事，引申为好处', tags: ['CET4', '基础'] },
      { id: 'c4', word: 'Capacity', phonetic: '/kəˈpæsəti/', type: 'n.', translation: '容量，能力，生产力', example_en: 'The theatre has a seating capacity of 2,000.', example_cn: '这个剧场能容纳2000人。', root: 'cap(拿，抓) + acity -> 能抓住容纳的数量', tags: ['CET4'] }
    ]
  },
  
  
};

const STORAGE_KEY = 'wordmaster_app_state_v2';

const loadStateFromStorage = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load local state', e);
  }
  return null;
};

const saveStateToStorage = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state', e);
  }
};

export default function App() {
  const [theme, setTheme] = useState(() => loadStateFromStorage()?.theme || 'light');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedBookId, setSelectedBookId] = useState('ielts');
  const [dailyGoal, setDailyGoal] = useState(() => loadStateFromStorage()?.dailyGoal || 15);
  const [accentPreference, setAccentPreference] = useState(() => loadStateFromStorage()?.accentPreference || 'en-US');
  const [autoPronounce, setAutoPronounce] = useState(() => loadStateFromStorage()?.autoPronounce ?? true);

  const [userProgress, setUserProgress] = useState(() => loadStateFromStorage()?.userProgress || {});
  const [userStats, setUserStats] = useState(() => loadStateFromStorage()?.userStats || {
    learnedToday: 0,
    streakDays: 5,
    lastActiveDate: new Date().toISOString().split('T')[0],
    totalReviews: 42
  });

  const [customWords, setCustomWords] = useState(() => loadStateFromStorage()?.customWords || []);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    saveStateToStorage({
      theme,
      dailyGoal,
      accentPreference,
      autoPronounce,
      userProgress,
      userStats,
      customWords
    });
  }, [theme, dailyGoal, accentPreference, autoPronounce, userProgress, userStats, customWords]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const speakWord = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = accentPreference;
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } else {
      showToast('当前浏览器不支持语音合成功能');
    }
  };

  const allCurrentWords = useMemo(() => {
    if (selectedBookId === 'custom') {
      return customWords;
    }
    return PRESET_VOCABULARIES[selectedBookId]?.words || [];
  }, [selectedBookId, customWords]);

  const statsCalculated = useMemo(() => {
    let masteredCount = 0;
    let learningCount = 0;
    
    Object.values(userProgress).forEach(item => {
      if (item.status === 'mastered') masteredCount++;
      else if (item.status === 'learning') learningCount++;
    });

    const retentionRate = (masteredCount + learningCount) > 0 
      ? Math.round((masteredCount / (masteredCount + learningCount)) * 100) 
      : 85;

    return {
      learnedToday: userStats.learnedToday,
      dailyGoal,
      masteredCount,
      learningCount,
      streakDays: userStats.streakDays,
      retentionRate
    };
  }, [userProgress, userStats, dailyGoal]);

  const handleWordEvaluate = (wordId, rating) => {
    const now = Date.now();
    const intervals = { 1: 1, 2: 3, 3: 7, 4: 30 };
    const daysToAdd = intervals[rating] || 1;
    const nextReviewDate = now + daysToAdd * 24 * 60 * 60 * 1000;
    const newStatus = rating >= 3 ? 'mastered' : 'learning';

    setUserProgress(prev => ({
      ...prev,
      [wordId]: {
        ...prev[wordId],
        status: newStatus,
        nextReviewDate,
        lastReviewed: now,
        interval: daysToAdd,
        starred: prev[wordId]?.starred || false
      }
    }));

    const todayStr = new Date().toISOString().split('T')[0];
    setUserStats(prev => {
      const isNewDay = prev.lastActiveDate !== todayStr;
      return {
        ...prev,
        learnedToday: isNewDay ? 1 : prev.learnedToday + 1,
        lastActiveDate: todayStr,
        totalReviews: prev.totalReviews + 1
      };
    });
  };

  const toggleStarWord = (wordId) => {
    setUserProgress(prev => ({
      ...prev,
      [wordId]: {
        ...prev[wordId],
        starred: !prev[wordId]?.starred
      }
    }));
    showToast('生词本标记已更新');
  };

  // 批量导入 CSV / TXT 文件解析器
  const handleBatchImport = (importedWordsList) => {
    setCustomWords(prev => [...importedWordsList, ...prev]);
    setSelectedBookId('custom');
    showToast(`成功导入 ${importedWordsList.length} 个本地单词！`);
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'} font-sans pb-20 sm:pb-0`}>
      
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium animate-bounce flex items-center gap-2">
          <Sparkles size={16} />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <header className={`sticky top-0 z-30 backdrop-blur-md border-b transition-colors ${theme === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 p-2 rounded-xl text-white shadow-md shadow-indigo-500/20">
                <BookOpen size={22} />
              </div>
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
                WordMaster
              </span>
            </div>

            <div className="hidden sm:block h-5 w-[1px] bg-slate-300 dark:bg-slate-700 mx-1"></div>

            <select
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border cursor-pointer outline-none transition-all ${
                theme === 'dark' 
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:border-slate-600' 
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              {Object.values(PRESET_VOCABULARIES).map(book => (
                <option key={book.id} value={book.id}>{book.name}</option>
              ))}
              <option value="custom">✨ 我的自定义词库 ({customWords.length})</option>
            </select>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            <NavTab active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Home size={18} />} label="仪表盘" theme={theme} />
            <NavTab active={activeTab === 'learning'} onClick={() => setActiveTab('learning')} icon={<Brain size={18} />} label="背单词" theme={theme} />
            <NavTab active={activeTab === 'quiz'} onClick={() => setActiveTab('quiz')} icon={<Award size={18} />} label="拼写测试" theme={theme} />
            <NavTab active={activeTab === 'library'} onClick={() => setActiveTab('library')} icon={<Library size={18} />} label="词库管理" theme={theme} />
            <NavTab active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={18} />} label="设置" theme={theme} />
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`p-2 rounded-xl transition-all ${
                theme === 'dark' ? 'bg-slate-800 text-amber-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              title="切换主题"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <DashboardView 
            stats={statsCalculated} 
            theme={theme}
            currentBookName={selectedBookId === 'custom' ? '自定义词库' : PRESET_VOCABULARIES[selectedBookId]?.name}
            onStartLearning={() => setActiveTab('learning')}
            onStartQuiz={() => setActiveTab('quiz')}
          />
        )}

        {activeTab === 'learning' && (
          <LearningCardView 
            words={allCurrentWords}
            userProgress={userProgress}
            onEvaluate={handleWordEvaluate}
            onToggleStar={toggleStarWord}
            speak={speakWord}
            autoPronounce={autoPronounce}
            theme={theme}
            onFinish={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'quiz' && (
          <QuizSpellingView 
            words={allCurrentWords}
            speak={speakWord}
            theme={theme}
            onFinish={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'library' && (
          <VocabularyLibraryView 
            words={allCurrentWords}
            presetBooks={PRESET_VOCABULARIES}
            selectedBookId={selectedBookId}
            onSelectBook={setSelectedBookId}
            userProgress={userProgress}
            customWords={customWords}
            onAddCustomWord={(newW) => {
              setCustomWords(prev => [newW, ...prev]);
              showToast('已添加新词条');
            }}
            onBatchImport={handleBatchImport}
            onDeleteCustomWord={(id) => {
              setCustomWords(prev => prev.filter(w => w.id !== id));
              showToast('已删除词条');
            }}
            onToggleStar={toggleStarWord}
            speak={speakWord}
            theme={theme}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView 
            dailyGoal={dailyGoal}
            onUpdateGoal={setDailyGoal}
            accentPreference={accentPreference}
            onUpdateAccent={setAccentPreference}
            autoPronounce={autoPronounce}
            onUpdateAutoPronounce={setAutoPronounce}
            onResetData={() => {
              if (window.confirm('确定要重置所有本地背词进度和记录吗？操作无法撤销。')) {
                setUserProgress({});
                setUserStats({ learnedToday: 0, streakDays: 0, lastActiveDate: '', totalReviews: 0 });
                setCustomWords([]);
                showToast('已重置所有用户数据');
              }
            }}
            theme={theme}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className={`sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-lg transition-colors ${
        theme === 'dark' ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'
      }`}>
        <div className="flex justify-around py-2">
          <MobileNavBtn active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Home size={20} />} label="看板" theme={theme} />
          <MobileNavBtn active={activeTab === 'learning'} onClick={() => setActiveTab('learning')} icon={<Brain size={20} />} label="背词" theme={theme} />
          <MobileNavBtn active={activeTab === 'quiz'} onClick={() => setActiveTab('quiz')} icon={<Award size={20} />} label="测验" theme={theme} />
          <MobileNavBtn active={activeTab === 'library'} onClick={() => setActiveTab('library')} icon={<Library size={20} />} label="词库" theme={theme} />
          <MobileNavBtn active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={20} />} label="设置" theme={theme} />
        </div>
      </div>
    </div>
  );
}

function NavTab({ active, onClick, icon, label, theme }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
        active 
          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
          : theme === 'dark'
            ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function MobileNavBtn({ active, onClick, icon, label, theme }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-semibold transition-all ${
        active 
          ? 'text-indigo-600 dark:text-indigo-400' 
          : theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function DashboardView({ stats, theme, currentBookName, onStartLearning, onStartQuiz }) {
  const goalPercent = Math.min(100, Math.round((stats.learnedToday / stats.dailyGoal) * 100));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className={`p-6 sm:p-8 rounded-3xl border relative overflow-hidden transition-all ${
        theme === 'dark' 
          ? 'bg-gradient-to-r from-slate-800 to-indigo-950/50 border-slate-700/80' 
          : 'bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-white border-indigo-100'
      }`}>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white mb-3">
              <Sparkles size={12} /> SM-2 智能复习推荐
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              保持节奏，高效积累！
            </h1>
            <p className={`mt-2 text-sm sm:text-base max-w-xl ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              当前词库：<span className="font-semibold text-indigo-500">{currentBookName}</span>。基于记忆曲线，系统已为你精选今日需要背诵与复习的词条。
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={onStartLearning}
              className="flex-1 md:flex-none px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <Play size={18} fill="currentColor" /> 开始今日背词
            </button>
            <button
              onClick={onStartQuiz}
              className={`px-5 py-3.5 border font-bold rounded-2xl transition-all flex items-center justify-center gap-2 ${
                theme === 'dark'
                  ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm'
              }`}
            >
              <Award size={18} /> 拼写测试
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={<Target className="text-indigo-500" size={24} />} label="今日目标" value={`${stats.learnedToday} / ${stats.dailyGoal}`} subText={`完成度 ${goalPercent}%`} theme={theme} />
        <StatCard icon={<Flame className="text-amber-500" size={24} />} label="连续打卡" value={`${stats.streakDays} 天`} subText="状态良好" theme={theme} />
        <StatCard icon={<CheckCircle className="text-emerald-500" size={24} />} label="已掌握词汇" value={`${stats.masteredCount} 词`} subText={`复习中 ${stats.learningCount}`} theme={theme} />
        <StatCard icon={<BarChart2 className="text-sky-500" size={24} />} label="记忆持久率" value={`${stats.retentionRate}%`} subText="记忆曲线保护中" theme={theme} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`md:col-span-2 p-6 rounded-3xl border transition-colors ${theme === 'dark' ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2"><Trophy size={20} className="text-amber-500" /> 今日进度</h3>
            <span className="text-xs font-bold px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg">{goalPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-4 rounded-full overflow-hidden p-0.5 mb-4">
            <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-500" style={{ width: `${goalPercent}%` }}></div>
          </div>
          <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            {goalPercent >= 100 ? '🎉 太棒了！今天预定目标已完成，可以前往词库复习或测试！' : `还差 ${stats.dailyGoal - stats.learnedToday} 个单词达成目标。`}
          </p>
        </div>

        <div className={`p-6 rounded-3xl border flex flex-col justify-between ${theme === 'dark' ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div>
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><Brain size={20} className="text-violet-500" /> 智能记忆保护</h3>
            <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              本地数据完全独立存储在浏览器中，系统会在临近遗忘节点为你重新安排出现频率。
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs font-semibold text-indigo-500">
            <span>本地存储实时同步</span><Check size={16} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subText, theme }) {
  return (
    <div className={`p-5 rounded-3xl border transition-all ${theme === 'dark' ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
      <div className="mb-3">{icon}</div>
      <p className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
      <p className="text-xl sm:text-2xl font-black mt-0.5 tracking-tight">{value}</p>
      <p className="text-[11px] text-slate-400 mt-1">{subText}</p>
    </div>
  );
}

function LearningCardView({ words, userProgress, onEvaluate, onToggleStar, speak, autoPronounce, theme, onFinish }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const currentWord = words[currentIndex];
  const isStarred = currentWord ? !!userProgress[currentWord.id]?.starred : false;

  useEffect(() => {
    if (currentWord && autoPronounce) {
      speak(currentWord.word);
    }
  }, [currentIndex, currentWord]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isFinished) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (isFlipped) {
        if (e.key === '1') handleChoice(1);
        else if (e.key === '2') handleChoice(2);
        else if (e.key === '3') handleChoice(3);
        else if (e.key === '4') handleChoice(4);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, isFinished, currentIndex]);

  const handleChoice = (rating) => {
    onEvaluate(currentWord.id, rating);
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      setIsFinished(true);
    }
  };

  if (!words || words.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 mb-4">当前所选词库没有单词，请前往“词库管理”添加或导入单词本。</p>
        <button onClick={onFinish} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold">返回仪表盘</button>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="max-w-md mx-auto text-center py-16 animate-in zoom-in duration-300">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <CheckCircle size={44} />
        </div>
        <h2 className="text-2xl font-black mb-2">太棒了，全部学完！</h2>
        <p className={`text-sm mb-8 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>所有评估均已同步保存到本地数据库。</p>
        <button onClick={onFinish} className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/25">
          完成并返回仪表盘
        </button>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / words.length) * 100);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onFinish} className={`p-2 rounded-xl ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}>
          <X size={20} />
        </button>

        <div className="flex-1 mx-6 flex items-center gap-3">
          <div className="flex-1 bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
          </div>
          <span className="text-xs font-bold text-slate-400">{currentIndex + 1} / {words.length}</span>
        </div>

        <button onClick={() => onToggleStar(currentWord.id)} className={`p-2 rounded-xl ${isStarred ? 'text-amber-500 bg-amber-50 dark:bg-amber-950' : 'text-slate-400 hover:text-amber-500'}`}>
          <Star size={20} fill={isStarred ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div 
        onClick={() => !isFlipped && setIsFlipped(true)}
        className={`min-h-[360px] rounded-3xl border p-8 flex flex-col justify-between cursor-pointer relative transition-all duration-300 ${
          theme === 'dark' ? 'bg-slate-800/90 border-slate-700 hover:border-slate-600' : 'bg-white border-slate-200 shadow-xl hover:border-indigo-200'
        }`}
      >
        <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
          <span className="text-xs font-bold px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-full mb-4">
            {currentWord.tags?.[0] || 'VOCAB'}
          </span>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-3">{currentWord.word}</h2>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-base font-mono text-slate-400">{currentWord.phonetic || ''}</span>
            <button onClick={(e) => { e.stopPropagation(); speak(currentWord.word); }} className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:scale-110 transition-transform">
              <Volume2 size={18} />
            </button>
          </div>
          {!isFlipped && (
            <div className="mt-12 text-xs font-semibold text-slate-400 flex items-center gap-1.5 animate-pulse">
              <Eye size={16} /> 点击卡片或按空格键翻转释义
            </div>
          )}
        </div>

        {isFlipped && (
          <div className="pt-6 border-t border-slate-100 dark:border-slate-700/80 space-y-4 animate-in fade-in duration-200">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">释义</span>
              <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
                <span className="text-sm font-normal text-slate-400 mr-2">{currentWord.type}</span>
                {currentWord.translation}
              </p>
            </div>
            {currentWord.example_en && (
              <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{currentWord.example_en}</p>
                {currentWord.example_cn && <p className="text-xs text-slate-400 mt-1">{currentWord.example_cn}</p>}
              </div>
            )}
            {currentWord.root && (
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500" />
                <span className="font-semibold text-slate-500">记忆辅助：</span> {currentWord.root}
              </p>
            )}
          </div>
        )}
      </div>

      {isFlipped && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <AssessmentButton shortcut="1" label="忘记" subText="1天后复习" color="bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900 hover:bg-red-100" onClick={() => handleChoice(1)} />
            <AssessmentButton shortcut="2" label="模糊" subText="3天后复习" color="bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900 hover:bg-amber-100" onClick={() => handleChoice(2)} />
            <AssessmentButton shortcut="3" label="熟知" subText="7天后复习" color="bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900 hover:bg-indigo-100" onClick={() => handleChoice(3)} />
            <AssessmentButton shortcut="4" label="太简单" subText="30天后复习" color="bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900 hover:bg-emerald-100" onClick={() => handleChoice(4)} />
          </div>
          <p className="text-center text-[11px] text-slate-400">数字键 1-4 可触发快捷评估</p>
        </div>
      )}
    </div>
  );
}

function AssessmentButton({ shortcut, label, subText, color, onClick }) {
  return (
    <button onClick={onClick} className={`p-3.5 rounded-2xl border font-bold flex flex-col items-center justify-center transition-all transform active:scale-95 ${color}`}>
      <div className="flex items-center gap-1">
        <span className="text-xs px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono">{shortcut}</span>
        <span className="text-base">{label}</span>
      </div>
      <span className="text-[10px] opacity-75 mt-0.5">{subText}</span>
    </button>
  );
}

function QuizSpellingView({ words, speak, theme, onFinish }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [status, setStatus] = useState('idle');
  const [score, setScore] = useState(0);

  const currentWord = words[currentIndex];

  if (!words || words.length === 0) {
    return <div className="text-center py-20 text-slate-500">词库暂无词条可供测验</div>;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const isRight = inputVal.trim().toLowerCase() === currentWord.word.toLowerCase();
    if (isRight) {
      setStatus('correct');
      setScore(prev => prev + 1);
      speak(currentWord.word);
    } else {
      setStatus('wrong');
    }
  };

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setInputVal('');
      setStatus('idle');
    } else {
      setStatus('completed');
    }
  };

  if (status === 'completed') {
    return (
      <div className="max-w-md mx-auto text-center py-12 animate-in zoom-in duration-300">
        <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Award size={40} />
        </div>
        <h2 className="text-2xl font-black mb-2">测试完成！</h2>
        <p className="text-lg font-bold text-indigo-500 mb-6">正确得分: {score} / {words.length}</p>
        <button onClick={onFinish} className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-2xl">返回仪表盘</button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex justify-between items-center text-sm font-bold text-slate-400">
        <span>拼写强化测验</span>
        <span>{currentIndex + 1} / {words.length}</span>
      </div>

      <div className={`p-8 rounded-3xl border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-lg'}`}>
        <div className="mb-6 text-center">
          <span className="text-xs font-bold text-slate-400">{currentWord.type}</span>
          <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{currentWord.translation}</h3>
          {currentWord.example_cn && <p className="text-xs text-slate-400 mt-2">{currentWord.example_cn}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            disabled={status !== 'idle'}
            placeholder="请输入对应的英文单词..."
            autoFocus
            className={`w-full px-5 py-4 text-center text-xl font-bold rounded-2xl border outline-none transition-all ${
              status === 'correct' 
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50' 
                : status === 'wrong'
                  ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950/50'
                  : theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-500'
            }`}
          />

          {status === 'idle' && (
            <button type="submit" className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-500">
              检查拼写
            </button>
          )}
        </form>

        {status !== 'idle' && (
          <div className="mt-6 space-y-4 animate-in fade-in">
            {status === 'correct' ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-2xl text-emerald-600 dark:text-emerald-400 text-center font-bold flex items-center justify-center gap-2">
                <Check size={20} /> 拼写完全正确！
              </div>
            ) : (
              <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl text-red-600 dark:text-red-400 text-center font-bold">
                <p>正确拼写为：</p>
                <p className="text-xl font-black mt-1 font-mono tracking-wider">{currentWord.word}</p>
              </div>
            )}

            <button onClick={handleNext} className="w-full py-3.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-2xl flex items-center justify-center gap-2">
              下一个单词 <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function VocabularyLibraryView({ words, presetBooks, selectedBookId, onSelectBook, userProgress, customWords, onAddCustomWord, onBatchImport, onDeleteCustomWord, onToggleStar, speak, theme }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const [newWord, setNewWord] = useState({ word: '', phonetic: '', type: 'n.', translation: '', example_en: '', example_cn: '' });
  const [importText, setImportText] = useState('');

  const fileInputRef = useRef(null);

  const filteredWords = words.filter(w => {
    const matchesSearch = w.word.toLowerCase().includes(searchTerm.toLowerCase()) || w.translation.includes(searchTerm);
    if (!matchesSearch) return false;

    if (filterMode === 'starred') return !!userProgress[w.id]?.starred;
    if (filterMode === 'mastered') return userProgress[w.id]?.status === 'mastered';
    return true;
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newWord.word || !newWord.translation) return;

    onAddCustomWord({
      ...newWord,
      id: 'custom_' + Date.now() + Math.random().toString(36).substring(2, 5),
      tags: ['自定义']
    });

    setNewWord({ word: '', phonetic: '', type: 'n.', translation: '', example_en: '', example_cn: '' });
    setShowAddModal(false);
  };

  // 解析上传的文本 (支持 CSV / 逗号 / Tab / 冒号分割)
  const parseAndImportText = (textData) => {
    const lines = textData.split(/\r?\n/);
    const parsedList = [];

    lines.forEach((line, idx) => {
      if (!line.trim()) return;
      // 兼容 CSV 逗号、Tab、减号或冒号分隔
      const parts = line.split(/,|\t|-|：|:/).map(p => p.trim());
      if (parts.length >= 2) {
        const word = parts[0];
        const translation = parts[1];
        const phonetic = parts[2] || '';
        const example = parts[3] || '';

        parsedList.push({
          id: 'imp_' + Date.now() + '_' + idx,
          word,
          translation,
          phonetic: phonetic ? (phonetic.startsWith('/') ? phonetic : `/${phonetic}/`) : '',
          type: 'n.',
          example_en: example,
          tags: ['本地导入']
        });
      }
    });

    if (parsedList.length > 0) {
      onBatchImport(parsedList);
      setShowImportModal(false);
      setImportText('');
    } else {
      alert('无法解析文件格式，请确保每行至少包含“单词, 释义”');
    }
  };

  // 文件读取机制
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      parseAndImportText(event.target.result);
    };
    reader.readAsText(file);
  };

  // 导出 JSON/CSV 文件备份
  const handleExportCustomWords = () => {
    if (customWords.length === 0) {
      alert('你目前还没有自定义或导入的单词！');
      return;
    }
    const jsonStr = JSON.stringify(customWords, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my_words_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black">词库与生词本</h2>
          <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>当前选中词库包含 {words.length} 个词条</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
              theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <Upload size={14} /> 批量导入文件
          </button>

          {selectedBookId === 'custom' && (
            <button
              onClick={handleExportCustomWords}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
                theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Download size={14} /> 备份导出
            </button>
          )}

          <button
            onClick={() => {
              onSelectBook('custom');
              setShowAddModal(true);
            }}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-1.5 text-xs shadow-sm"
          >
            <Plus size={16} /> 单条添加
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="搜索英文单词或中文释义..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
              theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500' : 'bg-white border-slate-200 focus:border-indigo-500'
            }`}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${filterMode === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
          >
            全部
          </button>
          <button
            onClick={() => setFilterMode('starred')}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${filterMode === 'starred' ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
          >
            <Star size={14} fill="currentColor" /> 生词本
          </button>
        </div>
      </div>

      {/* Word List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredWords.map(item => {
          const isStarred = !!userProgress[item.id]?.starred;

          return (
            <div key={item.id} className={`p-5 rounded-2xl border flex justify-between items-start transition-all ${
              theme === 'dark' ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-black text-indigo-600 dark:text-indigo-400">{item.word}</h4>
                  <span className="text-xs font-mono text-slate-400">{item.phonetic}</span>
                  <button onClick={() => speak(item.word)} className="text-slate-400 hover:text-indigo-500"><Volume2 size={16} /></button>
                </div>
                <p className="text-sm font-semibold">{item.type} {item.translation}</p>
                {item.example_en && <p className="text-xs text-slate-400 italic mt-1">{item.example_en}</p>}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onToggleStar(item.id)}
                  className={`p-2 rounded-lg ${isStarred ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600 hover:text-amber-500'}`}
                >
                  <Star size={18} fill={isStarred ? 'currentColor' : 'none'} />
                </button>

                {selectedBookId === 'custom' && (
                  <button onClick={() => onDeleteCustomWord(item.id)} className="p-2 text-slate-300 hover:text-red-500">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 单条添加 Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md p-6 rounded-3xl space-y-4 ${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}`}>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">添加自定义生词</h3>
              <button onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="英文单词 (如: Innovative)"
                required
                value={newWord.word}
                onChange={e => setNewWord({ ...newWord, word: e.target.value })}
                className="w-full p-3 rounded-xl border text-sm dark:bg-slate-900 dark:border-slate-700"
              />
              <input
                type="text"
                placeholder="音标 (如: /ɪnəveɪtɪv/)"
                value={newWord.phonetic}
                onChange={e => setNewWord({ ...newWord, phonetic: e.target.value })}
                className="w-full p-3 rounded-xl border text-sm dark:bg-slate-900 dark:border-slate-700"
              />
              <input
                type="text"
                placeholder="中文释义 (如: 创新的，革新的)"
                required
                value={newWord.translation}
                onChange={e => setNewWord({ ...newWord, translation: e.target.value })}
                className="w-full p-3 rounded-xl border text-sm dark:bg-slate-900 dark:border-slate-700"
              />
              <textarea
                placeholder="英文例句 (选填)"
                value={newWord.example_en}
                onChange={e => setNewWord({ ...newWord, example_en: e.target.value })}
                className="w-full p-3 rounded-xl border text-sm dark:bg-slate-900 dark:border-slate-700"
              />
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl">确认保存</button>
            </form>
          </div>
        </div>
      )}

      {/* 批量导入 Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-lg p-6 rounded-3xl space-y-4 ${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}`}>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <FileText className="text-indigo-500" size={20} /> 批量导入本地单词本
              </h3>
              <button onClick={() => setShowImportModal(false)}><X size={20} /></button>
            </div>

            <p className="text-xs text-slate-400">
              支持读取 CSV、TXT 或直接粘贴文本。格式要求：每行一个词，用逗号分隔（如：<code className="bg-black/10 px-1 py-0.5 rounded">apple, 苹果</code>）
            </p>

            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 p-6 rounded-2xl text-center">
              <input 
                type="file" 
                ref={fileInputRef} 
                accept=".csv,.txt" 
                onChange={handleFileUpload} 
                className="hidden" 
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl text-xs hover:bg-indigo-100"
              >
                选取本地 CSV/TXT 文件
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">或者直接粘贴单词文本：</label>
              <textarea
                rows={5}
                placeholder={`apple, 苹果\nbanana, 香蕉, /bəˈnænə/\ncat, 猫, /kæt/, I have a cat.`}
                value={importText}
                onChange={e => setImportText(e.target.value)}
                className="w-full p-3 rounded-xl border text-xs font-mono dark:bg-slate-900 dark:border-slate-700"
              />
            </div>

            <button
              onClick={() => parseAndImportText(importText)}
              className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm"
            >
              解析并导入到生词库
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsView({ dailyGoal, onUpdateGoal, accentPreference, onUpdateAccent, autoPronounce, onUpdateAutoPronounce, onResetData, theme }) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-black">系统偏好设置</h2>

      <div className={`p-6 rounded-3xl border space-y-6 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-bold">每日背词目标</h4>
            <p className="text-xs text-slate-400">设置每天计划复习和新学的词汇量</p>
          </div>
          <select
            value={dailyGoal}
            onChange={(e) => onUpdateGoal(Number(e.target.value))}
            className="px-3 py-2 rounded-xl border font-bold text-sm dark:bg-slate-900 dark:border-slate-700"
          >
            <option value={10}>10 个/天</option>
            <option value={15}>15 个/天</option>
            <option value={20}>20 个/天</option>
            <option value={30}>30 个/天</option>
          </select>
        </div>

        <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-700/80 pt-4">
          <div>
            <h4 className="font-bold">发音口音偏好</h4>
            <p className="text-xs text-slate-400">选择语音发音引擎的口音</p>
          </div>
          <select
            value={accentPreference}
            onChange={(e) => onUpdateAccent(e.target.value)}
            className="px-3 py-2 rounded-xl border font-bold text-sm dark:bg-slate-900 dark:border-slate-700"
          >
            <option value="en-US">美式发音 (en-US)</option>
            <option value="en-GB">英式发音 (en-GB)</option>
          </select>
        </div>

        <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-700/80 pt-4">
          <div>
            <h4 className="font-bold">切换卡片时自动朗读</h4>
            <p className="text-xs text-slate-400">进入新卡片时自动朗读单词英文发音</p>
          </div>
          <input
            type="checkbox"
            checked={autoPronounce}
            onChange={(e) => onUpdateAutoPronounce(e.target.checked)}
            className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
          />
        </div>

        <div className="border-t border-slate-100 dark:border-slate-700/80 pt-4">
          <button
            onClick={onResetData}
            className="px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/40 dark:border-red-900/50 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors"
          >
            重置所有本地背词进度数据
          </button>
        </div>
      </div>
    </div>
  );
}