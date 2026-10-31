# **MEGA: AI Lender Match App — Master Build Prompt and Spec**

## **Read this first**

This document is a **master prompt and build spec** . Give all of it to your developers, or paste it section by section into an AI coding agent (the kickoff prompts at the end show how). It describes the product completely; it is not the finished software, and nothing here has been built or tested yet.

A few of the goals in your brief need reframing so the product is both achievable and lawful. The prompt below already bakes these in.

| In your brief                                                                            | What the spec does instead                                                                                                                                                                                                                                                               | Why                                                                                                                      |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| "Most secure<br>application on<br>the planet";<br>"code that<br>cannot be<br>replicated" | Targets a verifiable bar: ISO 27001 and SOC 2<br>readiness, ASD Essential Eight, independent<br>penetration tests, customer-managed encryption<br>keys, zero-trust access. The moat is your lender<br>policy knowledge base, outcome data, allocation<br>network and UX, not secret code | Nobody can honestly prove<br>"most secure", and code is<br>always copyable; data and<br>operations are not               |
| "Show<br>borrowers we<br>are backed by<br>Google"                                        | Say "hosted on Google Cloud in Australia" and<br>show only security claims you can prove                                                                                                                                                                                                 | Implying Google<br>endorsement, or unprovable<br>security claims, risks<br>misleading-conduct breaches                   |
| AI-generated<br>document<br>score visible to<br>admin only                               | Built exactly so, but the score is a probabilistic<br>signal that routes a file to human review; it never<br>auto-declines a borrower                                                                                                                                                    | Detectors give false positives,<br>and an unfair decline is a legal<br>and reputational risk                             |
| AI picks the<br>best 3 lenders                                                           | AI shortlists and explains; a licensed broker<br>reviews and takes responsibility for the<br>recommendation                                                                                                                                                                              | Credit assistance in Australia<br>carries best-interests and<br>responsible-lending duties<br>that sit with the licensee |
| Super admin<br>has all<br>permissions                                                    | Super admin can do everything, every action is<br>logged, and destructive or data-export actions<br>need a second approver                                                                                                                                                               | Protects you and the<br>borrowers from one<br>compromised or mistaken<br>account                                         |
| AI learns from<br>every<br>application                                                   | Learning uses consented, de-identified outcome<br>data in your own models and retrieval; customer<br>data is not used to train a public foundation model                                                                                                                                 | Privacy law, borrower trust<br>and lender confidentiality                                                                |

**Australian rules that gate launch (confirm with a lawyer):** an Australian Credit Licence or credit representative arrangement for anyone providing credit assistance; the broker's Credit Guide and

related disclosures before assistance; the Privacy Act and Australian Privacy Principles, including that biometric data (face verification) is sensitive information needing explicit consent, cross-border disclosure rules if any AI processing leaves Australia, and the new transparency duties for automated decision-making that start in December 2026; the Consumer Data Right for open banking; credit reporting rules for bureau checks; the Spam Act for SMS and email; and the Electronic Transactions Act for e-signatures. Start the legal work in week one.

#### **How to use this doc**

1. Developers read top to bottom once; the prompt sections are written as instructions to the builder.

2. Build in the order in the final section; do not start the MEGA animation before the data flow behind it works.

3. Every open question is marked **Decision needed** ; settle those in the first sprint.

# **The Master Prompt**

_Everything from here down is written as instructions to the builder (a developer or an AI coding agent)._

## **1. Role, mission and principles**

**Role.** You are the principal engineer, product designer and security lead building **MEGA** , an AI lendermatching platform for Australian borrowers and brokers. Build it end to end: front end, back end, AI systems, admin tooling, infrastructure and tests, on Google Cloud in Australian regions.

**Mission.** A borrower registers, proves who they are, uploads or connects their documents, speaks or types their situation, and within minutes sees the three lenders whose real policies best fit them, with the exact policy, terms, indicative rate, deposit requirement and credit guide for each. Then they sign the disclosures and finish the application, and an AI allocation system hands it to the right local broker. Every step is audited, and the system gets better with every application.

#### **Product principles (apply to every decision)**

1. **Never ask for what you can verify.** Fields come from documents and data sources first; the borrower is asked only what nothing else can answer.

2. **Calm, minimal, fast.** One task per screen, very little text, no clutter. Think Tesla's configurator and SpaceX's mission pages: dark, spare, confident.

3. **Honest AI.** Every animation reflects a real backend event. Every recommendation shows its evidence (the lender policy clause it relied on). The AI says when it is unsure.

4. **AI proposes, humans decide.** AI never makes a final credit decision or an irreversible adverse decision about a borrower. A licensed broker approves recommendations.

5. **Security and privacy by design.** Least privilege, encryption everywhere, full audit trail, data minimisation, consent before collection.

6. **Learn safely.** Capture outcomes, improve matching and extraction using consented, deidentified data, with evaluation gates before any model change goes live.

7. **Australian by default.** Sydney and Melbourne regions, Australian formats (addresses, ABN, licences, BSB), Australian lending rules and language.

#### **Loan types in scope at launch**

| Loan type                                            | Extra data it needs                                                           | Lender policy dimensions                                                                                                 |
| ---------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Home loan<br>(purchase,<br>refinance,<br>investment) | Property address and value, deposit,<br>LVR, existing mortgage, rental income | LVR grids by property type and postcode,<br>serviceability buffer, DTI, mortgage<br>insurance, visa and employment rules |
| Car loan /<br>asset finance                          | Vehicle or asset details (rego, VIN,<br>price, age), balloon, deposit         | Asset age and type limits, loan size, term,<br>balloon rules                                                             |
| Personal loan                                        | Purpose, amount, term, secured or<br>unsecured                                | Credit score floors, income minimums,<br>purpose exclusions                                                              |
| Business loan                                        | ABN, entity type, trading history, BAS,<br>financials, director guarantees    | Time in business, turnover, industry<br>exclusions, security                                                             |

Design the schema, forms and policy engine around **loan packs** <mark>(home</mark> , <mark>asset</mark> , <mark>personal</mark> , <mark>business</mark> ) so each pack adds its own questions, document requirements and lender rules without changing the core.

#### **Non-goals**

- Do not auto-approve or auto-decline credit.

- Do not train any public or third-party foundation model on borrower data.

- Do not display unverified security or partnership claims in the UI.

- Do not build a custom identity or liveness system if a certified vendor can be integrated behind an adapter.

**Decision needed:** confirm launch loan types (recommend home loans first, then car, personal, business), the licensing entity (own Australian Credit Licence or credit representatives), and the launch lender list.

## **2. Users, roles and permissions**

Implement role-based access control (RBAC) plus attribute-based rules (ABAC) such as "broker can see only applications allocated to them". Roles are stored as signed custom claims in the identity token and re-checked on the server for every request; never trust the browser.

| Role     | Who             | Can do                                                                    | Cannot do                                                  |
| -------- | --------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Borrower | Applicant       | Register, verify, upload, talk to the AI<br>advisor, view own matches and | See anyone else's data, see<br>AI authenticity scores, see |
|          |                 | documents, sign, track status,<br>withdraw consent, request data<br>i     | internal notes or other<br>lenders' commercial terms       |
|          |                 | export or deletion                                                        | beyond what is shown                                       |
| Broker   | Licensed broker | See and work applications allocated                                       | See unallocated                                            |

| Role                                 | Who                              | Can do                                                                                                                           | Cannot do                                                                                                                                                                |
| ------------------------------------ | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|                                      | or credit<br>representative      | to them, review the AI shortlist and<br>evidence, message borrowers,<br>approve and submit, update status                        | applications, edit lender<br>policies, see other brokers'<br>pipeline, export in bulk                                                                                    |
| Processor                            | Back-office<br>support           | Work queues, document review,<br>resubmission requests, lender<br>communications for allocated tenants                           | Change policies or<br>permissions                                                                                                                                        |
| Credit<br>analyst                    | Policy owner                     | Maintain lender policies, review AI<br>extractions, publish policy versions,<br>review authenticity flags                        | Manage users, billing,<br>infrastructure                                                                                                                                 |
| Admin                                | Operations<br>manager            | Manage brokers, territories,<br>allocation rules, notifications, reports,<br>review flags                                        | Delete audit logs, change<br>security policy                                                                                                                             |
| Super<br>admin                       | Platform owners                  | All permissions including security<br>policy, roles, lender panel, data<br>controls, retention, exports, system<br>configuration | Act without audit: every<br>action is logged; destructive<br>actions (deletion, bulk<br>export, role escalation, key<br>changes) need a second<br>super admin to approve |
| Security /<br>auditor<br>(read-only) | Compliance and<br>security staff | Read audit logs, access reviews,<br>evidence reports                                                                             | Read borrower content<br>unless granted just-in-time<br>access                                                                                                           |

#### **Access rules**

- Default deny. Every endpoint declares the permission it needs; a test fails the build if one does not.

