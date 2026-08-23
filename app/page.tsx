'use client';

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from 'react';

const sampleBrief = '「轻岛」0 糖气泡水计划在今年夏季进入华东市场，核心人群为 18-30 岁的一二线城市年轻人。希望通过小红书、抖音等渠道建立“轻负担、真果味”的品牌认知，并带动天猫旗舰店首月成交。总预算 300 万元，投放周期为 6-8 月。';

const workflow = [
  ['Brief 智能解析', '识别目标、受众与约束'],
  ['相似案例检索', '召回高相关历史经验'],
  ['策略方案生成', '组合渠道与预算建议'],
  ['人工确认沉淀', '把控质量，持续进化'],
];

const processingSteps = [
  ['解析 Brief 要素', '正在识别品牌、目标、受众和预算…'],
  ['检索相似案例', '在 1,248 个历史案例中匹配最佳经验…'],
  ['生成投放策略', '正在组合渠道、内容节奏与衡量指标…'],
  ['完成质量校验', '检查预算约束与策略完整性…'],
];

const channels = [
  { name: '抖音', value: 36, amount: '108 万', color: '#1d6b52' },
  { name: '小红书', value: 28, amount: '84 万', color: '#7bb89d' },
  { name: '天猫站内', value: 22, amount: '66 万', color: '#dfaa63' },
  { name: 'B站', value: 14, amount: '42 万', color: '#e1e9e4' },
];

const cases = [
  { score: 94, brand: '元气森林', title: '夏季新品气泡水全域种草', meta: '食品饮料 · 预算 350 万', lift: '搜索提升 172%' },
  { score: 89, brand: '每日黑巧', title: '年轻女性轻负担心智建设', meta: '休闲食品 · 预算 280 万', lift: 'ROI 2.8' },
  { score: 86, brand: 'OATLY', title: '华东核心城市人群破圈', meta: '植物饮品 · 预算 420 万', lift: '触达 6800 万' },
];

function Logo() {
  return <div className="brand"><span className="brand-mark">A</span><span>AdPilot</span><em>Beta</em></div>;
}

function Sidebar({ onReset, notify }: { onReset: () => void; notify: (message: string) => void }) {
  return (
    <aside className="sidebar">
      <Logo />
      <nav className="nav-list" aria-label="主导航">
        <button className="nav-item active" onClick={onReset}><span>⌁</span>策略工作台</button>
        <button className="nav-item" onClick={() => notify('案例智库已纳入下一版本')}><span>▦</span>案例智库<i>1,248</i></button>
        <button className="nav-item" onClick={() => notify('已为你定位到历史项目')}><span>◇</span>历史项目</button>
        <button className="nav-item" onClick={() => notify('团队空间功能即将开放')}><span>◎</span>团队空间</button>
      </nav>
      <div className="sidebar-note">
        <span>✦</span>
        <strong>让策略越用越聪明</strong>
        <p>确认后的方案将匿名沉淀为团队经验。</p>
      </div>
      <div className="sidebar-bottom">
        <div className="usage-head"><p className="eyebrow">本月用量</p><strong>68 / 100 次</strong></div>
        <div className="usage"><span /></div>
        <div className="user-row"><span className="avatar">林</span><div><strong>林墨</strong><small>品牌策略组</small></div><button aria-label="用户菜单">•••</button></div>
      </div>
    </aside>
  );
}

