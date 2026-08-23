'use client';

import { ChangeEvent, DragEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import type { CaseRecord } from '@/db/schema';

const sampleBrief = '「轻岛」0 糖气泡水计划在今年夏季进入华东市场，核心人群为 18-30 岁的一二线城市年轻人。希望通过小红书、抖音等渠道建立“轻负担、真果味”的品牌认知，并带动天猫旗舰店首月成交。总预算 300 万元，投放周期为 6-8 月。';

const workflow = [
  ['Brief 智能解析', '识别目标、受众与约束'],
  ['演示案例匹配', '展示未来检索结果结构'],
  ['策略方案生成', '组合渠道与预算建议'],
  ['人工确认导出', '把控质量，形成文档'],
];

const processingSteps = [
  ['解析 Brief 要素', '正在识别品牌、目标、受众和预算…'],
  ['检索相似案例', '在当前演示知识库中匹配参考经验…'],
  ['生成投放策略', '正在组合渠道、内容节奏与衡量指标…'],
  ['完成质量校验', '检查预算约束与策略完整性…'],
];

const channels = [
  { name: '抖音', value: 36, color: '#1d6b52' },
  { name: '小红书', value: 28, color: '#7bb89d' },
  { name: '天猫站内', value: 22, color: '#dfaa63' },
  { name: 'B站', value: 14, color: '#e1e9e4' },
];

function parseBrief(brief: string) {
  const brand = brief.match(/[「“\"]([^」”\"]{1,16})[」”\"]/)?.[1] || '本次 Campaign';
  const budget = Number(brief.match(/(?:总预算|预算)[^\d]{0,10}(\d+(?:\.\d+)?)\s*万/)?.[1] || 300);
  const ages = brief.match(/(\d{1,2})\s*[-—–至到~]\s*(\d{1,2})\s*岁/);
  const period = brief.match(/(\d{1,2})\s*[-—–至到~]\s*(\d{1,2})\s*月/);
  const marketName = ['华东', '华南', '华北', '华中', '西南', '全国'].find((name) => brief.includes(name)) || '重点区域';
  const isCommerce = /成交|转化|电商|销售|下单/.test(brief);
  const keywordOptions = ['0 糖', '气泡水', '真果味', '夏日场景', '轻负担', '电商转化', '新品', '年轻人'];
  const tags = keywordOptions.filter((keyword) => brief.replaceAll(' ', '').includes(keyword.replaceAll(' ', ''))).slice(0, 5);

  return {
    brand,
    budget,
    audience: ages ? `${ages[1]}-${ages[2]} 岁城市年轻人` : '核心兴趣人群',
    period: period ? `${period[1]}—${period[2]} 月` : '按 Brief 周期执行',
    market: `${marketName}${marketName === '全国' ? '市场' : '核心市场'}`,
    objective: isCommerce ? '新品认知建立 + 电商转化' : '品牌认知建立 + 人群增长',
    tags: tags.length ? tags : ['品牌认知', '人群增长', '内容种草'],
  };
}

type DisplayCase = {
  id: string;
  score: number;
  brand: string;
  title: string;
  meta: string;
  lift: string;
  source: string;
  summary: string;
  real: boolean;
};

const demoCases: DisplayCase[] = [
  { id: 'demo-a', score: 94, brand: '气泡水品牌 A', title: '夏季新品气泡水全域种草', meta: '演示数据 · 预算 350 万', lift: '示例指标：搜索增量', source: '演示数据', summary: '仅用于展示真实案例接入后的界面结构。', real: false },
  { id: 'demo-b', score: 89, brand: '轻食品牌 B', title: '年轻人群轻负担心智建设', meta: '演示数据 · 预算 280 万', lift: '示例指标：转化 ROI', source: '演示数据', summary: '仅用于展示真实案例接入后的界面结构。', real: false },
  { id: 'demo-c', score: 86, brand: '植物饮品 C', title: '华东核心城市人群破圈', meta: '演示数据 · 预算 420 万', lift: '示例指标：有效触达', source: '演示数据', summary: '仅用于展示真实案例接入后的界面结构。', real: false },
];

function matchCases(brief: string, caseLibrary: CaseRecord[]): DisplayCase[] {
  const insights = parseBrief(brief);
  const compactBrief = brief.replaceAll(' ', '').toLowerCase();
  const cues = [...new Set([
    ...insights.tags,
    insights.market.replace('核心市场', '').replace('市场', ''),
    /年轻|18|20|25|30/.test(brief) ? '年轻' : '',
    /成交|转化|电商|下单/.test(brief) ? '转化' : '',
    /新品|上市|上新/.test(brief) ? '新品' : '',
  ].filter(Boolean))];

  return caseLibrary
    .map((item) => {
      const searchable = [item.brand, item.title, item.industry, item.objective, item.audience, item.channels, item.summary]
        .join('')
        .replaceAll(' ', '')
        .toLowerCase();
      const overlap = cues.filter((cue) => searchable.includes(cue.toLowerCase()) || compactBrief.includes(cue.toLowerCase()) && searchable.includes(cue.slice(0, 2).toLowerCase())).length;
      const budgetGap = item.budget > 0 ? Math.abs(item.budget - insights.budget) / Math.max(item.budget, insights.budget) : 1;
      const budgetFit = Math.max(0, Math.round((1 - budgetGap) * 20));
      const score = Math.min(99, 45 + overlap * 9 + budgetFit);
      return {
        id: item.id,
        score,
        brand: item.brand,
        title: item.title,
        meta: `${item.industry || '未分类'} · ${item.budget > 0 ? `预算 ${item.budget} 万` : '预算未记录'}`,
        lift: item.result_metric ? `${item.result_metric}${item.result_value ? `：${item.result_value}` : ''}` : '复盘指标未记录',
        source: item.source,
        summary: item.summary,
        real: true,
      } satisfies DisplayCase;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function Logo() {
  return <div className="brand"><span className="brand-mark">A</span><span>AdPilot</span><em>Beta</em></div>;
}

function parseCsv(content: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];
    if (char === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(value.trim());
      value = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = '';
    } else {
      value += char;
    }
  }
  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);
  if (rows.length < 2) return [];
  const headers = rows[0].map((header) => header.replace(/^\uFEFF/, '').trim());
  return rows.slice(1).map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ''])));
}