- **Just-in-time access** for sensitive views: staff request access with a reason, it is time-limited, logged and visible to the borrower's audit history.

- **Break-glass** super admin access for emergencies, with alerting to the security channel and mandatory post-incident review.

- **Field-level controls:** the AI document authenticity score and internal risk notes are visible only to Admin, Credit analyst and Super admin roles; they are stripped from every borrower and broker response at the API layer, and a test enforces this.

- **Tenant separation:** if brokerages or aggregators are later onboarded as tenants, every record carries a <mark>tenant_id</mark> and the database enforces it.

## **3. Design language: futuristic, minimal, calm**

**Direction.** Dark, spare and precise, in the spirit of aerospace and electric-vehicle interfaces: deep black canvas, large confident type, thin lines, one electric-blue accent, generous space, almost no decoration.

Everything on screen earns its place. Create an original brand identity; do not copy any existing company's logo, wordmark or trade dress.

#### **Design tokens**

| Token                       | Value (starting point)          | Use                       |
| --------------------------- | ------------------------------- | ------------------------- |
| --bg                        | #05070A                         | Page background           |
| --surface                   | #0C1016                         | Cards, panels             |
| --surface-raised            | #121822                         | Menus, dialogs            |
| --line                      | rgba(255,255,255,0.10)          | 1px borders and dividers  |
| --text                      | #F4F7FB                         | Primary text              |
| --text-dim                  | #9AA6B8                         | Secondary text            |
| --accent                    | #2D7DFF                         | Primary action, MEGA glow |
| --accent-bright             | #6FB1FF                         | Light trails, focus ring  |
| --ok/<br>--warn/<br>--error | #2FD08A/<br>#FFB547/<br>#FF5C6C | Status, used sparingly    |

Also ship a light theme for accessibility and daytime use, driven by the same tokens; dark is the default.

#### **Typography**

- Headlines and UI: a geometric grotesque such as **Geist** , **D-DIN** (open licence) or **Inter Tight** ; light to medium weights, wide letter-spacing on small uppercase labels, tight spacing on large headlines.

- Numbers (rates, amounts, scores): a tabular monospaced face such as **Geist Mono** or **JetBrains Mono** .

- Scale: 12, 14, 16, 20, 28, 40, 64. Body never below 16 px on mobile.

#### **Components**

- **Buttons:** one primary per screen (solid accent, sharp 8 px radius, subtle glow on hover), secondary as thin outlined ghost buttons, tertiary as text.

- **Inputs:** large, underline or hairline style, floating labels, instant inline validation, input masks for Australian formats (mobile, BSB, ABN, postcode), autofill and paste friendly.

- **Progress:** a single thin line across the top, with named steps shown only on tap.

- **Cards:** glass-like surface with 1px border; no shadows stacked on shadows.

- **Document tiles:** icon, name, status dot (queued, reading, verified, needs attention), and nothing else.

- **Toasts and errors:** short, specific, action-first ("The bank statement is cut off. Retake page 2").

- **Charts:** minimal, thin lines, dark grid, accent for the key series; no 3D.

#### **Motion principles**

- Purposeful, smooth, 60 fps on a mid-range phone. Durations 150-400 ms for UI, longer only for the MEGA sequences.

- Easing: ease-out for entrances, ease-in-out for transforms; springs for the rope physics.

- • Every animation conveys state (progress, connection, result). No decorative loops except MEGA's idle glow.

- Respect <mark>prefers-reduced-motion</mark> : replace animations with fades and a static progress view. Provide a "Simple mode" toggle that disables the 3D scene.

#### **Responsive and accessible**

- Mobile first (most borrowers will be on phones), then tablet and desktop. Breakpoints 360, 768, 1100, 1440.

- WCAG 2.2 AA contrast on both themes, keyboard navigation, focus rings, screen-reader labels, captions for any voice output, touch targets at least 44 px.

- Works on current Safari, Chrome, Edge and Firefox; installable as a progressive web app.

#### **Screens by role (keep each to one idea)**

| Role                | Screens                                                                                                                                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Borrower            | Welcome and register, verify mobile, verify email, get started (loan<br>type), identity, documents, advisor, MEGA assessment, questions,<br>reveal, credit guide and signature, finish, status dashboard |
| Broker              | Inbox, application workspace (summary, evidence, shortlist,<br>messages), tasks, profile and availability                                                                                                |
| Admin / super admin | Overview, allocation, lender panel, policy review, authenticity<br>flags, users and roles, audit log, security settings, data controls                                                                   |

## **4. Borrower journey, step by step**

<!-- Start of picture text -->

Ten stages; the loop between MEGA and Questions repeats until the datais clean<br>1. Register 2. Verify 3.Identity 4. Documents 5. Advisor<br>‘SMS + email OTP Pre-qualify, consent ID + QR face scan Upload + Al check Talk or type<br>6.MEGA, 7. Questions 8. Reveal 9.Sign 10. Allocate<br>Matches lenders Fix, clarify Top3 lenders Credit guide Local broker<br>MEGA and Questions repeat until it has everything it needs; the credit check runs in the background from stage 4.<br><!-- End of picture text -->

#### borrower journey · 10 stages, 1 loop

Implement each step as a resumable stage of one **application workflow** (durable state, so a borrower can leave and return on any device). Each step writes events to the audit log.

#### **Stage 1: Register and verify contact details**

1. Borrower enters mobile number first (Australian <mark>+61</mark> by default; other regions disabled unless approved). Send a 6-digit SMS one-time password (OTP): expires in 5 minutes, 5 attempts, resend throttled, one active code at a time.

2. Borrower enters email. Send an email OTP or magic link with the same limits. Both must pass before the account becomes active.

3. Borrower sets a password (minimum length rules, breached-password check, strength meter) or registers a **passkey** . Enrol a second factor (SMS or authenticator app, passkey preferred) before first access to documents.

4. For joint applications, each co-borrower registers and verifies their own mobile and email. 5. Abuse defences: reCAPTCHA Enterprise and App Check on every auth call, per-IP and pernumber rate limits, SMS fraud monitoring and spend caps, device fingerprint risk signal.

5. Supporting flows: login, logout, session list with remote sign-out, change password (reauthentication required), forgot password (email link plus second factor), change mobile or email (verify old and new), account lock after repeated failures with a safe unlock path, security alerts by email and SMS.

#### **Stage 2: Pre-qualification and consent (short)**

1. Ask at most six things: loan type (home, car, personal, business), amount, purpose, state and postcode, employment type, single or joint.

2. Show a plain-language consent screen with separate toggles for: collection and use of personal information; AI-assisted analysis of documents and automated processing; credit check; biometric face verification; recording and transcription of advisor conversations; optional marketing. Required consents block progress; optional ones do not. Store version, timestamp, IP and device.

3. Show a one-line indicative "typical lenders for this profile" teaser from public policy data, so the borrower sees value before the heavy steps.

#### **Stage 3: Identity verification**

1. Borrower photographs a driver licence or passport (camera capture with auto-shutter, glare and blur checks). OCR and barcode or MRZ reads extract name, date of birth, number, address and expiry. Check the ID against the issuing source through the identity vendor where supported.

2. **QR face verification:** if the borrower is on a desktop, show a QR code containing a short-lived, single-use, signed link; scanning opens the mobile verification page, which runs liveness and face match against the ID photo through the certified vendor. If the borrower is already on a phone, skip the QR and verify in-session. The desktop updates live when the phone finishes.

3. Outcomes: <mark>verifed</mark> i , <mark>retry</mark> (with specific advice such as lighting), or <mark>manual review</mark> . Never loop a borrower more than three times before routing to a human.

4. Log every step (capture, check results, liveness result, device, timestamps) as audit events.

#### **Stage 4: Documents and background checks**

1. Offer **bank connection through open banking (Consumer Data Right)** first; fall back to uploaded statements. Accept payslips, tax documents and other pack-specific documents by drag and drop, camera, or email-in. Uploads are resumable, size-checked and virus-scanned.

2. Classify each document automatically, extract fields with OCR and AI, and show tile statuses (queued, reading, verified, needs attention).

3. **Authenticity analysis** runs on every document in parallel (details in the AI section). The score and reasons go to the admin and credit-analyst view only, never to borrower or broker responses.

4. **Soft credit check:** after the consent already captured, call the credit bureau in the background; merge listed liabilities and file flags into the application. Show the borrower only "credit check complete".

#### **Stage 5: AI advisor**

1. A persistent advisor panel (chat, with a voice button) is available throughout. It explains steps, answers questions about documents and lending in general, and invites the borrower to describe their situation in their own words: goals, dependants, job changes, planned purchases, financial worries.

2. The advisor turns what it hears into structured notes (facts with transcript references), shows them for the borrower to confirm or edit, and stores them against the application.

3. The advisor states it is an AI assistant that cannot approve loans or provide personal credit advice; a licensed broker reviews recommendations.

