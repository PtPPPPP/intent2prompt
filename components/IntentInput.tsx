"use client";

import { MAX_INPUT_LENGTH, type TargetTool } from "@/lib/types";

interface IntentInputProps {
  value: string;
  examples: string[];
  isLoading: boolean;
  targetTool: TargetTool;
  onChange: (value: string) => void;
  onTargetToolChange: (value: TargetTool) => void;
  onExampleClick: (value: string) => void;
  onSubmit: () => void;
}

export function IntentInput({
  value,
  examples,
  isLoading,
  targetTool,
  onChange,
  onTargetToolChange,
  onExampleClick,
  onSubmit,
}: IntentInputProps) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <label htmlFor="intent" className="block text-sm font-semibold text-ink">
        你想让 AI 帮你做什么？
      </label>
      <textarea
        id="intent"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={MAX_INPUT_LENGTH}
        placeholder="例如：让 Codex 开发一个社团报名系统"
        className="mt-3 min-h-32 w-full resize-y rounded-md border border-line bg-cloud p-4 text-base leading-7 outline-none transition focus:border-accent focus:bg-white"
      />
      <p className="mt-2 text-right text-xs text-slate-500">
        {value.length} / {MAX_INPUT_LENGTH}
      </p>
      <div className="mt-4">
        <label className="text-sm font-medium text-slate-700">
          目标 AI
          <select value={targetTool} onChange={(event) => onTargetToolChange(event.target.value as TargetTool)} className="mt-1 block w-full rounded-md border border-line bg-white px-3 py-2">
            <option value="auto">自动识别</option>
            <option value="general">通用 AI</option>
            <option value="chatgpt">ChatGPT</option>
            <option value="claude">Claude</option>
            <option value="codex">Codex</option>
            <option value="claude_code">Claude Code</option>
            <option value="gemini">Gemini</option>
            <option value="image_generation">图像生成 AI</option>
          </select>
        </label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {examples.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => onExampleClick(example)}
            className="rounded-md border border-line bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-accent hover:text-accent"
          >
            {example}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onSubmit}
        disabled={isLoading}
        className="mt-5 w-full rounded-md bg-accent px-4 py-3 text-base font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isLoading ? "正在生成..." : "生成任务指令"}
      </button>
    </section>
  );
}