function normalizeCaseImport(row: Record<string, unknown>) {
  const get = (...keys: string[]) => keys.map((key) => row[key]).find((value) => value !== undefined && value !== '') ?? '';
  return {
    id: get('id', '案例ID'),
    brand: get('brand', '品牌'),
    title: get('title', '案例名称', '项目名称'),
    industry: get('industry', '行业'),
    objective: get('objective', '目标', '核心目标'),
    audience: get('audience', '人群', '目标人群'),
    budget: get('budget', '预算', '预算万元'),
    channels: get('channels', '渠道', '渠道组合'),
    period: get('period', '周期', '投放周期'),
    result_metric: get('result_metric', '结果指标', '核心指标'),
    result_value: get('result_value', '结果数值', '指标结果'),
    summary: get('summary', '复盘', '策略复盘'),
    source: get('source', '来源', '数据来源'),
  };
}

function CaseLibraryModal({ open, onClose, cases, onRefresh, notify }: {
  open: boolean;
  onClose: () => void;
  cases: CaseRecord[];
  onRefresh: () => Promise<void>;
  notify: (message: string) => void;
}) {
  const importRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [importing, setImporting] = useState(false);
  const filtered = cases.filter((item) => [item.brand, item.title, item.industry, item.objective, item.source].join(' ').toLowerCase().includes(query.toLowerCase()));

  if (!open) return null;

  const importCases = async (file?: File) => {
    if (!file) return;
    setImporting(true);
    try {
      const raw = await file.text();
      const parsed = file.name.toLowerCase().endsWith('.json')
        ? JSON.parse(raw)
        : parseCsv(raw);
      const rows = Array.isArray(parsed) ? parsed : parsed?.cases;
      if (!Array.isArray(rows) || rows.length === 0) throw new Error('文件中没有案例记录');
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cases: rows.map((item) => normalizeCaseImport(item as Record<string, unknown>)) }),
      });
      const result = await response.json() as { imported?: number; error?: string };
      if (!response.ok) throw new Error(result.error || '导入失败');
      await onRefresh();
      notify(`已导入 ${result.imported} 个真实案例`);
    } catch (error) {
      notify(error instanceof Error ? error.message : '案例导入失败');
    } finally {
      setImporting(false);
      if (importRef.current) importRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const csv = '\uFEFFbrand,title,industry,objective,audience,budget,channels,period,result_metric,result_value,summary,source\n示例品牌,夏季新品推广,食品饮料,品牌认知与电商转化,18-30岁城市年轻人,300,抖音40%;小红书30%;电商30%,2026年6-8月,成交ROI,2.6,填写真实复盘结论,内部项目复盘/2026-08';
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'AdPilot-真实案例导入模板.csv';
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const removeCase = async (item: CaseRecord) => {
    if (!window.confirm(`确认删除「${item.title}」吗？`)) return;
    const response = await fetch(`/api/cases?id=${encodeURIComponent(item.id)}`, { method: 'DELETE' });
    if (!response.ok) {
      notify('删除失败，请稍后重试');
      return;
    }
    await onRefresh();
    notify('案例已删除');
  };

  return <div className="modal-backdrop case-library-backdrop" role="presentation">
    <section className="case-library-modal" role="dialog" aria-modal="true" aria-labelledby="case-library-title">
      <div className="modal-head"><div><span>▦</span><div><small>TRACEABLE CASE LIBRARY</small><h3 id="case-library-title">真实案例库</h3></div></div><button aria-label="关闭案例库" onClick={onClose}>×</button></div>
      <div className="case-library-summary">
        <div><strong>{cases.length}</strong><span>已入库案例</span></div>
        <p>只保存结构化案例字段。每条记录必须填写来源，方案会显示引用出处；一次最多导入 100 条。</p>
        <div className="case-library-actions">
          <input ref={importRef} type="file" accept=".csv,.json" hidden onChange={(event) => { void importCases(event.target.files?.[0]); }} />
          <button onClick={downloadTemplate}>下载 CSV 模板</button>
          <button className="primary-button" disabled={importing} onClick={() => importRef.current?.click()}>{importing ? '正在导入…' : '＋ 导入 CSV / JSON'}</button>
        </div>
      </div>
      <div className="case-library-toolbar"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索品牌、行业、目标或来源…" /><span>{filtered.length} 条结果</span></div>
      <div className="case-library-list">
        {filtered.length > 0 ? filtered.map((item) => <article key={item.id} className="library-case-row">
          <span className="case-logo">{item.brand.slice(0, 1)}</span>
          <div><small>{item.industry || '未分类'} · {item.budget > 0 ? `${item.budget} 万` : '预算未记录'}</small><strong>{item.brand}｜{item.title}</strong><p>{item.summary || item.objective || '暂无复盘摘要'}</p><em>来源：{item.source}</em></div>
          <button onClick={() => { void removeCase(item); }}>删除</button>
        </article>) : <div className="empty-library"><span>⌁</span><strong>{cases.length ? '没有匹配结果' : '还没有真实案例'}</strong><p>{cases.length ? '换一个关键词试试。' : '下载模板并填写历史项目数据，然后导入。'}</p></div>}
      </div>
    </section>
  </div>;
}