#### **Stage 6: MEGA assessment**

When the minimum data set is ready, start the assessment job. MEGA reads the extracted data, financial analysis and advisor notes, evaluates every lender and policy, and streams progress events to the interface, which renders the live visualisation (next section).

#### **Stage 7: Questions and fixes (loop)**

1. MEGA produces a **gap list** : missing facts, conflicts between sources, unreadable or incomplete documents, expired documents.

2. Show at most three items at a time, each with one clear action ("Upload page 2 of the statement", "Confirm your number of dependants", "Your payslip is older than 60 days, please add a recent one").

3. After each resolution, re-run only the affected analysis and lender checks (incremental), then continue. If a step cannot be resolved by the borrower, create a task for the broker or processor and tell the borrower what happens next.

#### **Stage 8: The reveal**

Once data is complete and checks pass, play the reveal sequence and present the **top three lender options** with, for each: policy summary and the clauses relied on, indicative rate range, deposit or LVR requirement, key terms and fees, serviceability headroom, credit guide link, and a plain explanation of why it fits. Label everything "indicative, not an offer".

#### **Stage 9: Credit guide and signature**

Pull the relevant guides, pre-fill them with borrower details, require acknowledgement, and capture an electronic signature with a full audit trail (details in the allocation section).

#### **Stage 10: Finish and allocate**

Borrower confirms the final summary and submits. The allocation system assigns the best-fit local broker, notifies the broker and admin by SMS and email, and tells the borrower who their broker is and what happens next. The borrower dashboard then shows live status.

#### **Workflow refinements built into this plan (versus the original idea)**

- **Consent early, in one place,** not scattered across steps, so later steps never stall waiting for permission.

- **Credit check runs in the background** as soon as identity is verified and consent exists, rather than as a separate step.

- **Open banking first, PDF statements as fallback:** faster, cleaner data and fewer authenticity problems.

- **QR face scan only when needed:** skip it when the borrower is already on a phone.

- **Incremental re-assessment:** after a fix, recompute only what changed, so the loop is fast.

- **Save and resume everywhere,** with reminders by SMS and email at sensible intervals.

- **Show value early** with an indicative preview, which lifts completion.

- **Cap questions:** the gap list never shows more than three at once and drops any question the data can answer.

## **5. MEGA assessment visualisation and the big reveal**

This is the signature moment of the product. Build it as a real-time scene driven by real backend events.

<!-- Start of picture text -->

MEGA scene layout: borrowers above, lenders below, strings in between<br>Borrower avatars<br>MEGA<br>assessing policies<br>Lender Lender Lender Lender Lender Lender<br>Lender logos scroll left to right<br><!-- End of picture text -->

MEGA scene layout · avatars, oval, lender strings

#### **Scene composition**

- **Centre:** a large oval, **MEGA** , with a deep-blue glowing core and light that rolls around its surface while it works. Subtle rim light, soft bloom, thin concentric rings.

- **Top:** the borrower avatar (and co-borrower avatars) hanging above MEGA, each joined to it by flexible strings that sway with gentle physics.

- **Bottom:** a continuous marquee of lender logos scrolling left to right, each joined to MEGA by its own flexible string.

- **Overlay text (minimal):** one status line such as "Reading your documents" or "Checking policies: 37 of 92 lenders", and a small "Simple mode" toggle. Nothing else.

#### **States and what they show**

| State               | Trigger (real event)             | Visual                                                                                                    |
| ------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Idle                | Waiting for minimum<br>data      | Slow pulse on MEGA, strings relaxed                                                                       |
| Ingesting           | documents.reading                | Light streams along the avatar strings into MEGA                                                          |
| Assessing           | lender.evaluating<br>(lender id) | That lender's logo brightens and its string tightens<br>and pulses, blue light travels along it into MEGA |
| Lender passes       | lender.resultpass                | String settles to steady bright blue, logo stays lit                                                      |
| Lender fails policy | lender.resultfail                | String softens and dims, logo fades to a quiet tone<br>(the reason is stored, not shown here)             |
| Uncertain           | lender.resultunsure              | String flickers amber until the gap is resolved                                                           |
| Needs input         | gaps.created                     | MEGA slows, one avatar string glows; the question<br>appears below                                        |
| Converging          | ranking.ready                    | Non-matching strings slacken and release; matching<br>ones tighten                                        |
| Reveal              | reveal.start                     | The sequence below                                                                                        |

**Honesty rule.** Every motion maps to an event the backend actually emitted. Never animate fake progress. If the real work finishes quickly, hold each stage on screen for a short minimum time so it can be read, and do not invent extra stages.

#### **Avatars**

- Original characters created for the brand (for example, a set of 24 abstract astronaut-style figures); never real photos and never based on characteristics such as ethnicity, gender or age.

- • Assigned automatically and deterministically from a hash of the user ID, with a button to reroll; co-borrowers get distinct avatars.

- Built as Rive or Lottie assets, or glTF models with idle, working and celebrate animations.

#### **Lender logos**

- Stored in the lender panel with a <mark>logo_usage_approved</mark> flag. Use only logos you have permission to show; fall back to a clean text wordmark otherwise.

- Render as textured planes in an instanced marquee, with brightness and string state bound to the lender's current result.

#### **Technology**

- Three.js through **React Three Fiber** , with <mark>drei</mark> helpers and a small post-processing chain (bloom, vignette).

- MEGA surface: a custom GLSL shader (fresnel rim, flowing noise for the rolling blue light, intensity bound to throughput).

- Strings: a lightweight verlet rope simulation (16-24 segments each) rendered as thick lines; stiffness and colour bound to state.

- Events arrive over a Firestore listener or server-sent events stream ( <mark>assessments/{id}/events</mark> ), buffered and replayed in order.

- Quality: render at up to 2x device pixel ratio, targeting crisp full-HD output on desktop and 60 fps on a mid-range phone; adaptive quality drops effects before frames. Lazy-load the 3D bundle after the first interactive screen, compress textures (KTX2), cap triangles and draw calls.

- Fallbacks: 2D canvas version, then a static step list, for old devices, low power mode and Simple mode.

- Accessibility: announce progress in an <mark>aria-live</mark> region, honour reduced motion, no flashing above three times per second.

- For marketing, add a headless capture mode that records the scene at 1080p and 4K.

#### **The big reveal (6-8 seconds, skippable, replayable)**

1. All rolling light collapses into a single bright core at the centre of MEGA.

2. Strings to non-matching lenders slacken, release and fade; the marquee halts.

3. The three best matches slide to the centre on tightened strings; the avatars lean in.

4. MEGA opens like an iris into three panels, and the headline **LENDERS MATCHED** resolves in widely spaced thin type, with a soft haptic on mobile and optional sound (off by default).

5. Three cards rise in rank order: lender logo, one-line reason it fits, indicative rate range, deposit or LVR requirement, and a "See why" action that expands the policy clauses and terms used.

Copy rule: say "matched", never "approved", and keep "indicative, not an offer" visible on every result.

## **6. AI agents, models and guardrails**

Build the AI as a set of small, single-purpose agents coordinated by a durable workflow, with deterministic code making every decision that must be exact (policy rules, arithmetic, allocation constraints). Language models extract, explain, converse and draft; they do not decide credit.

| Agent    | Job                            | Core tools                     | Output              |
| -------- | ------------------------------ | ------------------------------ | ------------------- |
| Document | Classify each upload (licence, | Document AI classifier, Gemini | Typed               |
| intake   | passport, payslip, bank        | on Vertex AI                   | documents with<br>l |
|          | statement, tax return, BAS,    |                                | quality flags       |

| Agent                                     | Job                                                                                                   | Core tools                                                                                                             | Output                                          |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
|                                           | contract of sale), check<br>quality, split multi-document<br>PDFs                                     |                                                                                                                        |                                                 |
| Authenticity<br>analyser                  | Estimate whether a<br>document is edited or AI-<br>generated                                          | Metadata and structure checks,<br>image forensics, vendor<br>detector, consistency checks                              | Score and<br>reason codes,<br>admin only        |
| Extraction and<br>reconciliation<br>(ACE) | Convert documents to the<br>canonical schema; cross-<br>check sources                                 | Document AI parsers (bank<br>statement, payslip), custom<br>Australian ID extractor, Gemini<br>with strict JSON schema | Fields with<br>confidence and<br>provenance     |
| Financial<br>analyst                      | Derive income, expenses,<br>liabilities, rent, savings<br>behaviour; compare declared<br>and observed | Transaction categoriser (rules<br>plus model), household<br>expenditure benchmark tables                               | Financial<br>snapshot with<br>evidence links    |
| Advisor                                   | Chat and voice guidance,<br>situation capture                                                         | Gemini (text and Live audio),<br>Speech-to-Text and Text-to-<br>Speech where needed                                    | Answers and<br>confirmed<br>structured<br>notes |
| Policy ingestion                          | Turn lender documents into<br>structured rules and a<br>searchable corpus                             | Document AI, Gemini extraction<br>with citations, Vertex AI Search<br>or vector index                                  | Draft policy<br>versions for<br>human review    |
| Lender matcher<br>and explainer           | Evaluate every lender, rank,<br>and explain with citations                                            | Rules engine, retrieval over<br>policy corpus, scoring model,<br>Gemini for explanations                               | Top three plus<br>evidence                      |
| Gap and<br>question<br>generator          | Decide what to ask or re-<br>request, and in what order                                               | Missing-field analysis, conflict<br>list                                                                               | At most three<br>actions at a<br>time           |
| Allocation                                | Pick the best-fit broker                                                                              | Constraint solver and scoring<br>(next section)                                                                        | Assignment and<br>reasons                       |
| Learning and<br>evaluation                | Learn from outcomes, test<br>changes offline                                                          | BigQuery, Vertex AI Pipelines<br>and Experiments                                                                       | Model and rule<br>proposals for<br>approval     |

