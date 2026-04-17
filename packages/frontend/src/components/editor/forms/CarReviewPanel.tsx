import { useState } from 'react';
import { Sparkles, Loader2, X, ChevronDown, ChevronRight, Copy } from 'lucide-react';
import type { CarReviewResult } from '../../../lib/types';
import { reviewCar } from '../../../lib/api';

interface Props {
  challenge: string;
  action: string;
  result: string;
  lang: 'en' | 'de';
  /** Called when user clicks "Apply" on a suggestion */
  onApply: (field: 'challenge' | 'action' | 'result', text: string) => void;
}

function ScoreDot({ score }: { score: number }) {
  const color =
    score >= 4 ? 'bg-green-500' :
    score >= 3 ? 'bg-yellow-400' :
    'bg-red-500';
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${color}`} title={`${score}/5`} />
  );
}

export default function CarReviewPanel({ challenge, action, result, lang, onApply }: Props) {
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<CarReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const hasContent = challenge.trim() || action.trim() || result.trim();

  async function handleReview() {
    setLoading(true);
    setError(null);
    try {
      const result_ = await reviewCar(challenge, action, result, lang);
      setReview(result_);
      setExpanded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Review failed');
    } finally {
      setLoading(false);
    }
  }

  const btnBase = 'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors';

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleReview}
          disabled={loading || !hasContent}
          className={`${btnBase} bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-900/40 dark:text-violet-300 dark:hover:bg-violet-800/60 disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {loading
            ? <Loader2 size={12} className="animate-spin" />
            : <Sparkles size={12} />}
          {loading ? 'Reviewing…' : 'Review with AI'}
        </button>
        {review && (
          <button
            type="button"
            aria-label="Dismiss review"
            onClick={() => { setReview(null); setError(null); }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}

      {review && (
        <div className="mt-2 rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/40 text-sm overflow-hidden">
          {/* Header */}
          <button
            type="button"
            className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-violet-100 dark:hover:bg-violet-900/30"
            onClick={() => setExpanded((v) => !v)}
          >
            <div className="flex items-center gap-3">
              <span className="font-medium text-violet-800 dark:text-violet-200 text-xs uppercase tracking-wide">AI Review</span>
              <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                <ScoreDot score={review.scores.challenge} /> C
                <ScoreDot score={review.scores.action} /> A
                <ScoreDot score={review.scores.result} /> R
                <span className="ml-1 text-gray-400">({review.scores.challenge + review.scores.action + review.scores.result}/15)</span>
              </div>
            </div>
            {expanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
          </button>

          {expanded && (
            <div className="px-3 pb-3 space-y-3 border-t border-violet-200 dark:border-violet-800">
              {/* Overall feedback */}
              <p className="text-xs text-gray-700 dark:text-gray-300 pt-2">{review.overallFeedback}</p>

              {/* Issues */}
              {review.issues.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Issues</p>
                  <ul className="space-y-0.5">
                    {review.issues.map((issue, i) => (
                      <li key={i} className="text-xs text-amber-700 dark:text-amber-400 flex gap-1">
                        <span>•</span><span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions */}
              {(['challenge', 'action', 'result'] as const).map((field) => {
                const suggestion = review.suggestions[field];
                if (!suggestion) return null;
                const score = review.scores[field];
                return (
                  <div key={field} className="rounded-md border border-violet-200 dark:border-violet-700 bg-white dark:bg-gray-800 p-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 capitalize">
                        {field} <ScoreDot score={score} /> <span className="font-normal text-gray-400">{score}/5</span>
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          title="Copy suggestion"
                          aria-label={`Copy ${field} suggestion`}
                          onClick={() => navigator.clipboard.writeText(suggestion)}
                          className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <Copy size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onApply(field, suggestion)}
                          className="text-xs text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-200 font-medium"
                        >
                          Apply →
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{suggestion}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
