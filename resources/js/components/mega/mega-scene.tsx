import { useEffect, useRef, useState } from 'react';
import { MegaAvatar } from '@/components/mega/avatar';
import { cn } from '@/lib/utils';
import type { MegaEvent } from '@/types/mega';

type LenderState = 'idle' | 'evaluating' | 'pass' | 'fail' | 'unsure';
type Phase =
    | 'idle'
    | 'ingesting'
    | 'assessing'
    | 'needs_input'
    | 'converging'
    | 'done';

type Point = { x: number; y: number; px: number; py: number };
type Rope = { pts: Point[]; tight: number };

type LenderNode = {
    id: number;
    name: string;
    color: string;
    index: number;
    state: LenderState;
    shortlisted: boolean;
    released: boolean;
    alpha: number;
    x: number;
    slot: number | null;
};

type Particle = { rope: number | 'avatar'; t: number; speed: number };

type SceneState = {
    phase: Phase;
    focus: number;
    focusTarget: number;
    lenders: LenderNode[];
    ropes: Map<number | 'avatar', Rope>;
    particles: Particle[];
    spin: number;
    time: number;
};

export type SceneSummary = {
    status: string;
    phase: Phase;
    total: number;
    evaluated: number;
    pass: number;
    fail: number;
    unsure: number;
    next: 'questions' | 'reveal' | null;
};

/**
 * Minimum time each real event stays on screen so it can be read. Nothing here
 * invents progress: an event is only shown after the backend emitted it.
 */
const HOLD_MS: Record<string, number> = {
    'assessment.started': 700,
    'assessment.ingesting': 1600,
    'lender.evaluating': 55,
    'lender.result': 35,
    'gaps.created': 1400,
    'ranking.ready': 1800,
    'assessment.completed': 400,
};

const SPIN_SPEED: Record<Phase, number> = {
    idle: 0.25,
    ingesting: 0.9,
    assessing: 1.6,
    needs_input: 0.35,
    converging: 2.4,
    done: 0.6,
};

const SEGMENTS = 18;
const SPACING = 150;

const INITIAL_SUMMARY: SceneSummary = {
    status: 'Waiting to start',
    phase: 'idle',
    total: 0,
    evaluated: 0,
    pass: 0,
    fail: 0,
    unsure: 0,
    next: null,
};

export function useMegaReplay(events: MegaEvent[], play: boolean) {
    const sceneRef = useRef<SceneState>(emptyScene());
    const [summary, setSummary] = useState<SceneSummary>(INITIAL_SUMMARY);

    useEffect(() => {
        sceneRef.current = emptyScene();
        let current: SceneSummary = { ...INITIAL_SUMMARY };
        let timer: ReturnType<typeof setTimeout> | undefined;

        const apply = (event: MegaEvent, animate: boolean) => {
            current = applyEvent(sceneRef.current, current, event, animate);
        };

        if (!play) {
            events.forEach((event) => apply(event, false));
            setSummary(current);

            return;
        }

        let i = 0;
        const step = () => {
            if (i >= events.length) {
                return;
            }

            const event = events[i++];
            apply(event, true);
            setSummary(current);
            timer = setTimeout(step, HOLD_MS[event.type] ?? 300);
        };

        step();

        return () => clearTimeout(timer);
    }, [events, play]);

    return { sceneRef, summary };
}

export function MegaScene({
    sceneRef,
    summary,
    avatarIndex,
}: {
    sceneRef: React.RefObject<SceneState>;
    summary: SceneSummary;
    avatarIndex: number;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wrapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const wrap = wrapRef.current;

        if (!canvas || !wrap) {
            return;
        }

        const ctx = canvas.getContext('2d');

        if (!ctx) {
            return;
        }

        let width = 0;
        let height = 0;
        let frame = 0;
        let last = performance.now();

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            width = wrap.clientWidth;
            height = wrap.clientHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        const observer = new ResizeObserver(resize);
        observer.observe(wrap);
        resize();

        const loop = (now: number) => {
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;
            step(sceneRef.current, dt, width, height);
            draw(ctx, sceneRef.current, width, height);
            frame = requestAnimationFrame(loop);
        };

        frame = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
        };
    }, [sceneRef]);

    return (
        <div
            ref={wrapRef}
            className="relative h-[clamp(460px,68vh,640px)] w-full overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(70%_60%_at_50%_45%,#0B1F45_0%,#05070A_70%)]"
        >
            <canvas ref={canvasRef} className="absolute inset-0" aria-hidden />
            <div className="absolute top-4 left-1/2 -translate-x-1/2">
                <MegaAvatar
                    index={avatarIndex}
                    className={cn(
                        'size-14 transition duration-700',
                        summary.phase === 'needs_input' &&
                            'drop-shadow-[0_0_14px_#FFB547]',
                        summary.phase === 'converging' && 'translate-y-2',
                    )}
                />
            </div>
            <p className="absolute inset-x-0 bottom-4 text-center text-sm tracking-wide text-white/80">
                {summary.status}
            </p>
        </div>
    );
}