#### **Authenticity analysis (details)**

1. **File forensics:** creator and producer metadata, modification history, incremental PDF updates, embedded fonts and font mismatches, compression artefacts, hidden layers.

2. **Visual forensics:** error-level analysis, copy-move detection, inconsistent noise or lighting in photos of documents, screenshot or screen-capture indicators.

3. **Template checks:** compare layout and wording against known bank, employer and payroll formats.

4. **Arithmetic and logic checks:** running balances add up, payslip gross minus tax equals net, yearto-date figures are plausible, dates and pay periods align.

5. **Cross-document consistency:** names, addresses, employers and deposit patterns across ID, payslip and bank data.

6. **AI-generated content detection:** use a specialist vendor model for synthetic images and text artefacts, and treat it as one signal among many.

7. **Output:** a 0-100 risk score plus reason codes. Above a configured threshold the file goes to a human review queue. The borrower sees only a neutral request (for example, "Please upload a clearer copy" or "Your broker may call to confirm a detail"), never the score. Track false-positive rates and review every threshold change.

#### **Guardrails (apply to every agent)**

- **Structured outputs only:** every model call returns JSON validated against a schema; invalid output is retried, then escalated.

- **Grounding and citations:** every extracted value points to a document region; every lender claim points to a policy clause; a claim without a source is not shown.

- **Documents are untrusted input.** Text inside an uploaded file is data, never instructions. Extraction agents have no tools and no network access; only the orchestrator calls tools. Test against prompt-injection samples hidden in PDFs.

- **Deterministic decisions:** policy pass or fail, serviceability and allocation are computed by code, with the model limited to extraction, explanation and drafting.

- **Confidence thresholds:** low confidence means ask or route to a human, never guess.

- **Privacy:** send the minimum data needed, redact identifiers in logs, use a region-restricted, notraining enterprise endpoint, and record model name and version for every call.

- **Evaluation before release:** labelled test sets for extraction accuracy, matching correctness (golden scenarios) and advisor safety; regression gates in CI; red-team tests for jailbreaks, bias and privacy leaks.

- **Human in the loop:** brokers approve recommendations; credit analysts approve policy changes; admins review authenticity flags.

- **Cost and latency budgets** per agent, with timeouts and graceful degradation (for example, show indicative matches if explanations are slow).

- **Model abstraction:** call models through one internal interface so models can be changed; Gemini on Vertex AI is the default for the Google stack, and Claude models available through Vertex AI can be added behind the same interface after comparison on your evaluation sets.

## **7. Lender panel, policy knowledge base and matching engine**

The lender panel is the back-end area where the 90+ lenders (major banks, second-tier banks, nonbanks, credit unions, asset-finance and business lenders) are created and their knowledge stored. The

AI's "memory" of lenders is two things kept together: **structured rules** (the source of truth for pass or fail) and a **searchable corpus** of the original documents (for evidence, edge cases and explanations).

#### **Lender panel features (admin and credit analyst)**

| Area                   | What it holds or does                                                                                                                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lender profile         | Name, trading names, ABN, credit licence number, logo (with<br>usage-rights flag), website, products per loan pack, status (active,<br>paused), broker contacts, submission channel       |
| Documents              | Upload or auto-ingest credit policies, product guides, credit<br>guides, terms and conditions, rate sheets, forms, bulletins; each<br>with type, version, effective date, source and hash |
| Structured policy      | Eligibility rules, LVR grids, income and expense treatment,<br>serviceability settings, credit rules, asset and security rules, fees,<br>required documents, turnaround                   |
| Rates and fees         | Rate sheet tables by product, LVR band, loan size and repayment<br>type, with effective dates and a staleness alert                                                                       |
| Terms and credit guide | Current credit guide document and key terms summary, linked to<br>every match that uses them                                                                                              |
| Review queue           | AI-proposed rule changes and extracted tables awaiting human<br>approval, with source citations and diffs                                                                                 |
| Coverage and health    | Mapping status(<br>full,<br>partial,<br>unmapped), last reviewed date,<br>owner, rule count, test results                                                                                 |
| Bulk tools             | CSV import for lender lists, bulk document upload, scheduled link<br>monitors, change alerts                                                                                              |

#### **Adding policy knowledge, two ways**

- **Manual:** analyst uploads a document and edits the structured fields in forms and decision tables.

- **Automatic:** ingest from approved sources (documents you receive as an accredited broker, public pages, a monitored email inbox), then run the pipeline: parse, extract rules with citations, diff against the current version, queue for review, run golden-scenario tests, publish with an effective date. Only automate access that the lender's terms and your broker agreements permit. Nothing the AI extracts goes live without human approval.

#### **What gets stored for the AI to remember**

1. Original files in Cloud Storage (hashed, versioned, encrypted).

2. Text chunks with metadata (lender, product, section, version, page) embedded into a vector index for retrieval.

3. Structured policy JSON in the database, versioned and immutable once published.

4. Rate tables as typed rows.

5. Outcome history (which lender approved or declined which profile, and why) for the learning loop.

#### **Matching engine, stage by stage**

1. **Normalise:** build the borrower profile and scenario (amount, term, purpose, security, LVR, income, expenses, liabilities, credit flags, visa status, employment, advisor facts). Freeze it as an immutable snapshot.

2. **Hard-policy knockouts:** evaluate every lender's compiled rules in memory in parallel; each failure records rule IDs and policy citations.

3. **Serviceability per lender:** apply that lender's income shading, expense treatment (higher of declared and benchmark), assessment rate buffer, liability treatment (card limits, buy-now-paylater, student debt), dependants and joint-borrower rules; output surplus and maximum borrowing.

4. **Edge-case retrieval:** where a rule is ambiguous or the borrower has an unusual circumstance, retrieve the relevant policy passages and have the model summarise them as "possible, confirm with lender", flagged for broker review; it never converts ambiguity into a pass.

5. **Pricing:** look up the indicative rate range from the current rate sheet for the product, LVR band and loan size; attach the sheet's effective date; refuse to show a rate older than the configured age.

6. **Scoring:** composite score = weighted combination of approval confidence, total cost over a standard horizon (rate plus fees), speed (measured turnaround), feature fit (offset, redraw, extra repayments, family guarantee) and borrower priorities. Weights are configurable and any commercial factor (such as commission) must be disclosed to credit analysts and kept within the best-interests duty. Never use protected attributes as inputs.

7. **Top three with intent:** return three options that are meaningfully different where possible (for example, best overall, lowest cost, highest approval confidence), each with evidence.

8. **Explanation:** the model writes a plain-language explanation using only the cited facts, so every sentence maps to a policy clause, a rate sheet row or a borrower data point.

9. **Audit:** store the snapshot, policy versions, rule results, scores and the final shortlist so any outcome can be reproduced.

**Performance target:** the full evaluation across 90+ lenders completes in a few seconds, because stages 2 and 3 are in-memory computations and only stage 4 and 8 call a model. Cache by <mark>(scenario_hash, policy_versions)</mark> .

**Honest handling of weak spots:** show a lender as "manual check needed" when its policy is unmapped or stale, instead of hiding it or guessing; make the broker responsible for confirming.

## **8. Broker allocation, credit guide and e-signature**

### **AI broker allocation**

Goal: every completed application reaches the right local, licensed, available broker within minutes, with admins informed of every decision.

#### **Broker profile data (maintained in admin and by the broker)**

- Licence or credit representative status and authorised loan types.

- Territories as postcode sets or map polygons (for example, a "Western Sydney" region defined by postcodes or local government areas), with primary and secondary coverage.

- Skills (first home buyers, investors, refinance, self-employed, business lending, asset finance), languages, working hours and calendar, maximum open applications.

- Performance signals: acceptance rate, time to first contact, conversion, borrower ratings.

#### **Allocation algorithm**

1. **Resolve location:** map the borrower's postcode and suburb to a region using a maintained geography table (geocoding plus postcode-to-region lookup).

