"use client";

interface IntentInputProps {
  value: string;
  examples: string[];
  isLoading: boolean;
  onChange: (value: string) => void;
  onExampleClick: (value: string) => void;
  onSubmit: () => void;
}

const MAX_INPUT_LENGTH = 1000;

export function IntentInput({
  value,
  examples,
  isLoading,
  onChange,
  onExampleClick,
  onSubmit,
}: IntentInputProps) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <label htmlFor="intent" className="block text-sm font-semibold text-ink">
        输入一句中文意图
      </label>
      <textarea
        id="intent"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={MAX_INPUT_LENGTH}
        placeholder="例如：帮我写一个挑战杯项目计划书"
        className="mt-3 min-h-32 w-full resize-y rounded-md border border-line bg-cloud p-4 text-base leading-7 outline-none transition focus:border-accent focus:bg-white"
      />
      <p className="mt-2 text-right text-xs text-slate-500">
        {value.length} / {MAX_INPUT_LENGTH}
      </p>
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
        {isLoading ? "正在生成..." : "生成结构化 Prompt"}
      </button>
    </section>
  );
}
