interface ClarifyingQuestionsProps {
  questions: string[];
}

export function ClarifyingQuestions({ questions }: ClarifyingQuestionsProps) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <h2 className="text-lg font-semibold">缺失信息追问</h2>
      {questions.length ? (
        <ol className="mt-4 space-y-3">
          {questions.map((question, index) => (
            <li key={question} className="flex gap-3 rounded-md bg-cloud p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
                {index + 1}
              </span>
              <span className="leading-6">{question}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 text-sm text-slate-500">当前信息足够，可以先生成 Prompt。</p>
      )}
    </section>
  );
}