2. **Hard filters:** broker is active and authorised for the loan type; territory covers the borrower's location (or an adjacent territory if none cover it); capacity available; no conflict of interest; not on leave; any borrower language request is met.

3. **Score the remaining brokers:** territory match tier (exact suburb or postcode, then region, then adjacent), skill fit, language fit, capacity headroom, responsiveness, conversion on similar cases, and a **fairness rotation** weight so opportunities are shared rather than always going to the top performer. Weights are admin-configurable.

4. **Offer and accept:** send the top broker an offer with an accept window set by admin (for example a few minutes). If declined or timed out, offer to the next broker automatically.

5. **Fallback:** if nobody accepts, route to the admin allocation queue and alert admins.

6. **Confirm:** once accepted, assign the application, tell the borrower who their broker is and what happens next, and start the broker's first-contact timer.

#### **Notifications on allocation**

| Recipient | Channel                                                 | Content                                                                                                               |
| --------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Broker    | SMS, email, push notification                           | New allocated application, loan type, region,<br>urgency, and a secure link; no sensitive personal<br>data in the SMS |
| Admin     | In-app feed, email digest,<br>optional SMS for failures | Every allocation and reassignment, time to accept,<br>and any fallback or SLA breach                                  |
| Borrower  | Email, SMS, in-app                                      | Broker name, photo if they choose, how and when<br>they will be contacted                                             |

Use an SMS provider with Australian sender IDs, send service messages with clear identification, and keep marketing separate with consent and opt-out.

**Admin controls:** map-based territory editor, allocation rule and weight settings, manual reassign with reason, overrides, pause a broker, full audit trail, and reports on speed, acceptance and distribution fairness.

**Learning:** record offer, acceptance, contact time and conversion; use them to tune weights offline, with fairness checks before any change goes live.

### **Credit guide and e-signature**

**What the borrower must receive and sign** (confirm the exact list and wording with legal and compliance): the broker's credit guide, the relevant lender credit guide or product terms, privacy collection and consent forms, the authority to obtain credit information, and any other disclosure your licensee requires. Keep templates under version control with legal approval for each version.

#### **Flow**

1. After the reveal, the borrower selects the option to proceed. Fetch the current approved version of each required document.

2. **Pre-fill** with borrower details (names, addresses, loan type and amount, broker details) through a template engine that merges canonical data into HTML or DOCX templates and renders PDF.

3. Show each document in an in-app reader, with a short plain-language summary on top and the full text below. Require an explicit "I have read this" acknowledgement for each; record scroll and time-on-page as supporting evidence, not as the gate.

4. **Sign** electronically. Preferred for launch: integrate a recognised e-signature provider (such as DocuSign, Adobe Sign or Dropbox Sign). If building in-house, capture the signer's verified identity (logged in plus a step-up OTP), intent (typed or drawn signature and an explicit consent checkbox), a SHA-256 hash of the exact document, a trusted timestamp, IP address and device, and seal the final PDF with a digital signature using a key in Cloud KMS, plus a certificate of completion.

5. Store signed copies immutably (object lock) and give the borrower and broker a copy.

6. Unlock the final step, **Finish application** , which submits to the allocation system.

The borrower can re-open any signed document from their dashboard at any time.

## **9. Data vault and learning loop**

### **Data vault**

Treat borrower data as the most sensitive asset in the system.

| Tier         | Examples                                                                                                | Controls                                                                                                                                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Restricted   | ID images, face-verification<br>artefacts, bank data, credit<br>reports, tax documents, signed<br>forms | Customer-managed encryption keys (Cloud KMS),<br>envelope encryption with a per-borrower data<br>key, access only through audited service<br>identities, just-in-time staff access, object lock for<br>evidence |
| Confidential | Application data, advisor<br>transcripts, match results,<br>lender policy data                          | Encryption at rest and in transit, role-based<br>access, row-level security, field masking                                                                                                                      |
| Internal     | Analytics aggregates,<br>configuration                                                                  | Standard controls, no personal data                                                                                                                                                                             |

#### **Vault rules**

1. Store documents in separate Cloud Storage buckets per tier, with uniform bucket-level access, no public access, CMEK, versioning, and retention locks where required. Serve files only by short-lived signed URLs after an authorisation check.

2. Keep a **Google VPC Service Controls** perimeter around storage, database, Document AI and Vertex AI so data cannot be copied out to unapproved projects.

3. Scan uploads and records with Sensitive Data Protection (Cloud DLP) to classify and mask identifiers in logs and analytics.

4. Do not store biometric templates yourself. Keep only the verification result and the evidence needed for audit; delete raw selfies and liveness videos on a short retention schedule agreed with legal.

5. Define retention per record type (identity, credit and bank data, signed disclosures, advice records) based on your legal obligations; implement deletion as an automated, audited job, and make legal-hold exceptions explicit.

6. **Borrower privacy centre:** view what is held, download a copy, correct details, withdraw optional consents, request deletion, and see an access history showing which staff roles viewed their file and why.

7. Back up with point-in-time recovery and cross-region copies inside Australia; test restores quarterly.

### **The learning loop**

"AI learns from every application" means a controlled pipeline, not models quietly training on raw personal data.

#### **Signals captured (all through audit events)**

- Funnel data: time and drop-off per step, errors, retries, which questions caused abandonment.

- Extraction quality: human corrections to extracted fields and reviewer decisions on authenticity flags.

- Matching: scenarios, lender results, the shortlist shown, what the broker changed, what the borrower chose.

- Outcomes: submitted, conditionally approved, approved, declined (with reason), settled, withdrawn; time to each stage.

- Allocation: acceptance, contact time, conversion.

- Historical data you feed in: past borrower-to-lender matches and outcomes, loaded through a de-identification step and only where your privacy notice and consents allow the use.

#### **Pipeline**

1. **De-identify:** a scheduled job strips and tokenises identifiers, generalises sensitive attributes (age bands, postcode to region), and writes to a separate analytics project in BigQuery. Check for reidentification risk before any dataset is used for training.

2. **Feature store and labels:** build features (income stability, serviceability headroom, LVR, credit flags) and outcome labels per lender and product.

3. **Models improved over time**

    - _Approval likelihood per lender or product:_ gradient-boosted models with calibrated probabilities, starting as rules-only until enough outcomes exist.

    - _Extraction accuracy:_ retrain custom Document AI processors and prompts using humancorrected labels.

    - _Question and step optimisation:_ measure which questions change the outcome; propose removing those that never do.

    - _Allocation weights:_ tune from acceptance and conversion data.

4. **Evaluate:** every candidate runs against the golden scenario set, the extraction test sets and fairness checks (for example, outcome differences across regions or visa types that cannot be justified by policy).

5. **Release safely:** shadow mode first (predictions logged but unused), then canary to a small share of traffic, then full rollout, with instant rollback and a model card recording data, metrics and approver.

6. **Self-simplifying workflow:** a weekly report ranks each step by time cost and information value, and recommends steps to remove, merge or prefill. A human approves each change, and it ships behind a feature flag with an A/B test.

#### **Guardrails**

- Customer data is never used to train a general-purpose foundation model; use enterprise endpoints with no-training terms.

- Document any secondary use of data in the privacy notice and consent text.

- Keep lender-confidential information scoped: a lender's private policy detail is not exposed to other lenders or to borrowers beyond what is needed to explain a match.

## **10. Security architecture, authentication and Australian compliance**

**Security posture:** zero trust (verify every request, no implicit trust inside the network), least privilege, defence in depth, and evidence for every control. The aim is a bar you can demonstrate to borrowers, lenders and auditors, not a slogan.

### **Authentication and account flows**

| Flow         | Implementation                                                                                                                                                                                                                                  |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Registration | Google Identity Platform (Firebase Authentication): mobile<br>number with SMS OTP, email verification by OTP or link,<br>password with policy and breached-password check, passkey<br>option; both contact points must verify before activation |
| Login        | Password or passkey plus a second factor for any session that<br>can reach documents; risk-based step-up on new device, new<br>location or sensitive actions                                                                                    |
| Sessions     | Short-lived ID tokens, secure<br>HttpOnlysame-site session<br>cookies,refresh-token revocation,device list with remote                                                                                                                          |

| Flow                      | Implementation                                                                                                                                                         |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|                           | sign-out, idle and absolute timeouts                                                                                                                                   |
| Forgot or change password | Email link plus second factor; re-authentication before<br>changing password, email or mobile; notify the old and new<br>contact points; revoke other sessions         |
| Account recovery          | Verified alternate factor or assisted recovery through a broker<br>or admin with identity re-check and audit entry; no silent<br>recovery                              |
| Staff access              | Mandatory MFA with hardware keys or passkeys for admin<br>roles, SSO for staff, IP and device conditions for super admin,<br>just-in-time elevation                    |
| API access                | Verify the ID token on every call, authorise through a central<br>policy layer (role plus attributes), validate every input against<br>a schema, reject unknown fields |
| Bot and abuse defence     | reCAPTCHA Enterprise, Firebase App Check, Cloud Armor<br>WAF with rate limiting, SMS spend limits, country allow-list                                                  |