export function SimpleAssessment({ summary }: { summary: SceneSummary }) {
    const percent = summary.total
        ? Math.round((summary.evaluated / summary.total) * 100)
        : 0;

    return (
        <div className="rounded-3xl border border-border bg-card p-8">
            <p className="text-lg">{summary.status}</p>
            <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-border">
                <div
                    className="h-full bg-mega transition-[width] duration-300"
                    style={{ width: `${percent}%` }}
                />
            </div>
            <dl className="mt-6 grid grid-cols-3 gap-4 text-center">
                {[
                    ['Fit their policy', summary.pass, 'text-ok'],
                    ['Manual check', summary.unsure, 'text-warn'],
                    ['Did not fit', summary.fail, 'text-muted-foreground'],
                ].map(([label, value, tone]) => (
                    <div key={label as string}>
                        <dd className={cn('num text-3xl', tone as string)}>
                            {value as number}
                        </dd>
                        <dt className="mt-1 text-xs text-muted-foreground">
                            {label as string}
                        </dt>
                    </div>
                ))}
            </dl>
        </div>
    );
}

function emptyScene(): SceneState {
    return {
        phase: 'idle',
        focus: 0,
        focusTarget: 0,
        lenders: [],
        ropes: new Map(),
        particles: [],
        spin: 0,
        time: 0,
    };
}

function applyEvent(
    scene: SceneState,
    summary: SceneSummary,
    event: MegaEvent,
    animate: boolean,
): SceneSummary {
    const payload = event.payload ?? {};
    const lender = (id: unknown) => scene.lenders.find((l) => l.id === id);

    switch (event.type) {
        case 'assessment.started': {
            const lenders = (payload.lenders ?? []) as {
                id: number;
                name: string;
                color: string;
            }[];
            scene.lenders = lenders.map((l, index) => ({
                ...l,
                index,
                state: 'idle',
                shortlisted: false,
                released: false,
                alpha: 1,
                x: Number.NaN,
                slot: null,
            }));
            scene.ropes = new Map();
            scene.focus = scene.focusTarget = -2;

            return {
                ...INITIAL_SUMMARY,
                status: payload.cached
                    ? 'Nothing changed since last time. Replaying your assessment'
                    : 'Starting your assessment',
                phase: 'idle',
                total: Number(payload.lenders_total ?? lenders.length),
            };
        }
        case 'assessment.ingesting':
            scene.phase = 'ingesting';
            if (animate) {
                for (let i = 0; i < 6; i++) {
                    scene.particles.push({
                        rope: 'avatar',
                        t: -i * 0.18,
                        speed: 0.9,
                    });
                }
            }

            return {
                ...summary,
                phase: 'ingesting',
                status: `Reading your information: ${Number(payload.documents ?? 0)} documents, ${Number(payload.facts ?? 0)} facts`,
            };
        case 'lender.evaluating': {
            const node = lender(payload.lender_id);
            scene.phase = 'assessing';

            if (node) {
                node.state = 'evaluating';
                scene.focusTarget = node.index;
                if (animate) {
                    scene.particles.push({ rope: node.id, t: 0, speed: 2.2 });
                }
            }

            const evaluated = summary.evaluated + 1;

            return {
                ...summary,
                phase: 'assessing',
                evaluated,
                status: `Checking policies: ${evaluated} of ${summary.total} lenders`,
            };
        }
        case 'lender.result': {
            const node = lender(payload.lender_id);
            const outcome = payload.outcome as 'pass' | 'fail' | 'unsure';

            if (node) {
                node.state = outcome;
            }

            return { ...summary, [outcome]: summary[outcome] + 1 };
        }
        case 'gaps.created':
            scene.phase = 'needs_input';

            return {
                ...summary,
                phase: 'needs_input',
                status: `MEGA needs ${Number(payload.count)} answer${payload.count === 1 ? '' : 's'} from you before it can rank your matches`,
            };
        case 'ranking.ready': {
            const shortlist = (payload.shortlist ?? []) as number[];
            scene.phase = 'converging';
            scene.lenders.forEach((node) => {
                const slot = shortlist.indexOf(node.id);
                node.shortlisted = slot >= 0;
                node.slot = slot >= 0 ? slot : null;
                node.released = slot < 0;
            });

            return {
                ...summary,
                phase: 'converging',
                status:
                    Number(payload.passed) === 0
                        ? 'No lender fits yet. Your broker can help find a path.'
                        : `${Number(payload.passed)} lenders fit. Choosing your top ${Math.min(3, Number(payload.passed))}`,
            };
        }
        case 'assessment.completed': {
            const next = payload.next as 'questions' | 'reveal';
            scene.phase = next === 'questions' ? 'needs_input' : 'done';

            return {
                ...summary,
                phase: scene.phase,
                next,
                status:
                    next === 'questions'
                        ? 'A few quick questions, then your matches'
                        : 'Lenders matched',
            };
        }
        default:
            return summary;
    }
}