function WelcomeView({ brief, setBrief, onGenerate, fileName, setFileName }: {
  brief: string;
  setBrief: (value: string) => void;
  onGenerate: () => void;
  fileName: string;
  setFileName: (value: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const acceptFile = (file?: File) => {
    if (!file) return;
    setFileName(file.name);
    if (!brief.trim()) setBrief(sampleBrief);
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => acceptFile(event.target.files?.[0]);
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    acceptFile(event.dataTransfer.files?.[0]);
  };

  return (
    <div className="content-grid welcome-grid">
      <div className="main-column">
        <section className="hero-panel">
          <div className="hero-copy">
            <span className="ai-badge">✦ AI 策略助手</span>
            <h2>让每一份 Brief，<br />都更接近增长答案。</h2>
            <p>解析业务目标、检索相似案例，并在几分钟内生成可执行的媒介策略。</p>
          </div>
          <div className="hero-orbit" aria-hidden="true"><span>Brief</span><i>✦</i><span>案例</span><b>策略</b><small>AI</small></div>
        </section>

        <section className="brief-card">
          <div className="section-heading">
            <div><span className="step-number">01</span><div><h3>上传你的 Campaign Brief</h3><p>信息越完整，生成的方案越精准</p></div></div>
            <span className="safe-pill">⌾ 仅团队可见</span>
          </div>
          <div
            className={`drop-zone ${dragging ? 'dragging' : ''} ${fileName ? 'has-file' : ''}`}
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => { if (event.key === 'Enter') fileRef.current?.click(); }}
          >
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" onChange={handleFile} hidden />
            <span className="upload-mark">{fileName ? '✓' : '↥'}</span>
            <strong>{fileName || '拖拽文件到这里，或点击上传'}</strong>
            <p>{fileName ? '文件已就绪，可直接开始解析' : '支持 PDF、Word、PPT，最大 20MB'}</p>
            <span className="soft-button">{fileName ? '更换文件' : '选择文件'}</span>
          </div>
          <div className="divider"><span>或者</span></div>
          <div className="label-row"><label htmlFor="brief-text">直接粘贴 Brief 内容</label><button onClick={() => setBrief(sampleBrief)}>使用示例</button></div>
          <textarea id="brief-text" value={brief} onChange={(event) => setBrief(event.target.value)} placeholder="粘贴品牌背景、营销目标、目标人群、预算与排期等信息…" />
          <div className="input-meta"><span>{brief.length} 字</span><span>建议包含：目标 · 受众 · 预算 · 周期</span></div>
          <button className="generate-button" disabled={!brief.trim() && !fileName} onClick={onGenerate}><span>✦</span>解析 Brief 并生成策略 <b>→</b></button>
        </section>
      </div>

      <aside className="right-column">
        <section className="flow-card">
          <p className="eyebrow">HOW IT WORKS</p><h3>从需求到策略，只需 4 步</h3>
          {workflow.map((item, index) => <div className="flow-item" key={item[0]}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{item[0]}</strong><small>{item[1]}</small></div></div>)}
        </section>
        <section className="case-card" id="cases">
          <div className="case-top"><span>案例智库</span><strong>1,248</strong></div>
          <p>已沉淀来自 12 个行业的优质投放策略</p>
          <div className="case-tags"><span>食品饮料</span><span>美妆</span><span>3C 数码</span><span>汽车</span></div>
          <div className="case-foot"><span>每周持续更新</span><i>↗</i></div>
        </section>
        <section className="recent-card">
          <div className="mini-heading"><strong>最近项目</strong><button>全部</button></div>
          <div className="recent-row"><span className="recent-icon peach">果</span><div><strong>果味茶夏日上新</strong><small>昨天 · 已完成</small></div><b>→</b></div>
          <div className="recent-row"><span className="recent-icon blue">车</span><div><strong>新能源车型上市</strong><small>8月18日 · 已完成</small></div><b>→</b></div>
        </section>
      </aside>
    </div>
  );
}

function ProcessingView({ step }: { step: number }) {
  return (
    <section className="processing-card" aria-live="polite">
      <div className="processing-visual"><div className="pulse-ring ring-one" /><div className="pulse-ring ring-two" /><span>✦</span></div>
      <p className="eyebrow">ADPILOT IS THINKING</p>
      <h2>正在把 Brief 变成增长策略</h2>
      <p className="processing-sub">我们会结合历史案例与行业经验，生成一份可编辑的方案。</p>
      <div className="processing-list">
        {processingSteps.map((item, index) => (
          <div className={`processing-item ${index < step ? 'done' : ''} ${index === step ? 'current' : ''}`} key={item[0]}>
            <span>{index < step ? '✓' : index + 1}</span><div><strong>{item[0]}</strong><small>{item[1]}</small></div>{index === step && <i>处理中</i>}
          </div>
        ))}
      </div>
      <div className="progress-track"><span style={{ width: `${Math.min(100, (step + 1) * 25)}%` }} /></div>
      <small className="wait-note">预计还需 {Math.max(2, 8 - step * 2)} 秒，请勿关闭页面</small>
    </section>
  );
}

function ResultView({ onReset, notify }: { onReset: () => void; notify: (message: string) => void }) {
  const [tab, setTab] = useState<'strategy' | 'cases'>('strategy');
  const [approved, setApproved] = useState(false);

  const approve = () => {
    setApproved(true);
    notify('策略已确认，并沉淀至团队经验库');
  };

  return (
    <div className="result-wrap">
      <div className="result-banner">
        <div className="result-check">✓</div>
        <div><span>策略已生成</span><h2>轻岛气泡水 · 2026 夏季华东整合营销方案</h2><p>基于 Brief 要素与 36 个高相关案例生成 · 刚刚更新</p></div>
        <div className="result-actions"><button onClick={() => window.print()}>⇩ 导出方案</button><button onClick={onReset}>＋ 新建策略</button></div>
      </div>

      <div className="result-tabs" role="tablist">
        <button className={tab === 'strategy' ? 'active' : ''} onClick={() => setTab('strategy')} role="tab">策略方案</button>
        <button className={tab === 'cases' ? 'active' : ''} onClick={() => setTab('cases')} role="tab">参考案例 <span>3</span></button>
      </div>

      {tab === 'strategy' ? <>
        <section className="analysis-card">
          <div className="card-title"><div><span className="title-icon">⌁</span><div><p>BRIEF ANALYSIS</p><h3>需求解析</h3></div></div><button onClick={() => notify('需求字段已进入编辑模式')}>✎ 编辑</button></div>
          <div className="analysis-grid">
            <div><span>核心目标</span><strong>新品认知建立 + 电商转化</strong><p>首月实现品牌词搜索提升 120%</p></div>
            <div><span>目标人群</span><strong>18-30 岁城市年轻人</strong><p>一二线女性为主，注重健康与悦己</p></div>
            <div><span>市场范围</span><strong>华东核心六城</strong><p>上海、杭州、南京为重点市场</p></div>
            <div><span>预算 / 周期</span><strong>300 万 · 6—8 月</strong><p>预热 15% · 爆发 65% · 长尾 20%</p></div>
          </div>
          <div className="tag-row"><span>0 糖气泡水</span><span>真果味</span><span>夏日场景</span><span>轻负担</span><span>电商转化</span></div>
        </section>

        <div className="strategy-grid">
          <section className="budget-card">
            <div className="card-title"><div><span className="title-icon">◔</span><div><p>MEDIA MIX</p><h3>渠道预算建议</h3></div></div><span className="confidence">可信度 91%</span></div>
            <div className="budget-content">
              <div className="donut" aria-label="渠道预算占比"><div><strong>300</strong><span>总预算 / 万元</span></div></div>
              <div className="channel-list">
                {channels.map((channel) => <div key={channel.name}><span className="channel-dot" style={{ background: channel.color }} /><strong>{channel.name}</strong><span>{channel.value}%</span><b>{channel.amount}</b></div>)}
              </div>
            </div>
            <div className="strategy-note"><span>✦</span><p><strong>组合逻辑：</strong>抖音负责规模触达，小红书建立真实口碑，天猫承接高意向转化，B站用于深度内容破圈。</p></div>
          </section>

          <section className="kpi-card">
            <div className="card-title"><div><span className="title-icon">↗</span><div><p>EXPECTED IMPACT</p><h3>核心成效预估</h3></div></div></div>
            <div className="kpi-grid"><div><span>预计曝光</span><strong>1.2<small>亿</small></strong><em>↑ 18% 行业均值</em></div><div><span>目标互动率</span><strong>5.8<small>%</small></strong><em>↑ 1.2pct</em></div><div><span>预估转化 ROI</span><strong>2.6</strong><em>合理区间 2.3-2.9</em></div><div><span>品牌搜索提升</span><strong>+135<small>%</small></strong><em>目标达成概率 87%</em></div></div>
          </section>
        </div>

        <section className="timeline-card">
          <div className="card-title"><div><span className="title-icon">◫</span><div><p>CAMPAIGN RHYTHM</p><h3>三阶段投放节奏</h3></div></div><button onClick={() => notify('投放节奏已展开')}>查看详细排期 →</button></div>
          <div className="timeline">
            <div className="timeline-head"><span /><span>6 月</span><span>7 月</span><span>8 月</span></div>
            <div className="timeline-row"><strong><i>01</i>预热种草<small>建立期待</small></strong><div><span className="bar warm" style={{ width: '30%' }}>KOC 尝鲜 + 话题预埋</span></div></div>
            <div className="timeline-row"><strong><i>02</i>集中爆发<small>规模破圈</small></strong><div><span className="bar burst" style={{ left: '20%', width: '55%' }}>达人矩阵 + 挑战赛 + 开屏</span></div></div>
            <div className="timeline-row"><strong><i>03</i>长尾转化<small>收口沉淀</small></strong><div><span className="bar tail" style={{ left: '62%', width: '38%' }}>搜索承接 + 人群追投</span></div></div>
          </div>
        </section>

        <section className="approval-card">
          <div><span className="approval-icon">{approved ? '✓' : '◎'}</span><div><h3>{approved ? '这份策略已确认' : '最后一步：由你做判断'}</h3><p>{approved ? '方案已进入团队经验库，可继续导出或创建新策略。' : 'AI 提供参考，人来把控方向。确认后将沉淀为可复用的团队经验。'}</p></div></div>
          <div><button onClick={() => notify('请在需求解析卡片中修改字段')}>需要调整</button><button className={approved ? 'approved' : ''} onClick={approve}>{approved ? '✓ 已确认' : '确认并沉淀策略'}</button></div>
        </section>
      </> : <section className="reference-section">
        <div className="reference-intro"><div><p className="eyebrow">RAG CASE MATCHING</p><h3>与当前 Brief 最相关的历史案例</h3><span>综合行业、目标人群、预算区间与投放周期计算相关度</span></div><strong>检索范围：1,248 个案例</strong></div>
        <div className="reference-grid">{cases.map((item, index) => <article className="reference-card" key={item.title}><div className="match-score"><strong>{item.score}%</strong><span>相关度</span></div><span className={`case-logo logo-${index}`}>{item.brand.slice(0, 1)}</span><div><small>{item.brand}</small><h4>{item.title}</h4><p>{item.meta}</p></div><footer><span>{item.lift}</span><button onClick={() => notify(`已打开「${item.title}」摘要`)}>查看策略摘要 →</button></footer></article>)}</div>
        <div className="case-insight"><span>✦</span><div><strong>案例共同启示</strong><p>成功项目均在爆发前 2-3 周完成 KOC 口碑铺垫，并将搜索承接预算控制在总预算的 18%-25%。</p></div></div>
      </section>}
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<'welcome' | 'processing' | 'result'>('welcome');
  const [brief, setBrief] = useState(sampleBrief);
  const [fileName, setFileName] = useState('');
  const [step, setStep] = useState(0);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (view !== 'processing') return;
    const timers = [850, 1650, 2450].map((delay, index) => window.setTimeout(() => setStep(index + 1), delay));
    const finish = window.setTimeout(() => setView('result'), 3300);
    return () => { timers.forEach(window.clearTimeout); window.clearTimeout(finish); };
  }, [view]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const start = () => { setStep(0); setView('processing'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const reset = () => { setView('welcome'); setFileName(''); setStep(0); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <main className="app-shell">
      <Sidebar onReset={reset} notify={setToast} />
      <section className="workspace" id="workspace">
        <header className="topbar">
          <div><p className="eyebrow">智能投放策略工作台</p><h1>{view === 'result' ? '策略方案' : '下午好，林墨'}</h1></div>
          <div className="top-actions"><button className="icon-button" aria-label="搜索">⌕</button><button className="icon-button notification" aria-label="通知">◌<i /></button>{view !== 'welcome' && <button className="primary-button" onClick={reset}>＋ 新建策略</button>}</div>
        </header>
        {view === 'welcome' && <WelcomeView brief={brief} setBrief={setBrief} onGenerate={start} fileName={fileName} setFileName={setFileName} />}
        {view === 'processing' && <ProcessingView step={step} />}
        {view === 'result' && <ResultView onReset={reset} notify={setToast} />}
      </section>
      {toast && <div className="toast" role="status"><span>✓</span>{toast}</div>}
    </main>
  );
}