### **Platform and application controls**

- **Network and perimeter:** Cloud Armor, HTTPS everywhere with HSTS, private services behind the load balancer, VPC Service Controls around data services, private connectivity to Google APIs, egress allow-lists.

- **Secrets and keys:** Secret Manager, Cloud KMS with customer-managed keys and rotation, workload identity instead of downloaded service-account keys.

- **Supply chain:** pinned dependencies, signed container images, Binary Authorization, vulnerability scanning in Artifact Registry, SBOM generation, mandatory code review.

- **Application security:** secure headers and a strict content security policy, CSRF protection, output encoding, parameterised queries, file-type and size validation, antivirus scanning, SSRF protection, object-level authorisation tests to stop insecure direct object reference (IDOR) bugs.

- **Audit and detection:** Cloud Audit Logs (admin, data access) plus application audit events to a locked, write-once log bucket; Security Command Center and a SIEM with alerts for impossible travel, mass downloads, privilege changes, failed-login bursts and policy changes.

- **Resilience:** multi-zone services, point-in-time recovery, tested restore and disaster-recovery drills, documented incident response with a data-breach notification procedure.

- **Assurance:** align to the ASD Essential Eight, prepare for ISO 27001 and SOC 2, run an independent penetration test before launch and at least annually, and keep a vulnerability disclosure page.

### **Threats and controls**

| Threat                                     | Controls                                                                                                                          |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Synthetic or stolen identity               | Certified ID verification, liveness and face match,<br>issuing-source checks, device and behaviour signals,<br>manual review path |
| Forged or AI-generated documents           | Authenticity pipeline, open banking data, cross-<br>document consistency, reviewer queue                                          |
| Account takeover                           | Passkeys and MFA, step-up on risk, breach-<br>password check, session revocation, alerts                                          |
| SMS pumping and OTP abuse                  | Rate limits, App Check, country allow-list, spend<br>caps, monitoring                                                             |
| Prompt injection through documents or chat | Documents as data only, tool-less extraction agents,<br>output schema validation, adversarial test suite                          |
| Insider misuse                             | Least privilege, just-in-time access, field masking,<br>access reviews, four-eyes on destructive actions,<br>immutable audit      |
| Data exfiltration                          | VPC Service Controls, signed URL expiry, download<br>limits and alerts, DLP                                                       |
| Broken access control                      | Central policy layer, deny-by-default, automated<br>authorisation tests per endpoint                                              |

### **Australian compliance map (confirm with legal and compliance)**

| Area                         | What to build or decide                                                                                                                                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Credit licensing and conduct | Operate under an Australian Credit Licence or as<br>credit representatives; best-interests duty,<br>responsible-lending inquiries and verification<br>handled by the licensee with AI assisting; record<br>keeping for the required period |
| Credit guide and disclosure  | Provide the credit guide and any required<br>documents before credit assistance; keep versions<br>and proof of delivery                                                                                                                    |
| Privacy Act and APPs         | Collection notices, consent, purpose limitation,<br>data minimisation, security, access and correction<br>rights, cross-border disclosure controls, notifiable<br>data breach process                                                      |
| Biometric data               | Explicit consent,clearpurpose,minimal retention,                                                                                                                                                                                           |

| Area                                   | What to build or decide                                                                                                                           |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
|                                        | vendor due diligence                                                                                                                              |
| Automated decision-making transparency | New obligations for privacy policies start in<br>December 2026; document where AI informs<br>decisions and describe it plainly                    |
| Consumer Data Right                    | Use an accredited recipient or intermediary;<br>honour consent, scope and withdrawal                                                              |
| Credit reporting                       | Permitted purposes, bureau agreements, consent<br>and disclosure of credit enquiries                                                              |
| Spam Act and marketing                 | Consent for marketing, sender identification, opt-<br>out; keep service messages separate                                                         |
| Electronic signatures                  | Electronic Transactions Act requirements, evidence<br>of identity and intent                                                                      |
| Advertising claims                     | Only state security and technology claims you can<br>substantiate; do not imply endorsement by Google<br>or any lender                            |
| Lender due diligence                   | Expect lenders to ask for security attestations and<br>operational-resilience evidence aligned with APRA<br>standards such as CPS 234 and CPS 230 |
| Accessibility                          | WCAG 2.2 AA, which also supports disability<br>discrimination obligations                                                                         |

## **11. Google Cloud tech stack and architecture**

Run everything in Google Cloud Australian regions: **<mark>australia-southeast1</mark> (Sydney)** as primary and **<mark>australia-southeast2</mark> (Melbourne)** for disaster recovery. Before committing, check that each service you need, including the Gemini models and the Document AI processors, is available in-region; if one is not, decide whether data may leave Australia under the Privacy Act's cross-border rules or choose an alternative. Use separate Google Cloud projects for production, staging, development, analytics (deidentified data only) and security logging, under one organisation with enforced organisation policies.

<!-- Start of picture text -->

Google Cloud in Sydney: edge, identity, API, workflows, Al and data vault<br>Borrower app Broker dashboard Admin console<br>Web, PWA, 3D MEGA scene Allocated applications Lender panel, controls<br>Edge and delivery<br>Cloud Armor, load balancer, Firebase Hosting or App Hosting, CDN<br>Identity Platform, MFA,IdentityApp Check, reCAPTCHA, PolicyAPIlayer, servicesREST, (Cloudlive event Run)streams<br>Orchestration<br>Cloud Workflows, Pub/Sub, Cloud Tasks, Cloud Scheduler<br>Document Al Vertex Al Matcher Policy search<br>OCR and parsers, Gemini, agents, Rules + scoring Vertex Al Search<br>custom ID reader embeddings on Cloud Run or vector index<br>Cloud SQL Firestore Cloud Storage BigQuery<br>PostgreSQL, Live progress, Document vault, De-identified<br>row-level security chat state MEK, object lock learning data<br>Security: KMS, Secret Manager, VPC Service Controls, audit logs, Security Command Center<br><!-- End of picture text -->

target architecture · Google Cloud, Australian regions

Clients reach the platform through the edge, sign in through Identity Platform, and call API services that start durable workflows. The workflows call the AI services, which read and write the data layer; the security layer wraps everything.

| Layer                              | Choice                                                                                                     | Notes                                                                |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Borrower and<br>broker web<br>apps | Next.js (React, TypeScript) on Firebase App Hosting<br>or Cloud Run; Tailwind CSS, Radix UI, Framer Motion | Mobile-first, installable<br>PWA, server-rendered shell<br>for speed |
| MEGA scene                         | Three.js through React Three Fiber, custom GLSL<br>shaders, post-processing, Rive or Lottie avatars        | Lazy loaded, adaptive<br>quality, 2D fallback                        |
| Forms and                          | React Hook Form with Zod, TanStack Query,                                                                  | Shared validation schemas                                            |
| state                              | Firestore listeners for live progress                                                                      | with the server                                                      |
| Admin console                      | Same monorepo,TanStack Table,role-based routes,                                                            | Google Maps Platform for                                             |

| Layer                       | Choice                                                                                                                                                                                   | Notes                                                                                               |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
|                             | map-based territory editor                                                                                                                                                               | maps and geocoding                                                                                  |
| API services                | NestJS (Node.js LTS) on Cloud Run, OpenAPI 3.1, Zod<br>validation                                                                                                                        | Stateless, autoscaling,<br>private ingress behind the<br>load balancer                              |
| AI services                 | Python (FastAPI) on Cloud Run, Vertex AI SDK, Agent<br>Development Kit for agent orchestration where<br>useful                                                                           | One service per agent, strict<br>JSON schemas                                                       |
| Workflow<br>orchestration   | Cloud Workflows with Pub/Sub, Cloud Tasks and<br>Cloud Scheduler; Temporal if you later need heavier<br>long-running logic                                                               | Durable steps, retries,<br>human-wait states                                                        |
| Identity                    | Google Identity Platform (Firebase Authentication):<br>phone, email, password, MFA, custom claims,<br>blocking functions for sign-in policy; Firebase App<br>Check; reCAPTCHA Enterprise | Passkeys where supported;<br>otherwise authenticator app<br>and SMS                                 |
| OCR and<br>documents        | Document AI (bank statement and payslip parsers,<br>custom processors for Australian IDs and other<br>documents), Cloud Vision for image quality                                         | Custom processors trained<br>on your labelled data                                                  |
| LLMs and<br>embeddings      | Vertex AI: Gemini models for extraction, explanation<br>and advisor; text embeddings; Gemini Live for voice                                                                              | Behind one internal model<br>interface; pinned versions                                             |
| Speech                      | Speech-to-Text and Text-to-Speech, or Gemini Live<br>audio                                                                                                                               | Captions and transcripts<br>stored with consent                                                     |
| Policy search               | Vertex AI Search or Vector Search; start with<br>pgvectorin PostgreSQL if simpler                                                                                                        | Chunks with lender, product,<br>version and page metadata                                           |
| Relational data             | Cloud SQL for PostgreSQL (move to AlloyDB if scale<br>demands), row-level security, pgcrypto and<br>application-level encryption                                                         | System of record                                                                                    |
| Real-time and<br>chat state | Firestore                                                                                                                                                                                | Assessment events, advisor<br>conversation, notifications;<br>rules locked to the signed-in<br>user |
| Cache                       | Memorystore for Redis                                                                                                                                                                    | Rate limits, idempotency<br>keys, short-lived caches                                                |
| Files                       | Cloud Storage with CMEK, object lock, signed URLs,<br>antivirus scan job                                                                                                                 | Separate buckets per data<br>tier                                                                   |
| Analytics and               | BigQuery (de-identified),Vertex AI Pipelines,                                                                                                                                            | Trainingand evaluation,                                                                             |