function Sidebar({ onReset, onOpenCases, caseCount, notify }: { onReset: () => void; onOpenCases: () => void; caseCount: number; notify: (message: string) => void }) {
  return (
    <aside className="sidebar">
      <Logo />
      <nav className="nav-list" aria-label="主导航">
        <button className="nav-item active" onClick={onReset}><span>⌁</span>策略工作台</button>
        <button className="nav-item" onClick={onOpenCases}><span>▦</span>案例智库<i>{caseCount || '待导入'}</i></button>
        <button className="nav-item" onClick={() => notify('已为你定位到历史项目')}><span>◇</span>历史项目</button>
        <button className="nav-item" onClick={() => notify('团队空间功能即将开放')}><span>◎</span>团队空间</button>
      </nav>
      <div className="sidebar-note">
        <span>✦</span>
        <strong>从真实数据开始</strong>
        <p>接入企业案例库后，确认方案才会沉淀为团队经验。</p>
      </div>
      <div className="sidebar-bottom">
        <div className="usage-head"><p className="eyebrow">案例连接</p><strong>{caseCount ? `${caseCount} 条真实记录` : '等待导入'}</strong></div>
        <div className="usage"><span /></div>
        <div className="user-row"><span className="avatar">演</span><div><strong>演示用户</strong><small>尚未连接团队账号</small></div><button aria-label="用户菜单">•••</button></div>
      </div>
    </aside>
  );
}

