import { useForm } from '@inertiajs/react';
import { SendHorizontal } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { dateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import messages from '@/routes/messages';

export type ThreadMessage = {
    id: number;
    body: string;
    sender: string;
    mine: boolean;
    at: string;
};

/**
 * Secure messages between the borrower and their broker, kept inside MEGA.
 */
export function MessageThread({
    applicationId,
    thread,
    disabledReason,
}: {
    applicationId: string;
    thread: ThreadMessage[];
    disabledReason?: string;
}) {
    const form = useForm({ body: '' });
    const end = useRef<HTMLDivElement>(null);

    useEffect(() => {
        end.current?.scrollIntoView({ block: 'nearest' });
    }, [thread.length]);

    function submit(event: FormEvent) {
        event.preventDefault();
        form.post(messages.store.url(applicationId), {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    }

    return (
        <div className="flex flex-col">
            <div className="max-h-80 min-h-32 space-y-3 overflow-y-auto pr-1">
                {thread.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        No messages yet.
                    </p>
                )}
                {thread.map((message) => (
                    <div
                        key={message.id}
                        className={cn(
                            'max-w-[85%]',
                            message.mine ? 'ml-auto text-right' : '',
                        )}
                    >
                        <p
                            className={cn(
                                'inline-block rounded-2xl px-3.5 py-2 text-left text-sm whitespace-pre-line',
                                message.mine
                                    ? 'rounded-br-sm bg-mega text-white'
                                    : 'rounded-bl-sm bg-accent',
                            )}
                        >
                            {message.body}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                            {message.mine ? 'You' : message.sender} ·{' '}
                            {dateTime(message.at)}
                        </p>
                    </div>
                ))}
                <div ref={end} />
            </div>
            {disabledReason ? (
                <p className="mt-3 text-xs text-muted-foreground">
                    {disabledReason}
                </p>
            ) : (
                <form onSubmit={submit} className="mt-3 flex gap-2">
                    <label
                        htmlFor={`message-${applicationId}`}
                        className="sr-only"
                    >
                        Write a message
                    </label>
                    <input
                        id={`message-${applicationId}`}
                        value={form.data.body}
                        onChange={(e) => form.setData('body', e.target.value)}
                        maxLength={2000}
                        placeholder="Write a message…"
                        className="h-10 flex-1 rounded-full border border-input bg-transparent px-4 text-sm outline-none focus:border-mega"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="size-10 rounded-full"
                        disabled={form.processing || !form.data.body.trim()}
                    >
                        <SendHorizontal className="size-4" />
                        <span className="sr-only">Send</span>
                    </Button>
                </form>
            )}
        </div>
    );
}