| Layer                                     | Choice                                                                                                                                                            | Notes                                                            |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| learning                                  | Experiments, Model Registry                                                                                                                                       | shadow and canary releases                                       |
| Identity<br>verification                  | Certified vendor behind an adapter (document,<br>liveness, face match, issuing-source check); QR<br>hand-off to phone                                             | Vendor evaluated for<br>Australian coverage and<br>privacy terms |
| Open banking                              | CDR-accredited provider behind an adapter                                                                                                                         | Statement upload as fallback                                     |
| Credit bureau                             | Equifax and optionally others behind an adapter                                                                                                                   | Consent and permitted-<br>purpose logging                        |
| E-signature                               | DocuSign, Adobe Sign or Dropbox Sign, or in-house<br>sealing with Cloud KMS                                                                                       | Audit certificate stored with<br>the document                    |
| Messaging                                 | Firebase Cloud Messaging for push; transactional<br>email provider; Australian SMS provider with sender<br>ID                                                     | Templates, throttling,<br>delivery receipts                      |
| Security<br>services                      | Cloud KMS, Secret Manager, Cloud Armor, VPC<br>Service Controls, Sensitive Data Protection, Security<br>Command Center, Cloud Audit Logs, Binary<br>Authorization | See security section                                             |
| Infrastructure<br>as code and<br>delivery | Terraform, Cloud Build or GitHub Actions, Artifact<br>Registry, Cloud Deploy, blue/green and canary<br>releases                                                   | Preview environments per<br>pull request                         |
| Observability                             | Cloud Logging, Monitoring, Trace, Error Reporting,<br>Sentry, Looker Studio dashboards                                                                            | One trace ID from browser<br>to model call                       |
| Experiments<br>and flags                  | Firebase Remote Config and A/B Testing, or Unleash                                                                                                                | Per-role, per-lender and per-<br>step switches                   |

Vendor and product names are current examples; confirm availability, pricing and region support at kickoff.

## **12. Data model and API surface**

### **Core data model (PostgreSQL)**

Every table has id (UUIDv7), <mark>created_at</mark> , <mark>updated_at</mark> , and a <mark>tenant_id</mark> where multi-tenancy applies; sensitive columns are encrypted at the application layer with per-borrower data keys. Events and evidence tables are append-only.

| Table | Key fields                          | Purpose          |
| ----- | ----------------------------------- | ---------------- |
| users | auth_uid, role, mobile_verified_at, | Every person who |

| Table                               | Key fields                                                                              | Purpose                                                      |
| ----------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
|                                     | email_verified_at, mfa_enrolled, status                                                 | can sign in                                                  |
| borrowers                           | user_id, verified_identity_ref, avatar_id, region,<br>preferences                       | Borrower profile                                             |
| brokers                             | user_id, licence_ref, loan_types[], skills[],<br>languages[], capacity, status          | Broker profile                                               |
| territories/<br>broker_territories  | name, postcodes[] or geometry, priority                                                 | Allocation<br>geography                                      |
| applications                        | borrower_ids[], loan_pack, status, stage, broker_id,<br>submitted_at                    | Central record                                               |
| application_events                  | application_id, type, actor, payload, occurred_at                                       | Append-only audit<br>and timeline                            |
| consents                            | user_id, application_id, type, text_version,<br>granted_at, revoked_at, ip, device      | Consent evidence                                             |
| identity_checks                     | application_id, vendor, result, liveness_result,<br>evidence_ref, reviewed_by           | ID and face<br>verification<br>outcomes                      |
| documents                           | application_id, kind, storage_key, sha256,<br>av_status, quality_score, retention_until | Uploads and<br>generated files                               |
| extractions                         | document_id, processor, model_version,<br>output_json, confidence                       | Raw OCR and AI<br>results                                    |
| authenticity_reports                | document_id, score, reason_codes[], reviewer_id,<br>decision                            | Admin-only fraud<br>signals                                  |
| canonical_data/<br>field_provenance | application_id, schema_version, data_json /<br>field_path, source, confidence           | Resolved<br>application and<br>where each value<br>came from |
| financial_snapshots                 | application_id, income_json, expenses_json,<br>liabilities_json, benchmarks_json        | Derived finances                                             |
| credit_reports                      | application_id, bureau, summary_json, raw_ref,<br>consent_id                            | Bureau results                                               |
| advisor_sessions/<br>advisor_notes  | application_id, transcript_ref / fact, source_span,<br>confirmed_by_borrower            | Conversation and<br>structured notes                         |
| lenders                             | name, abn, licence_ref, logo_ref,                                                       | Lender master                                                |

| Table                               | Key fields                                                                                                                                 | Purpose                                           |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
|                                     | logo_usage_approved, channel, status                                                                                                       | (90+)                                             |
| lender_products                     | lender_id, loan_pack, name, features_json                                                                                                  | Products per<br>lender                            |
| lender_documents                    | lender_id, kind, storage_key, sha256,<br>effective_from, version                                                                           | Policies, credit<br>guides, terms,<br>rate sheets |
| policy_versions                     | lender_id, loan_pack, version, rules_json, status,<br>approved_by[], source_citations                                                      | Structured policy                                 |
| policy_chunks                       | document_id, section, text, embedding, page                                                                                                | Searchable corpus                                 |
| rate_sheets                         | lender_product_id, rows_json, effective_from,<br>expires_at                                                                                | Indicative pricing                                |
| match_runs/<br>match_results        | application_id, scenario_hash, policy_versions /<br>lender_id, passed, failed_rules[],<br>serviceability_json, score, rank, citations_json | Matching<br>evidence                              |
| shortlists                          | match_run_id, option_rank, lender_product_id,<br>explanation, broker_override                                                              | What the<br>borrower saw                          |
| disclosure_documents/<br>signatures | template_id, version, rendered_ref / document_id,<br>signer_id, hash, signed_at, certificate_ref                                           | Credit guides and<br>e-sign evidence              |
| allocations                         | application_id, broker_id, offered_at, accepted_at,<br>reason_json, status                                                                 | Allocation history                                |
| tasks                               | application_id, queue, assignee, due_at, status                                                                                            | Gap items and<br>back-office work                 |
| notifications                       | recipient, channel, template, status, provider_ref                                                                                         | Delivery log                                      |
| audit_log                           | actor, action, object, before, after, reason, ip,<br>device                                                                                | Immutable<br>compliance log                       |

**Firestore (live, per-user, locked by security rules):** <mark>assessments/{id}/events</mark> , <mark>advisor/{sessionId}/messages</mark> , <mark>notif</mark> i <mark>cations/{userId}/items</mark> .

### **API surface (REST, OpenAPI 3.1, versioned** **<mark>/v1</mark> )**

| Group            | Endpoints (examples)                                                |
| ---------------- | ------------------------------------------------------------------- |
| Auth and account | POST /auth/register,<br>/auth/verify-mobile,<br>/auth/verify-email, |
|                  | /auth/login,<br>/auth/mfa/enrol,<br>/auth/password/forgot,          |
|                  | /auth/password/change,<br>/auth/sessions                            |

