import React, { useState } from 'react';
import { BlueprintPhase } from '../data/blueprintData';
import { Terminal, Copy, Check, Sparkles, Send } from 'lucide-react';

interface BlueprintSpecCompilerProps {
  phases: BlueprintPhase[];
  activePhaseId: 'p1' | 'p2' | 'p3' | 'p4' | 'p5';
}

export const BlueprintSpecCompiler: React.FC<BlueprintSpecCompilerProps> = ({
  phases,
  activePhaseId,
}) => {
  const currentPhase = phases.find((p) => p.id === activePhaseId) || phases[0];
  const [queryInput, setQueryInput] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [customQueryTitle, setCustomQueryTitle] = useState<string>(
    'Phase 03 Power & Thermal System Blueprint Specification'
  );

  const handleRunQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim()) return;
    setCustomQueryTitle(queryInput.trim());
    setQueryInput('');
  };

  const markdownContent = `### 🗂️ PHASE STATUS
${currentPhase.title} | ${currentPhase.constraints}

### 📐 BLUEPRINT SPECIFICATIONS
${currentPhase.specs
  .map(
    (s) =>
      `• **${s.parameter}** (${s.category}): ${s.specification} [Tolerance: ${s.tolerance}]`
  )
  .join('\n')}

### 🛠️ COMPONENT DEPLOYMENT TASKLIST
${currentPhase.tasks
  .map(
    (t) =>
      `• **[${t.code}]** ${t.title} (${t.assignedZone})\n   ➔ ${t.inputNode} -> ${t.processNode} -> ${t.outputNode}`
  )
  .join('\n')}

### 🛡️ CRITICAL CONSIDERATIONS
• **Scalability**: ${currentPhase.pillars.scalability}
• **Reliability**: ${currentPhase.pillars.reliability}
• **Security**: ${currentPhase.pillars.security}
• **Efficiency**: ${currentPhase.pillars.efficiency}
• **Compliance**: ${currentPhase.pillars.compliance}`;

  const copyToClipboard = () => {
    navigator.clipboard?.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="spec-compiler" className="py-16 lg:py-24 border-b border-slate-800/90 bg-[#07090E]">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-blue-400 mb-2">
              <span>SYSTEM PROMPT SPECIFICATION ENGINE</span>
              <span aria-hidden="true">·</span>
              <span>4-PART STRUCTURED BLUEPRINT OUTPUT</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Live Blueprint Dashboard Compiler
            </h2>
          </div>
          <button
            onClick={copyToClipboard}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-mono flex items-center gap-2 transition-colors cursor-pointer self-start"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-blue-400" />}
            <span>{copied ? 'Copied Markdown' : 'Copy Dashboard Markdown'}</span>
          </button>
        </div>

        {/* Input prompt line */}
        <form onSubmit={handleRunQuery} className="mb-8 flex gap-3">
          <input
            type="text"
            placeholder="Type an engineering query (e.g. 'Optimize Phase 03 Generator Positioning and Cold Aisle CFM')..."
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-mono"
          />
          <button
            type="submit"
            className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Compile</span>
          </button>
        </form>

        {/* 4 Clear Markdown Components Container */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <span className="text-xs font-mono text-slate-500">QUERY: {customQueryTitle}</span>
          </div>

          {/* 1. 🗂️ PHASE STATUS */}
          <div className="space-y-2 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-mono font-bold text-blue-400 flex items-center gap-2">
              <span>🗂️ PHASE STATUS</span>
            </h4>
            <div className="text-sm font-semibold text-white">
              {currentPhase.title} |{' '}
              <span className="text-slate-300 font-normal">{currentPhase.constraints}</span>
            </div>
          </div>

          {/* 2. 📐 BLUEPRINT SPECIFICATIONS */}
          <div className="space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-mono font-bold text-blue-400 flex items-center gap-2">
              <span>📐 BLUEPRINT SPECIFICATIONS</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {currentPhase.specs.map((spec, i) => (
                <div key={i} className="p-3 bg-slate-900/80 rounded-lg border border-slate-800/80 text-xs">
                  <div className="text-amber-400 font-mono font-semibold">{spec.parameter}</div>
                  <div className="text-slate-300 mt-1">{spec.specification}</div>
                  <div className="text-[11px] font-mono text-slate-500 mt-1">Tol: {spec.tolerance}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. 🛠️ COMPONENT DEPLOYMENT TASKLIST */}
          <div className="space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-mono font-bold text-blue-400 flex items-center gap-2">
              <span>🛠️ COMPONENT DEPLOYMENT TASKLIST</span>
            </h4>
            <div className="space-y-2">
              {currentPhase.tasks.map((task) => (
                <div key={task.id} className="p-3 bg-slate-900/80 rounded-lg border border-slate-800/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-mono text-blue-400 font-bold mr-2">[{task.code}]</span>
                    <span className="text-slate-200 font-medium">{task.title}</span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800 shrink-0">
                    <span className="text-slate-300">{task.inputNode}</span> ➔{' '}
                    <span className="text-blue-400">{task.processNode}</span> ➔{' '}
                    <span className="text-emerald-400">{task.outputNode}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. 🛡️ CRITICAL CONSIDERATIONS */}
          <div className="space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-mono font-bold text-blue-400 flex items-center gap-2">
              <span>🛡️ CRITICAL CONSIDERATIONS</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800/80">
                <span className="font-mono text-blue-400 font-semibold block mb-1">Scalability</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">{currentPhase.pillars.scalability}</p>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800/80">
                <span className="font-mono text-emerald-400 font-semibold block mb-1">Reliability</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">{currentPhase.pillars.reliability}</p>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800/80">
                <span className="font-mono text-amber-400 font-semibold block mb-1">Security</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">{currentPhase.pillars.security}</p>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800/80">
                <span className="font-mono text-cyan-300 font-semibold block mb-1">Efficiency</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">{currentPhase.pillars.efficiency}</p>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800/80">
                <span className="font-mono text-slate-200 font-semibold block mb-1">Compliance</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">{currentPhase.pillars.compliance}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