function orbGeometry(width: number, height: number) {
    const cx = width / 2;
    const cy = height * 0.44;
    const radius = Math.min(110, Math.min(width, height) * 0.14);

    return { cx, cy, radius, chipY: height - 86 };
}

function step(scene: SceneState, dt: number, width: number, height: number) {
    if (!width) {
        return;
    }

    const { cx, cy, radius, chipY } = orbGeometry(width, height);
    scene.time += dt;
    scene.spin += SPIN_SPEED[scene.phase] * dt;
    scene.focus += (scene.focusTarget - scene.focus) * Math.min(1, dt * 4);

    for (const node of scene.lenders) {
        const marqueeX = cx - (node.index - scene.focus) * SPACING;
        const targetX =
            node.slot !== null
                ? cx + (node.slot - 1) * Math.min(220, width / 3.4)
                : marqueeX;
        if (Number.isNaN(node.x)) {
            node.x = targetX;
        }
        node.x +=
            (targetX - node.x) *
            Math.min(1, dt * (node.slot !== null ? 3 : 10));
        const fade = node.released
            ? 0
            : node.state === 'fail' && scene.phase !== 'converging'
              ? 0.35
              : 1;
        node.alpha += (fade - node.alpha) * Math.min(1, dt * 3);

        const visible =
            node.x > -SPACING && node.x < width + SPACING && node.alpha > 0.02;
        if (!visible) {
            scene.ropes.delete(node.id);
            continue;
        }

        const angle = Math.atan2(chipY - cy, node.x - cx);
        const end = {
            x: cx + radius * Math.cos(angle),
            y: cy + radius * Math.sin(angle),
        };
        const tight =
            node.shortlisted || node.state === 'evaluating'
                ? 1
                : node.state === 'pass'
                  ? 0.7
                  : node.state === 'unsure'
                    ? 0.35
                    : node.state === 'fail'
                      ? 0
                      : 0.2;

        simulate(
            scene.ropes,
            node.id,
            { x: node.x, y: chipY - 17 },
            end,
            tight,
            dt,
        );
    }

    simulate(
        scene.ropes,
        'avatar',
        { x: cx, y: 76 },
        { x: cx, y: cy - radius },
        scene.phase === 'converging' ? 1 : 0.4,
        dt,
    );

    scene.particles = scene.particles
        .map((p) => ({ ...p, t: p.t + p.speed * dt }))
        .filter((p) => p.t < 1 && scene.ropes.has(p.rope));

    if (scene.phase === 'ingesting' && Math.random() < dt * 4) {
        scene.particles.push({ rope: 'avatar', t: 0, speed: 0.9 });
    }
}