function WelcomeView({ brief, setBrief, onGenerate, fileName, setFileName, caseCount, onOpenCases, notify }: {
  brief: string;
  setBrief: (value: string) => void;
  onGenerate: () => void;
  fileName: string;
  setFileName: (value: string) => void;
  caseCount: number;
  onOpenCases: () => void;
  notify: (message: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const acceptFile = async (file?: File) => {
    if (!file) return;
    const supported = /\.(pdf|doc|docx|ppt|pptx|txt)$/i.test(file.name);
    if (!supported) {
      notify('暂不支持该格式，请上传 PDF、Word、PPT 或 TXT');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      notify('文件超过 20MB，请压缩后重新上传');
      return;
    }
    setFileName(file.name);
    if (/\.txt$/i.test(file.name)) {
      const content = await file.text();
      setBrief(content);
      notify('TXT 文件已真实读取，可开始解析');
      return;
    }
    notify('已记录文件名；当前版本尚未解析此格式，请把 Brief 正文粘贴到下方');
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => { void acceptFile(event.target.files?.[0]); };
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    void acceptFile(event.dataTransfer.files?.[0]);
  };

  return (
    <div className="content-grid welcome-grid">
      <div className="main-column">
        <section className="hero-panel">
          <div className="hero-copy">
            <span className={`ai-badge ${caseCount ? 'connected' : ''}`}>✦ {caseCount ? `已连接 ${caseCount} 个真实案例` : '等待接入真实案例'}</span>
            <h2>让策略有出处，<br />让判断有依据。</h2>
            <p>解析业务目标、匹配已入库案例，并生成可编辑、可追溯、可导出的媒介策略。</p>
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
            <p>{fileName ? (/\.txt$/i.test(fileName) ? 'TXT 内容已读取' : '请继续在下方粘贴正文') : 'TXT 可直接读取；PDF、Word、PPT 暂需粘贴正文'}</p>
            <span className="soft-button">{fileName ? '更换文件' : '选择文件'}</span>
          </div>
          <div className="divider"><span>或者</span></div>
          <div className="label-row"><label htmlFor="brief-text">直接粘贴 Brief 内容</label><button onClick={() => setBrief(sampleBrief)}>使用示例</button></div>
          <textarea id="brief-text" value={brief} onChange={(event) => setBrief(event.target.value)} placeholder="粘贴品牌背景、营销目标、目标人群、预算与排期等信息…" />
          <div className="input-meta"><span>{brief.length} 字</span><span>建议包含：目标 · 受众 · 预算 · 周期</span></div>
          <button className="generate-button" disabled={!brief.trim()} onClick={onGenerate}><span>✦</span>{caseCount ? `基于 ${caseCount} 个真实案例生成策略` : '解析 Brief 并生成演示策略'} <b>→</b></button>
        </section>
      </div>

      <aside className="right-column">
        <section className="flow-card">
          <p className="eyebrow">HOW IT WORKS</p><h3>从需求到策略，只需 4 步</h3>
          {workflow.map((item, index) => <div className="flow-item" key={item[0]}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{item[0]}</strong><small>{item[1]}</small></div></div>)}
        </section>
        <section className={`case-card ${caseCount ? 'connected-card' : ''}`} id="cases">
          <div className="case-top"><span>{caseCount ? '真实案例库' : '案例智库'}</span><strong>{caseCount || 0}</strong></div>
          <p>{caseCount ? '案例已持久化存储，生成方案时会计算规则匹配度并展示来源' : '导入企业历史案例后，启用可追溯检索与真实引用'}</p>
          <div className="case-tags"><span>{caseCount ? '数据已连接' : 'CSV / JSON'}</span><span>来源必填</span><span>可删除更新</span></div>
          <button className="case-connect-button" onClick={onOpenCases}>{caseCount ? '管理真实案例 →' : '＋ 接入真实案例'}</button>
        </section>
        <section className="recent-card">
          <div className="mini-heading"><strong>示例项目</strong><button onClick={() => notify('真实历史项目功能尚未接入')}>说明</button></div>
          <button className="recent-row" onClick={() => notify('这是界面示例，尚未连接真实历史项目')}><span className="recent-icon peach">果</span><div><strong>果味茶夏日上新</strong><small>演示项目</small></div><b>→</b></button>
          <button className="recent-row" onClick={() => notify('这是界面示例，尚未连接真实历史项目')}><span className="recent-icon blue">车</span><div><strong>新能源车型上市</strong><small>演示项目</small></div><b>→</b></button>
        </section>
      </aside>
    </div>
  );
}

function ProcessingView({ step, caseCount }: { step: number; caseCount: number }) {
  return (
    <section className="processing-card" aria-live="polite">
      <div className="processing-visual"><div className="pulse-ring ring-one" /><div className="pulse-ring ring-two" /><span>✦</span></div>
      <p className="eyebrow">{caseCount ? 'TRACEABLE CASE ENGINE' : 'DEMO RULE ENGINE'}</p>
      <h2>{caseCount ? '正在匹配真实案例与 Brief' : '正在按演示规则解析 Brief'}</h2>
      <p className="processing-sub">{caseCount ? `检索 ${caseCount} 条已入库记录，所有案例结论都会保留来源。` : '当前没有真实案例，结果仅展示产品流程，不冒充真实数据结论。'}</p>
      <div className="processing-list">
        {processingSteps.map((item, index) => {
          const detail = index === 1 && caseCount ? `正在 ${caseCount} 条真实案例中计算可解释匹配度…` : item[1];
          return <div className={`processing-item ${index < step ? 'done' : ''} ${index === step ? 'current' : ''}`} key={item[0]}>
            <span>{index < step ? '✓' : index + 1}</span><div><strong>{item[0]}</strong><small>{detail}</small></div>{index === step && <i>处理中</i>}
          </div>
        })}
      </div>
      <div className="progress-track"><span style={{ width: `${Math.min(100, (step + 1) * 25)}%` }} /></div>
      <small className="wait-note">演示计算还需约 {Math.max(2, 8 - step * 2)} 秒</small>
    </section>
  );
}

function ResultView({ brief, caseLibrary, onReset, notify }: { brief: string; caseLibrary: CaseRecord[]; onReset: () => void; notify: (message: string) => void }) {
  const [tab, setTab] = useState<'strategy' | 'cases'>('strategy');
  const [approved, setApproved] = useState(false);
  const [editing, setEditing] = useState(false);
  const [scheduleExpanded, setScheduleExpanded] = useState(false);
  const [exporting, setExporting] = useState(false);
  const insights = parseBrief(brief);
  const hasRealCases = caseLibrary.length > 0;
  const matchedCases = hasRealCases ? matchCases(brief, caseLibrary) : demoCases;
  const initialDetails = {
    objective: insights.objective,
    audience: insights.audience,
    market: insights.market,
    budget: `${insights.budget} 万 · ${insights.period}`,
  };
  const [details, setDetails] = useState(initialDetails);
  const [draft, setDraft] = useState(initialDetails);
  const budgetTotal = Number(details.budget.match(/\d+(?:\.\d+)?/)?.[0] || insights.budget);
  const campaignSeason = /夏季|夏日|6\s*[-—–至到~]\s*8\s*月/.test(brief) ? '2026 夏季' : '2026';

  const openEditor = () => {
    setDraft(details);
    setEditing(true);
  };

  const saveDetails = () => {
    setDetails(draft);
    setEditing(false);
    setApproved(false);
    notify('需求字段已更新，策略建议同步刷新');
  };

  const approve = () => {
    setApproved(true);
    notify('策略已确认，可立即导出；方案版本存储将在下一步接入');
  };

  const exportWord = async () => {
    setExporting(true);
    try {
      const bodyRun = (text: string, bold = false, color = '263A34') => new TextRun({
        text,
        bold,
        color,
        font: 'Microsoft YaHei',
        size: 21,
      });
      const cell = (text: string, bold = false) => new TableCell({
        children: [new Paragraph({ children: [bodyRun(text, bold)] })],
      });
      const heading = (text: string) => new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 320, after: 140 },
        children: [new TextRun({ text, bold: true, color: '153A30', font: 'Microsoft YaHei', size: 28 })],
      });
      const channelRows = channels.map((channel) => new TableRow({
        children: [
          cell(channel.name),
          cell(`${channel.value}%`),
          cell(`${Math.round(budgetTotal * channel.value / 100)} 万元`),
        ],
      }));
      const analysisRows = [
        ['核心目标', details.objective],
        ['目标人群', details.audience],
        ['市场范围', details.market],
        ['预算 / 周期', details.budget],
      ].map(([label, value]) => new TableRow({ children: [cell(label, true), cell(value)] }));
      const document = new Document({
        creator: 'AdPilot',
        title: `${insights.brand}广告投放策略方案`,
        description: '由 AdPilot 导出的可编辑策略方案',
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 120 },
              children: [new TextRun({ text: `${insights.brand} · ${campaignSeason}整合营销方案`, bold: true, color: '153A30', font: 'Microsoft YaHei', size: 38 })],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 360 },
              children: [new TextRun({ text: `AdPilot 策略工作台 · ${new Date().toLocaleDateString('zh-CN')}`, color: '6F817A', font: 'Microsoft YaHei', size: 19 })],
            }),
            heading('一、原始 Campaign Brief'),
            new Paragraph({ spacing: { after: 200 }, children: [bodyRun(brief)] }),
            heading('二、需求解析'),
            new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: analysisRows }),
            new Paragraph({ spacing: { before: 160 }, children: [bodyRun(`策略标签：${insights.tags.join(' / ')}`, true)] }),
            heading('三、渠道预算建议'),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [new TableRow({ children: [cell('渠道', true), cell('占比', true), cell('预算金额', true)] }), ...channelRows],
            }),
            new Paragraph({ spacing: { before: 160 }, children: [bodyRun('组合逻辑：', true), bodyRun('抖音负责规模触达，小红书建立真实口碑，天猫承接高意向转化，B站用于深度内容破圈。')] }),
            heading('四、三阶段投放节奏'),
            new Paragraph({ bullet: { level: 0 }, children: [bodyRun('预热种草：KOC 尝鲜、核心卖点验证与话题预埋。')] }),
            new Paragraph({ bullet: { level: 0 }, children: [bodyRun('集中爆发：达人矩阵、平台资源与互动话题同步启动。')] }),
            new Paragraph({ bullet: { level: 0 }, children: [bodyRun('长尾转化：搜索承接、高意向人群追投与品牌资产沉淀。')] }),
            heading('五、成效衡量框架'),
            new Paragraph({ bullet: { level: 0 }, children: [bodyRun('品牌层：有效曝光、品牌词搜索增量、目标人群认知提升。')] }),
            new Paragraph({ bullet: { level: 0 }, children: [bodyRun('内容层：完播率、互动率、收藏率、正向评论率与优质内容占比。')] }),
            new Paragraph({ bullet: { level: 0 }, children: [bodyRun('转化层：进店成本、加购成本、成交 ROI 与新客占比。')] }),
            heading(`六、参考案例（${hasRealCases ? '真实案例库引用' : '演示数据'}）`),
            ...matchedCases.map((item) => new Paragraph({ bullet: { level: 0 }, children: [bodyRun(`${item.brand}｜${item.title}｜${item.meta}｜${item.lift}｜来源：${item.source}`)] })),
            heading('重要说明'),
            new Paragraph({
              spacing: { after: 160 },
              children: [bodyRun(hasRealCases ? '本方案引用已入库真实案例，但渠道配比与成效数字仍属于规则建议和待校准假设，不应直接作为商业承诺。请由策略负责人结合最新平台数据复核。' : '当前没有真实案例，方案使用规则解析与演示数据，不应直接用于商业决策。请先导入有来源的历史案例，并由策略负责人复核。', true, '8A5B19')],
            }),
          ],
        }],
      });

      const blob = await Packer.toBlob(document);
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement('a');
      const safeBrand = insights.brand.replace(/[\\/:*?"<>|]/g, '-');
      anchor.href = url;
      anchor.download = `${safeBrand}-广告投放策略方案.docx`;
      window.document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify('Word 方案已导出，可继续编辑');
    } catch {
      notify('导出失败，请稍后重试');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="result-wrap">
      <div className="result-banner">
        <div className="result-check">✓</div>
        <div><span>{hasRealCases ? '可追溯策略已生成' : '演示策略已生成'}</span><h2>{insights.brand} · {campaignSeason}整合营销方案</h2><p>{hasRealCases ? `已检索 ${caseLibrary.length} 条真实记录，并引用最相关的 ${matchedCases.length} 条案例` : '当前未连接真实案例，结果仅按演示规则推演'}</p></div>
        <div className="result-actions"><button onClick={exportWord} disabled={exporting}>{exporting ? '正在导出…' : '⇩ 导出 Word'}</button><button onClick={() => window.print()}>打印 / PDF</button><button onClick={onReset}>＋ 新建策略</button></div>
      </div>

      <div className="result-tabs" role="tablist">
        <button className={tab === 'strategy' ? 'active' : ''} onClick={() => setTab('strategy')} role="tab">策略方案</button>
        <button className={tab === 'cases' ? 'active' : ''} onClick={() => setTab('cases')} role="tab">参考案例 <span>{matchedCases.length}</span></button>
      </div>

      {tab === 'strategy' ? <>
        <section className="analysis-card">
          <div className="card-title"><div><span className="title-icon">⌁</span><div><p>BRIEF ANALYSIS</p><h3>需求解析</h3></div></div><button onClick={openEditor}>✎ 编辑</button></div>
          <div className="analysis-grid">
            <div><span>核心目标</span><strong>{details.objective}</strong><p>以品牌词搜索提升与有效转化为主指标</p></div>
            <div><span>目标人群</span><strong>{details.audience}</strong><p>聚焦高意向人群的场景化内容触达</p></div>
            <div><span>市场范围</span><strong>{details.market}</strong><p>优先覆盖高潜城市并逐步扩量</p></div>
            <div><span>预算 / 周期</span><strong>{details.budget}</strong><p>预热 15% · 爆发 65% · 长尾 20%</p></div>
          </div>
          <div className="tag-row">{insights.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
        </section>

        <div className="strategy-grid">
          <section className="budget-card">
            <div className="card-title"><div><span className="title-icon">◔</span><div><p>MEDIA MIX</p><h3>渠道预算建议</h3></div></div><span className="confidence">{hasRealCases ? '案例辅助 · 规则校验' : '演示规则'}</span></div>
            <div className="budget-content">
              <div className="donut" aria-label="渠道预算占比"><div><strong>{budgetTotal}</strong><span>总预算 / 万元</span></div></div>
              <div className="channel-list">
                {channels.map((channel) => <div key={channel.name}><span className="channel-dot" style={{ background: channel.color }} /><strong>{channel.name}</strong><span>{channel.value}%</span><b>{Math.round(budgetTotal * channel.value / 100)} 万</b></div>)}
              </div>
            </div>
            <div className="strategy-note"><span>✦</span><p><strong>组合逻辑：</strong>抖音负责规模触达，小红书建立真实口碑，天猫承接高意向转化，B站用于深度内容破圈。</p></div>
          </section>

          <section className="kpi-card">
            <div className="card-title"><div><span className="title-icon">↗</span><div><p>EXPECTED IMPACT</p><h3>核心成效假设（待真实数据校准）</h3></div></div></div>
            <div className="kpi-grid"><div><span>示例曝光假设</span><strong>1.2<small>亿</small></strong><em>待历史 CPM 校准</em></div><div><span>示例互动率</span><strong>5.8<small>%</small></strong><em>待平台基准校准</em></div><div><span>示例转化 ROI</span><strong>2.6</strong><em>待真实归因数据校准</em></div><div><span>示例搜索提升</span><strong>+135<small>%</small></strong><em>待品牌指数校准</em></div></div>
          </section>
        </div>

        <section className="timeline-card">
          <div className="card-title"><div><span className="title-icon">◫</span><div><p>CAMPAIGN RHYTHM</p><h3>三阶段投放节奏</h3></div></div><button onClick={() => setScheduleExpanded((value) => !value)}>{scheduleExpanded ? '收起详细排期 ↑' : '查看详细排期 →'}</button></div>
          <div className="timeline">
            <div className="timeline-head"><span /><span>6 月</span><span>7 月</span><span>8 月</span></div>
            <div className="timeline-row"><strong><i>01</i>预热种草<small>建立期待</small></strong><div><span className="bar warm" style={{ width: '30%' }}>KOC 尝鲜 + 话题预埋</span></div></div>
            <div className="timeline-row"><strong><i>02</i>集中爆发<small>规模破圈</small></strong><div><span className="bar burst" style={{ left: '20%', width: '55%' }}>达人矩阵 + 挑战赛 + 开屏</span></div></div>
            <div className="timeline-row"><strong><i>03</i>长尾转化<small>收口沉淀</small></strong><div><span className="bar tail" style={{ left: '62%', width: '38%' }}>搜索承接 + 人群追投</span></div></div>
          </div>
          {scheduleExpanded && <div className="cadence-details">
            <div><span>06.05</span><strong>首批 KOC 内容上线</strong><small>验证卖点与评论反馈</small></div>
            <div><span>07.01</span><strong>全渠道集中爆发</strong><small>达人矩阵与平台资源同步启动</small></div>
            <div><span>08.12</span><strong>高意向人群追投</strong><small>搜索承接并沉淀品牌资产</small></div>
          </div>}
        </section>

        <section className="approval-card">
          <div><span className="approval-icon">{approved ? '✓' : '◎'}</span><div><h3>{approved ? '这份策略已确认' : '最后一步：由你做判断'}</h3><p>{approved ? '方案已在当前页面确认，可继续导出或创建新策略。' : hasRealCases ? '案例引用真实可追溯，策略判断仍由人把控；请复核预算、平台价格和 KPI 假设。' : '当前没有真实案例，仅供演示；请先接入案例库再用于实际工作。'}</p></div></div>
          <div><button onClick={openEditor}>需要调整</button><button className={approved ? 'approved' : ''} onClick={approve}>{approved ? '✓ 已确认' : '确认并沉淀策略'}</button></div>
        </section>
      </> : <section className="reference-section">
        <div className="reference-intro"><div><p className="eyebrow">{hasRealCases ? 'TRACEABLE CASE MATCHING' : 'DEMO CASE MATCHING'}</p><h3>{hasRealCases ? '与当前 Brief 最相关的真实案例' : '与当前 Brief 相关的演示案例'}</h3><span>{hasRealCases ? '匹配度由关键词重合与预算接近度计算，不冒充模型置信度' : '当前匹配分数为界面示例，导入真实数据后再计算规则匹配度'}</span></div><strong>{hasRealCases ? `检索范围：${caseLibrary.length} 条真实记录` : '当前：3 个演示案例'}</strong></div>
        <div className="reference-grid">{matchedCases.map((item, index) => <article className="reference-card" key={item.id}><div className="match-score"><strong>{item.score}%</strong><span>{item.real ? '规则匹配' : '示例匹配'}</span></div><span className={`case-logo logo-${index}`}>{item.brand.slice(0, 1)}</span><div><small>{item.brand}</small><h4>{item.title}</h4><p>{item.meta}</p></div><footer><span>{item.lift}</span><button onClick={() => notify(item.real ? `来源：${item.source}` : '这是演示案例，没有真实来源')}>{item.real ? '查看数据来源 →' : '查看演示说明 →'}</button></footer></article>)}</div>
        <div className="case-insight"><span>✦</span><div><strong>{hasRealCases ? '案例使用边界' : '待验证策略假设'}</strong><p>{hasRealCases ? '真实案例只提供经验参照，不等于本次 Campaign 的结果预测；所有指标仍需结合当前媒体价格和投放测试校准。' : '可测试在爆发前 2-3 周进行 KOC 口碑铺垫，并用真实投放结果验证搜索承接预算占比。'}</p></div></div>
      </section>}
      {editing && <div className="modal-backdrop" role="presentation">
        <section className="edit-modal" role="dialog" aria-modal="true" aria-labelledby="edit-title">
          <div className="modal-head"><div><span>✦</span><div><small>HUMAN IN THE LOOP</small><h3 id="edit-title">调整需求解析</h3></div></div><button aria-label="关闭编辑面板" onClick={() => setEditing(false)}>×</button></div>
          <p className="modal-copy">修改后，渠道预算与策略建议会使用新的需求字段重新计算。</p>
          <div className="edit-grid">
            <label>核心目标<input value={draft.objective} onChange={(event) => setDraft({ ...draft, objective: event.target.value })} /></label>
            <label>目标人群<input value={draft.audience} onChange={(event) => setDraft({ ...draft, audience: event.target.value })} /></label>
            <label>市场范围<input value={draft.market} onChange={(event) => setDraft({ ...draft, market: event.target.value })} /></label>
            <label>预算 / 周期<input value={draft.budget} onChange={(event) => setDraft({ ...draft, budget: event.target.value })} /></label>
          </div>
          <div className="modal-actions"><button onClick={() => setEditing(false)}>取消</button><button onClick={saveDetails} disabled={Object.values(draft).some((value) => !value.trim())}>保存并更新策略</button></div>
        </section>
      </div>}
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<'welcome' | 'processing' | 'result'>('welcome');
  const [brief, setBrief] = useState('');
  const [fileName, setFileName] = useState('');
  const [step, setStep] = useState(0);
  const [toast, setToast] = useState('');
  const [caseLibrary, setCaseLibrary] = useState<CaseRecord[]>([]);
  const [caseLibraryOpen, setCaseLibraryOpen] = useState(false);

  const loadCases = useCallback(async () => {
    const response = await fetch('/api/cases?limit=200');
    if (!response.ok) throw new Error('案例库连接失败');
    const data = await response.json() as { cases: CaseRecord[] };
    setCaseLibrary(data.cases);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/cases?limit=200', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('案例库连接失败');
        return response.json() as Promise<{ cases: CaseRecord[] }>;
      })
      .then((data) => setCaseLibrary(data.cases))
      .catch((error: Error) => {
        if (error.name !== 'AbortError') setToast('真实案例库暂时无法连接');
      });
    return () => controller.abort();
  }, []);

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
      <Sidebar onReset={reset} onOpenCases={() => setCaseLibraryOpen(true)} caseCount={caseLibrary.length} notify={setToast} />
      <section className="workspace" id="workspace">
        <header className="topbar">
          <div><p className="eyebrow">智能投放策略工作台</p><h1>{view === 'result' ? '策略方案' : '欢迎使用 AdPilot'}</h1></div>
          <div className="top-actions"><button className={`case-status-button ${caseLibrary.length ? 'connected' : ''}`} onClick={() => setCaseLibraryOpen(true)}><i />{caseLibrary.length ? `真实案例 ${caseLibrary.length}` : '接入真实案例'}</button><button className="icon-button" aria-label="搜索">⌕</button><button className="icon-button notification" aria-label="通知">◌<i /></button>{view === 'processing' && <button className="primary-button" onClick={reset}>退出分析</button>}</div>
        </header>
        {view === 'welcome' && <WelcomeView brief={brief} setBrief={setBrief} onGenerate={start} fileName={fileName} setFileName={setFileName} caseCount={caseLibrary.length} onOpenCases={() => setCaseLibraryOpen(true)} notify={setToast} />}
        {view === 'processing' && <ProcessingView step={step} caseCount={caseLibrary.length} />}
        {view === 'result' && <ResultView brief={brief} caseLibrary={caseLibrary} onReset={reset} notify={setToast} />}
      </section>
      <CaseLibraryModal open={caseLibraryOpen} onClose={() => setCaseLibraryOpen(false)} cases={caseLibrary} onRefresh={loadCases} notify={setToast} />
      {toast && <div className="toast" role="status"><span>✓</span>{toast}</div>}
    </main>
  );
}