| Group                  | Endpoints (examples)                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Application            | POST /applications,<br>GET /applications/{id},<br>PATCH<br>/applications/{id}/prequal,<br>POST /applications/{id}/consents                                                                                                                                                                                                                                                   |
| Identity               | POST /applications/{id}/identity/start,<br>GET /identity/qr,<br>POST<br>/identity/mobile-complete,<br>GET /identity/status                                                                                                                                                                                                                                                   |
| Documents              | POST /applications/{id}/documents/upload-url,<br>GET<br>/documents/{id},<br>POST /applications/{id}/bank/connect,<br>POST /applications/{id}/credit-check                                                                                                                                                                                                                    |
| Advisor                | POST /advisor/sessions,<br>POST /advisor/sessions/{id}/messages,<br>GET /advisor/notes,<br>PATCH /advisor/notes/{id}                                                                                                                                                                                                                                                         |
| Assessment             | POST /applications/{id}/assess,<br>GET /applications/{id}/gaps,<br>POST /gaps/{id}/resolve,<br>GET /applications/{id}/matches                                                                                                                                                                                                                                                |
| Disclosure and signing | GET /applications/{id}/disclosures,<br>POST<br>/disclosures/{id}/acknowledge,<br>POST /disclosures/{id}/sign,<br>POST /applications/{id}/finish                                                                                                                                                                                                                              |
| Broker                 | GET /broker/inbox,<br>POST /broker/offers/{id}/accept,<br>POST<br>/broker/offers/{id}/decline,<br>GET /broker/applications/{id},<br>POST /broker/applications/{id}/approve,<br>PATCH<br>/broker/applications/{id}/status                                                                                                                                                     |
| Admin                  | GET/POST /admin/lenders,<br>POST<br>/admin/lenders/{id}/documents,<br>GET /admin/policy-review,<br>POST /admin/policy-versions/{id}/publish,<br>GET<br>/admin/authenticity-reports,<br>GET/PATCH /admin/territories,<br>GET/PATCH /admin/allocation-rules,<br>POST<br>/admin/allocations/{id}/reassign,<br>GET /admin/audit-log,<br>GET/POST /admin/usersand<br>/admin/roles |
| Privacy                | GET /me/data-export,<br>POST /me/deletion-request,<br>GET<br>/me/access-history,<br>PATCH /me/consents                                                                                                                                                                                                                                                                       |

All writes take an <mark>Idempotency-Key</mark> ; list endpoints are cursor-paginated; errors follow RFC 9457; every route declares its required permission in code, and a CI test fails if one does not.

## **13. Build plan, acceptance criteria, testing and launch**

**Build order.** Prove the data flow first, then add the spectacle. The MEGA scene can start early against a mock event stream, but it must not ship until it is driven by real events.

| Phase | Sprints (2 weeks) | Scope                      | Done when               |
| ----- | ----------------- | -------------------------- | ----------------------- |
| 0.    | 1-2               | Google Cloud organisation, | A "hello world" service |

| Phase                                       | Sprints (2 weeks) | Scope                                                                                                                                       | Done when                                                                                                                                                        |
| ------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Foundations<br>and legal                    |                   | projects, Terraform, CI/CD,<br>design system, canonical<br>schema, legal workstream<br>started                                              | deploys to staging by<br>pipeline; tokens and<br>components published;<br>legal plan agreed                                                                      |
| 1. Accounts<br>and identity                 | 2-4               | Registration, SMS and email<br>OTP, MFA, login, password<br>flows, consents, pre-<br>qualification, ID capture, QR<br>face verification     | A new borrower registers,<br>verifies both contacts,<br>completes ID and face<br>verification on desktop-to-<br>phone and phone-only<br>paths; all steps audited |
| 2. Documents<br>and ACE                     | 3-6               | Upload, antivirus,<br>classification, OCR, extraction,<br>financial analysis, authenticity<br>pipeline, admin review queue,<br>credit check | Sample documents extract<br>at agreed accuracy;<br>authenticity flags reach<br>admin only; borrower sees<br>neutral messages                                     |
| 3. Lender<br>panel and<br>knowledge<br>base | 3-8               | Lender CRUD, documents,<br>ingestion and review,<br>structured policy editor, rate<br>sheets, search index                                  | Credit analysts publish<br>versioned policies for the<br>launch lenders with<br>citations; coverage<br>dashboard live                                            |
| 4. Matching<br>and advisor                  | 6-10              | Matching engine,<br>explanations, gap list, advisor<br>chat and voice with note-<br>taking, golden scenario suite                           | Top three results are<br>reproducible, cited and pass<br>the golden set; advisor<br>notes confirmed by<br>borrower                                               |
| 5. MEGA<br>scene and<br>reveal              | 5-11              | Scene on mock events, then<br>real events, avatars, lender<br>marquee, reveal, fallbacks,<br>accessibility                                  | 60 fps on target devices,<br>Simple mode works, every<br>animation traced to a real<br>event                                                                     |
| 6. Disclosures,<br>e-sign and<br>allocation | 9-12              | Template engine, reader,<br>signing, territory data,<br>allocation engine, notifications                                                    | Signed documents sealed<br>and retrievable; an<br>application allocates to the<br>correct regional broker with<br>SMS, email and admin<br>alerts                 |
| 7. Dashboards                               | 8-12              | Borrower dashboard, broker<br>dashboard, admin and super<br>admin console, audit views,                                                     | Each role can do its jobs<br>and nothing else, proven by<br>automated permission tests                                                                           |

| Phase                  | Sprints (2 weeks) | Scope                                                                                                                                            | Done when                                                               |
| ---------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
|                        |                   | privacy centre                                                                                                                                   |                                                                         |
| 8. Hardening           | 11-14             | Penetration test and fixes,<br>load and failure tests, disaster-<br>recovery drill, accessibility<br>audit, privacy impact<br>assessment actions | No open critical or high<br>findings; recovery drill<br>meets targets   |
| 9. Pilot and<br>launch | 13+               | Invited-borrower pilot with<br>broker oversight, shadow-<br>mode comparison with human<br>matching, then phased public<br>launch                 | Pilot metrics met (below);<br>support and incident<br>processes running |

**Pilot success measures (set targets with the business):** time from sign-up to reveal, drop-off per step, extraction accuracy, share of matches a senior broker agrees with, authenticity false-positive rate, allocation acceptance time, borrower satisfaction, and zero unresolved privacy or security incidents.

#### **Testing**

- Unit and contract tests for rules, extractors and adapters; end-to-end tests with Playwright on real mobile browsers; load tests for concurrent assessments.

- **Golden scenarios:** a labelled set covering each loan pack and edge cases, re-run on every policy or model change.

- **Security tests:** automated authorisation tests for every endpoint and role, tenant and borrower isolation tests, prompt-injection suite, dependency and container scans, external penetration test.

- **AI evaluation:** extraction accuracy per field, authenticity precision and recall with reviewer feedback, advisor safety and accuracy, fairness checks.

- **Failure drills:** identity vendor down, slow bank, OTP provider outage, model timeout, lender policy publish error, duplicate webhook.

- **Accessibility and device matrix:** screen reader, keyboard-only, reduced motion, low-end Android, older iPhone.

#### **Deployment and operations**

- Environments: development, staging (synthetic data only), production; no real borrower data outside production.

- Release flow: pull request checks, preview environment, staging end-to-end suite, manual approval, canary release, automatic rollback on error-rate or latency alarms.

- Operations: on-call rota, dashboards for funnel, provider health, queue age, model latency and cost, incident runbooks (provider outage, bad policy publish, suspected breach), status page.

#### **Kickoff prompts for an AI coding agent**

Use these in order, giving the agent this whole document as context each time, and review every output in pull requests.

1. "Create the monorepo, Terraform for the Google Cloud projects and Australian regions, CI/CD, and the design-token package from section 3. Add a deny-by-default authorisation layer and the audit-log table. Do not build features yet."

2. "Implement stage 1 of the borrower journey with Identity Platform: mobile and email OTP, passwords and passkeys, MFA, login, logout, forgot and change password, session management, App Check and reCAPTCHA, with tests for every abuse limit in section 10."

3. "Implement consents and pre-qualification, then ID capture and the QR face-verification handoff through a vendor adapter with a mock vendor for tests. Emit audit events for each step."

4. "Build document upload, scanning, classification and the extraction and reconciliation pipeline into the canonical schema with provenance. Add the authenticity pipeline and make the score invisible to every non-admin response, with a test proving it."

5. "Build the lender panel: lender CRUD, document upload, versioned structured policy editor, rate sheets, ingestion and review queue, and the policy search index."

6. "Build the matching engine from section 7 with golden scenarios, cached evaluation, citations and top-three selection. Expose progress events."

7. "Build the MEGA scene against the event contract in section 5, first with a mock stream, then the real one, including avatars, lender marquee, reveal, Simple mode and accessibility."

8. "Build the advisor: chat and voice, structured note-taking with borrower confirmation, and the gap and question generator limited to three items at a time."

9. "Build disclosure templates, the reader and e-signature, then the broker allocation engine, territory editor and notifications from section 8."

10. "Build the borrower, broker and admin dashboards, the privacy centre, and the audit views, with an automated permission matrix test against section 2."

11. "Run the hardening checklist: penetration-test fixes, load and failure drills, disaster-recovery rehearsal, accessibility audit, and produce the launch evidence pack."

**Decisions needed in sprint 1:** licensing model and compliance owner; launch loan types and lenders; identity, open banking, credit bureau and e-signature vendors; which Google services are available in Australian regions and the cross-border position for any that are not; brand name and visual identity; target launch date and pilot cohort.