function simulate(
    ropes: Map<number | 'avatar', Rope>,
    key: number | 'avatar',
    start: { x: number; y: number },
    end: { x: number; y: number },
    tightTarget: number,
    dt: number,
) {
    let rope = ropes.get(key);

    if (!rope) {
        rope = {
            tight: tightTarget,
            pts: Array.from({ length: SEGMENTS }, (_, i) => {
                const t = i / (SEGMENTS - 1);
                const x = start.x + (end.x - start.x) * t;
                const y = start.y + (end.y - start.y) * t;

                return { x, y, px: x, py: y };
            }),
        };
        ropes.set(key, rope);
    }

    rope.tight += (tightTarget - rope.tight) * Math.min(1, dt * 5);
    const pts = rope.pts;
    const gravity = 900 * dt * dt;

    for (let i = 1; i < pts.length - 1; i++) {
        const p = pts[i];
        const vx = (p.x - p.px) * 0.96;
        const vy = (p.y - p.py) * 0.96;
        p.px = p.x;
        p.py = p.y;
        p.x += vx;
        p.y += vy + gravity;
    }

    pts[0].x = pts[0].px = start.x;
    pts[0].y = pts[0].py = start.y;
    const lastPoint = pts[pts.length - 1];
    lastPoint.x = lastPoint.px = end.x;
    lastPoint.y = lastPoint.py = end.y;

    const span = Math.hypot(end.x - start.x, end.y - start.y);
    const rest = (span * (1.12 - 0.12 * rope.tight)) / (pts.length - 1);

    for (let iteration = 0; iteration < 8; iteration++) {
        for (let i = 0; i < pts.length - 1; i++) {
            const a = pts[i];
            const b = pts[i + 1];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.hypot(dx, dy) || 0.0001;
            const diff = (dist - rest) / dist / 2;
            const ox = dx * diff;
            const oy = dy * diff;

            if (i > 0) {
                a.x += ox;
                a.y += oy;
            }

            if (i + 1 < pts.length - 1) {
                b.x -= ox;
                b.y -= oy;
            }
        }
    }
}

function ropeStyle(
    scene: SceneState,
    node: LenderNode,
): [string, number, number] {
    if (node.shortlisted) {
        return ['rgba(111,177,255,0.95)', 2.6, 16];
    }

    switch (node.state) {
        case 'evaluating':
            return ['rgba(111,177,255,0.9)', 2.2, 12];
        case 'pass':
            return ['rgba(45,125,255,0.7)', 1.8, 6];
        case 'unsure': {
            // Flicker at 2.5 Hz: under the three-flashes-per-second limit.
            const on = Math.sin(scene.time * Math.PI * 5) > 0;

            return [`rgba(255,181,71,${on ? 0.75 : 0.3})`, 1.6, on ? 8 : 0];
        }
        case 'fail':
            return ['rgba(154,166,184,0.14)', 1, 0];
        default:
            return ['rgba(111,177,255,0.2)', 1, 0];
    }
}

function strokeRope(ctx: CanvasRenderingContext2D, pts: Point[]) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);

    for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i].x + pts[i + 1].x) / 2;
        const my = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }

    const last = pts[pts.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
}

function pointOnRope(pts: Point[], t: number) {
    const f = Math.max(0, Math.min(0.9999, t)) * (pts.length - 1);
    const i = Math.floor(f);
    const r = f - i;

    return {
        x: pts[i].x + (pts[i + 1].x - pts[i].x) * r,
        y: pts[i].y + (pts[i + 1].y - pts[i].y) * r,
    };
}

