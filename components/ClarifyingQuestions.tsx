"use client";

import type { ClarificationQuestion } from "@/lib/types";

interface ClarifyingQuestionsProps {
  questions: ClarificationQuestion[];
  answers: Record<string, string>;
  isLoading: boolean;
  onAnswerChange: (id: string, value: string) => void;
  onSubmit: () => void;
}

export function ClarifyingQuestions({ questions, answers, isLoading, onAnswerChange, onSubmit }: ClarifyingQuestionsProps) {
  if (!questions.length) return null;

  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <h2 className="text-lg font-semibold">补充信息</h2>
      <p className="mt-1 text-sm text-slate-500">这些信息会明显影响结果；留空即可按默认假设生成。</p>
      <div className="mt-4 space-y-3">
        {questions.map((question, index) => (
          <label key={question.id} className="block rounded-md bg-cloud p-3 text-sm">
            <span className="font-medium">{index + 1}. {question.question}</span>
            <input value={answers[question.id] ?? ""} onChange={(event) => onAnswerChange(question.id, event.target.value)} placeholder={question.defaultAnswer} className="mt-2 block w-full rounded border border-line bg-white px-3 py-2" />
          </label>
        ))}
      </div>
      <button type="button" onClick={onSubmit} disabled={isLoading} className="mt-4 rounded-md border border-accent px-4 py-2 text-sm font-medium text-accent transition hover:bg-blue-50 disabled:cursor-not-allowed">
        按默认假设重新生成
      </button>
    </section>
  );
}
