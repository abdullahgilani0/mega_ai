import { Plus } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const QUESTIONS = [
    [
        'Will checking my matches affect my credit score?',
        'No. MEGA runs a soft credit check, which lenders cannot see and which does not change your score. A lender only runs a full check if you apply with them through your broker.',
    ],
    [
        'Is MEGA a lender? Does it approve my loan?',
        'Neither. MEGA compares your situation with lenders’ published policies and shortlists the ones that fit. A licensed broker reviews that shortlist, and the lender makes the final decision.',
    ],
    [
        'Why do you want to connect to my bank?',
        'Connecting through the Consumer Data Right is read-only and replaces uploading months of statements. It is faster and more accurate, and you can withdraw access at any time. PDF statements still work if you prefer.',
    ],
    [
        'What does it cost me?',
        'Nothing to see your matches. Brokers are usually paid commission by the lender when a loan settles, and your credit guide tells you exactly how before you proceed. Commission never changes how lenders are ranked for you.',
    ],
    [
        'What happens to my documents and face scan?',
        'Documents are encrypted and only seen by people working on your application. For the face scan we keep the result, not the scan itself. Your privacy centre shows who accessed your file and lets you download or request deletion of your data.',
    ],
    [
        'What if no lender fits?',
        'That is not a decline. MEGA shows which rules got in the way, and your broker can suggest a path, like a different amount, a guarantor or a lender that needs a manual check.',
    ],
] as const;

export function Faq() {
    const [open, setOpen] = useState(0);

    return (
        <div className="divide-y divide-[#13233D]/10 border-y border-[#13233D]/10">
            {QUESTIONS.map(([question, answer], i) => (
                <div key={question}>
                    <button
                        type="button"
                        onClick={() => setOpen(open === i ? -1 : i)}
                        aria-expanded={open === i}
                        className="flex w-full items-center justify-between gap-6 py-6 text-left text-lg font-medium text-[#13233D] sm:text-xl"
                    >
                        {question}
                        <span
                            className={cn(
                                'grid size-10 shrink-0 place-items-center rounded-full border transition duration-300',
                                open === i
                                    ? 'rotate-45 border-[#2F6BFF] bg-[#2F6BFF] text-white'
                                    : 'border-[#13233D]/15',
                            )}
                        >
                            <Plus className="size-4" />
                        </span>
                    </button>
                    <div
                        className={cn(
                            'grid transition-all duration-500',
                            open === i
                                ? 'grid-rows-[1fr] pb-6'
                                : 'grid-rows-[0fr]',
                        )}
                    >
                        <p className="max-w-3xl overflow-hidden leading-relaxed text-[#13233D]/70">
                            {answer}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