function draw(
    ctx: CanvasRenderingContext2D,
    scene: SceneState,
    width: number,
    height: number,
) {
    ctx.clearRect(0, 0, width, height);
    const { cx, cy, radius, chipY } = orbGeometry(width, height);

    ctx.lineCap = 'round';

    const avatarRope = scene.ropes.get('avatar');
    if (avatarRope) {
        ctx.strokeStyle =
            scene.phase === 'needs_input'
                ? 'rgba(255,181,71,0.8)'
                : 'rgba(111,177,255,0.45)';
        ctx.lineWidth = scene.phase === 'needs_input' ? 2.2 : 1.4;
        ctx.shadowColor = scene.phase === 'needs_input' ? '#FFB547' : '#6FB1FF';
        ctx.shadowBlur = scene.phase === 'needs_input' ? 14 : 4;
        strokeRope(ctx, avatarRope.pts);
    }

    for (const node of scene.lenders) {
        const rope = scene.ropes.get(node.id);
        if (!rope) {
            continue;
        }
        const [color, lineWidth, blur] = ropeStyle(scene, node);
        ctx.globalAlpha = node.alpha;
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.shadowColor = color;
        ctx.shadowBlur = blur;
        strokeRope(ctx, rope.pts);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    for (const particle of scene.particles) {
        const rope = scene.ropes.get(particle.rope);
        if (!rope || particle.t < 0) {
            continue;
        }
        const p = pointOnRope(rope.pts, particle.t);
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 8);
        glow.addColorStop(0, 'rgba(230,240,255,1)');
        glow.addColorStop(1, 'rgba(111,177,255,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    drawOrb(ctx, scene, cx, cy, radius);

    ctx.font = '500 12px "Inter Tight", system-ui, sans-serif';
    ctx.textBaseline = 'middle';

    for (const node of scene.lenders) {
        if (!scene.ropes.has(node.id)) {
            continue;
        }
        const lit =
            node.shortlisted ||
            node.state === 'evaluating' ||
            node.state === 'pass';
        const chipWidth = 132;
        const x = node.x - chipWidth / 2;
        const y = chipY - 17;

        ctx.globalAlpha = node.alpha * (node.state === 'fail' ? 0.6 : 1);
        ctx.fillStyle = lit ? 'rgba(18,30,52,0.95)' : 'rgba(12,16,22,0.9)';
        ctx.strokeStyle = node.shortlisted
            ? 'rgba(111,177,255,0.9)'
            : node.state === 'unsure'
              ? 'rgba(255,181,71,0.5)'
              : 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x, y, chipWidth, 34, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = node.color;
        ctx.globalAlpha = node.alpha * (lit ? 1 : 0.55);
        ctx.beginPath();
        ctx.roundRect(x + 8, y + 7, 20, 20, 5);
        ctx.fill();

        ctx.globalAlpha = node.alpha * (lit ? 1 : 0.6);
        ctx.fillStyle = '#F4F7FB';
        ctx.fillText(truncate(ctx, node.name, chipWidth - 44), x + 36, y + 17);
    }
    ctx.globalAlpha = 1;
}

function drawOrb(
    ctx: CanvasRenderingContext2D,
    scene: SceneState,
    cx: number,
    cy: number,
    r: number,
) {
    const working = scene.phase === 'assessing' || scene.phase === 'converging';
    const pulse = 0.85 + Math.sin(scene.time * 1.6) * 0.08;
    const intensity =
        (working ? 1.25 : scene.phase === 'done' ? 1.1 : 0.85) * pulse;

    const halo = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 2.6);
    halo.addColorStop(0, `rgba(45,125,255,${0.42 * intensity})`);
    halo.addColorStop(1, 'rgba(45,125,255,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 2.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(111,177,255,0.09)';
    ctx.lineWidth = 1;
    for (const k of [1.3, 1.6, 1.95]) {
        ctx.beginPath();
        ctx.arc(cx, cy, r * k, 0, Math.PI * 2);
        ctx.stroke();
    }

    const body = ctx.createRadialGradient(
        cx - r * 0.3,
        cy - r * 0.35,
        r * 0.05,
        cx,
        cy,
        r,
    );
    body.addColorStop(0, '#BFD9FF');
    body.addColorStop(0.2, '#4D96FF');
    body.addColorStop(0.48, '#1D5BE0');
    body.addColorStop(0.78, '#0A2A78');
    body.addColorStop(1, '#061636');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalCompositeOperation = 'screen';
    for (let k = 0; k < 3; k++) {
        ctx.strokeStyle = `rgba(207,227,255,${0.16 + 0.08 * intensity})`;
        ctx.lineWidth = r * 0.07;
        ctx.beginPath();
        ctx.ellipse(
            cx,
            cy,
            r * 0.98,
            r * (0.22 + k * 0.17),
            scene.spin * (1 + k * 0.35) + k * 1.1,
            0,
            Math.PI * 2,
        );
        ctx.stroke();
    }
    const spotAngle = scene.spin * 1.3;
    const sx = cx + Math.cos(spotAngle) * r * 0.55;
    const sy = cy + Math.sin(spotAngle) * r * 0.35;
    const spot = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 0.6);
    spot.addColorStop(0, `rgba(220,235,255,${0.55 * intensity})`);
    spot.addColorStop(1, 'rgba(220,235,255,0)');
    ctx.fillStyle = spot;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.restore();

    ctx.strokeStyle = `rgba(111,177,255,${0.55 * intensity})`;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#6FB1FF';
    ctx.shadowBlur = 18 * intensity;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = `300 ${Math.round(r * 0.3)}px "Inter Tight", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowBlur = 16;
    ctx.fillText('M E G A', cx, cy + 1);
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';
}

function truncate(
    ctx: CanvasRenderingContext2D,
    text: string,
    max: number,
): string {
    if (ctx.measureText(text).width <= max) {
        return text;
    }

    let cut = text;
    while (cut.length > 1 && ctx.measureText(`${cut}…`).width > max) {
        cut = cut.slice(0, -1);
    }

    return `${cut}…`;
}
