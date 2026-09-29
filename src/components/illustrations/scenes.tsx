import { C, Dt, Frame, Glow, Label, Link, Node, Pendant, S, Waves } from "./primitives";

type SceneProps = { uid: string; className?: string; animated?: boolean; title: string };

const on = (animated: boolean | undefined, delay: number) =>
  animated ? { className: "scene-on", style: { animationDelay: `${delay}ms` } } : {};

/* ─────────────────────────────── Living: two-storey home section */
export function LivingScene({ uid, className, animated, title }: SceneProps) {
  return (
    <Frame uid={uid} className={className} title={title} label="FIG. 01 — HOME / EVENING SCENE · CONCEPT">
      {/* landscape */}
      <S d="M40 760H1160" o={0.22} />
      <Dt d="M60 772H1140M110 784H1090" o={0.06} />
      <Dt d="M1098 760V690M1098 700c-30-6-44-34-30-60 8-18 30-26 30-26s22 8 30 26c14 26 0 54-30 60z" o={0.16} />
      <Dt d="M96 760V712M96 720c-20-4-30-24-20-42 6-12 20-18 20-18s14 6 20 18c10 18 0 38-20 42z" o={0.14} />

      {/* structure */}
      <S d="M150 222H1050M150 236H1050M170 236V760M1030 236V760M170 486H1030M170 500H1030" />
      <S d="M590 250V402M690 500V600" o={0.3} />
      <S d="M150 222V236M1050 222V236" o={0.3} />

      {/* ── ground floor: living */}
      <g {...on(animated, 200)}>
        <Pendant uid={uid} x={400} ceiling={500} drop={78} floor={760} spread={120} shade={30} className={animated ? "lightpool" : undefined} />
      </g>
      <Dt d="M232 574H472V716H232Z M312 574V716M392 574V716" o={0.14} />
      <Glow uid={uid} cx={352} cy={645} rx={140} ry={80} kind="glow-soft" />
      <Dt d="M258 760V716H282V700H520V716H544V760M282 716H520" o={0.3} />
      <Dt d="M346 742H452" o={0.16} />
      {/* media wall */}
      <rect x="560" y="594" width="108" height="64" rx="2" fill={`url(#${uid}-screen)`} opacity="0.55" />
      <Dt d="M560 594H668V658H560Z" o={0.3} />
      <Dt d="M552 726H676V742H552Z" o={0.2} />
      {/* arc lamp */}
      <Dt d="M214 760V648c0-40 24-66 66-72" o={0.26} />
      <g {...on(animated, 600)}>
        <Glow uid={uid} cx={282} cy={590} rx={46} ry={40} />
      </g>

      {/* ── ground floor: kitchen */}
      <Dt d="M716 534H1010V598H716ZM790 534V598M864 534V598M938 534V598" o={0.14} />
      <Dt d="M774 690H990V760M774 690V760M774 704H990" o={0.3} />
      <Dt d="M800 726V760M960 726V760M792 726H808M952 726H968" o={0.16} />
      <g {...on(animated, 900)}>
        <Pendant uid={uid} x={836} ceiling={500} drop={104} floor={690} spread={58} shade={20} />
        <Pendant uid={uid} x={930} ceiling={500} drop={104} floor={690} spread={58} shade={20} />
      </g>
      {/* hub */}
      <rect x="994" y="612" width="22" height="40" rx="3" fill="none" stroke={C.signal} strokeOpacity="0.8" strokeWidth="1.4" />
      <Node x={1005} y={632} r={4.5} pulse />

      {/* ── upper floor: bedroom */}
      <g {...on(animated, 1300)}>
        <Glow uid={uid} cx={380} cy={262} rx={200} ry={30} kind="glow-soft" />
        <path d="M196 256H566" stroke={C.glow} strokeOpacity="0.6" strokeWidth="2" />
      </g>
      <Dt d="M396 296H500V396H396Z" o={0.16} />
      <Dt d="M384 290c6 20-6 40 0 60s-6 40 0 56M374 290c6 20-6 40 0 60s-6 40 0 56" o={0.2} />
      <Dt d="M236 486V408H250V448H520V486M250 448V430H520V448" o={0.3} />
      <Dt d="M214 486V458H232V486M526 486V458H544V486" o={0.2} />
      <g {...on(animated, 1600)}>
        <Glow uid={uid} cx={223} cy={446} rx={40} ry={34} />
        <Glow uid={uid} cx={535} cy={446} rx={40} ry={34} />
      </g>

      {/* ── upper floor: study / media */}
      <Dt d="M690 440H930M704 440V486M916 440V486" o={0.3} />
      <rect x="742" y="370" width="132" height="64" rx="2" fill={`url(#${uid}-screen)`} opacity="0.6" />
      <Dt d="M742 370H874V434H742ZM808 434V440" o={0.32} />
      <Glow uid={uid} cx={808} cy={402} rx={120} ry={70} kind="glow-cool" />
      <Dt d="M968 486V446H990V398M958 446H1000" o={0.18} />
      <Dt d="M640 300H1000M640 336H1000" o={0.08} />

      {/* ── integration bus */}
      <Link d="M196 516H1005V612" />
      <Link d="M196 268H1005V500" />
      <Node x={400} y={516} />
      <Node x={836} y={516} />
      <Node x={930} y={516} />
      <Node x={282} y={516} />
      <Node x={223} y={268} />
      <Node x={535} y={268} />
      <Node x={808} y={268} />

      {/* annotations */}
      <Label x={196} y={548} text="Z-01  LIVING" />
      <Label x={716} y={626} text="Z-02  KITCHEN" />
      <Label x={196} y={300} text="Z-03  BEDROOM" />
      <Label x={640} y={290} text="Z-04  STUDY" />
      <Label x={432} y={600} text="L1 · 2700K · 60%" opacity={0.7} color={C.glow} />
      <Label x={60} y={92} text="SCENE — EVENING" opacity={0.75} />
      <Label x={60} y={118} text="4 ZONES · 9 POINTS · 1 SYSTEM" opacity={0.4} size={13} />
    </Frame>
  );
}

/* ─────────────────────────────── Lighting: dining elevation + control */
export function LightingScene({ uid, className, title }: SceneProps) {
  return (
    <Frame uid={uid} className={className} title={title} label="FIG. 02 — LIGHTING SCENES · CONCEPT">
      <S d="M80 170H880M80 186H880M80 760H880M80 186V760M880 186V760" />
      {/* cove */}
      <Glow uid={uid} cx={480} cy={200} rx={390} ry={46} kind="glow-soft" />
      <path d="M96 196H864" stroke={C.glow} strokeOpacity="0.55" strokeWidth="2" />
      {/* wall art & washers */}
      <Dt d="M170 330H330V470H170Z" o={0.16} />
      <Glow uid={uid} cx={250} cy={320} rx={120} ry={130} kind="glow-soft" />
      <Dt d="M640 330H780V470H640Z M660 350H760V450H660Z" o={0.14} />
      <Glow uid={uid} cx={710} cy={320} rx={110} ry={130} kind="glow-soft" />
      {/* pendants over table */}
      <Pendant uid={uid} x={380} ceiling={186} drop={260} floor={600} spread={70} shade={34} />
      <Pendant uid={uid} x={480} ceiling={186} drop={230} floor={600} spread={70} shade={34} />
      <Pendant uid={uid} x={580} ceiling={186} drop={260} floor={600} spread={70} shade={34} />
      {/* table & chairs */}
      <Dt d="M290 600H670M300 600V760M660 600V760M290 612H670" o={0.32} />
      <Dt d="M240 760V640H270V600M720 760V640H690V600M232 680H276M684 680H728" o={0.22} />
      <Dt d="M430 596c0-10 8-16 18-16s18 6 18 16M500 592h30v8h-30z" o={0.22} />
      {/* floor reflection */}
      <Glow uid={uid} cx={480} cy={760} rx={300} ry={24} kind="glow-soft" />

      {/* control panel */}
      <rect x="930" y="250" width="200" height="330" rx="18" fill="#101114" stroke={C.line} strokeOpacity="0.16" />
      <circle cx="1030" cy="370" r="64" fill="none" stroke={C.line} strokeOpacity="0.12" strokeWidth="6" />
      <path d="M978 408A64 64 0 1 1 1093 392" fill="none" stroke={C.glow} strokeOpacity="0.9" strokeWidth="6" strokeLinecap="round" />
      <circle cx="1093" cy="392" r="8" fill={C.glow} />
      <text x="1030" y="378" textAnchor="middle" className="mono" fontSize="26" fill={C.line} fillOpacity="0.9">72%</text>
      <Label x={1030} y={284} text="DINING" anchor="middle" opacity={0.6} size={13} />
      <Label x={1030} y={470} text="3000K" anchor="middle" opacity={0.6} size={13} />
      {["DINNER", "RELAX", "CLEAN"].map((s, i) => (
        <g key={s}>
          <Label x={958 + i * 58} y={540} text={s} opacity={i === 0 ? 0.95 : 0.4} size={11} color={i === 0 ? C.glow : C.mist} />
        </g>
      ))}
      <Link d="M930 420H880" />
      <Node x={880} y={420} />
      <Node x={380} y={186} />
      <Node x={480} y={186} />
      <Node x={580} y={186} />
      <Link d="M380 170V150H880V420" o={0.35} />
      <Label x={96} y={150} text="SCENE — DINNER" opacity={0.75} />
      <Label x={612} y={420} text="L3 · WARM DIM" opacity={0.6} color={C.glow} />
    </Frame>
  );
}

/* ─────────────────────────────── Cinema: room section */
export function CinemaScene({ uid, className, title }: SceneProps) {
  const stars = Array.from({ length: 46 }, (_, i) => ({
    x: 150 + ((i * 137) % 900),
    y: 196 + ((i * 53) % 70),
    r: i % 5 === 0 ? 1.8 : 1.1,
  }));
  return (
    <Frame uid={uid} className={className} title={title} label="FIG. 03 — PRIVATE CINEMA · CONCEPT">
      <S d="M100 170H1100M100 184H1100M100 184V770M1100 184V770M100 770H1100" />
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={C.line} fillOpacity={0.25 + (i % 3) * 0.15} />
      ))}
      {/* screen */}
      <rect x="120" y="300" width="18" height="330" fill={`url(#${uid}-screen)`} />
      <Glow uid={uid} cx={140} cy={465} rx={180} ry={220} kind="glow-cool" />
      {/* projector + beam */}
      <path d="M1000 262L138 300V630L1000 276Z" fill={`url(#${uid}-beam)`} />
      <Dt d="M990 244H1040V282H990Z" o={0.4} />
      <Dt d="M1015 184V244" o={0.3} />
      {/* speakers */}
      <Dt d="M128 250H150V286H128Z M128 650H150V700H128Z" o={0.4} />
      <Waves x={150} y={268} count={3} gap={14} start={14} />
      <Dt d="M1072 380H1094V430H1072Z" o={0.35} />
      <Waves x={1072} y={405} dir={-1} count={3} gap={14} start={14} />
      {/* risers */}
      <S d="M560 770V720H760V670H960V620H1100" o={0.3} />
      {/* recliners */}
      {[
        { x: 400, y: 770 },
        { x: 600, y: 720 },
        { x: 800, y: 670 },
      ].map((p, i) => (
        <g key={i}>
          <Dt d={`M${p.x} ${p.y}V${p.y - 36}H${p.x + 96}L${p.x + 116} ${p.y - 96}H${p.x + 136}L${p.x + 124} ${p.y - 30}V${p.y}`} o={0.34} />
          <Dt d={`M${p.x - 24} ${p.y - 36}H${p.x}`} o={0.24} />
          <Glow uid={uid} cx={p.x + 60} cy={p.y - 2} rx={80} ry={10} kind="glow-soft" />
        </g>
      ))}
      {/* step lights */}
      {[760, 960].map((x) => (
        <circle key={x} cx={x - 10} cy={x === 760 ? 704 : 654} r="3" fill={C.glow} fillOpacity="0.9" />
      ))}
      <Node x={1015} y={184} />
      <Node x={139} y={250} />
      <Node x={1083} y={380} />
      <Link d="M139 250V200H1015V184" o={0.35} />
      <Label x={180} y={330} text='SCREEN 135"' opacity={0.6} />
      <Label x={880} y={236} text="7.2.4 · AMBIENT 5%" opacity={0.55} />
      <Label x={120} y={120} text="SCENE — MOVIE NIGHT" opacity={0.75} />
    </Frame>
  );
}

/* ─────────────────────────────── Gaming: desk elevation */
export function GamingScene({ uid, className, title }: SceneProps) {
  return (
    <Frame uid={uid} className={className} title={title} label="FIG. 04 — GAMING ROOM · CONCEPT">
      <S d="M60 780H1140M60 170H1140" o={0.24} />
      {/* acoustic slats */}
      {Array.from({ length: 14 }, (_, i) => (
        <Dt key={i} d={`M${160 + i * 22} 230V520`} o={0.1} />
      ))}
      {Array.from({ length: 14 }, (_, i) => (
        <Dt key={`r${i}`} d={`M${754 + i * 22} 230V520`} o={0.1} />
      ))}
      {/* backlight */}
      <Glow uid={uid} cx={600} cy={430} rx={380} ry={200} kind="glow-signal" />
      <Glow uid={uid} cx={600} cy={430} rx={260} ry={130} kind="glow-soft" />
      {/* monitor */}
      <path d="M380 330Q600 306 820 330V500Q600 482 380 500Z" fill="#0f1013" stroke={C.line} strokeOpacity="0.45" strokeWidth="1.5" />
      <path d="M396 344Q600 322 804 344V488Q600 470 396 488Z" fill={`url(#${uid}-screen)`} opacity="0.35" />
      <Dt d="M600 494V560M540 560H660" o={0.35} />
      {/* desk */}
      <S d="M240 584H960M240 598H960M280 598V780M920 598V780" o={0.32} />
      <path d="M244 600H956" stroke={C.signal} strokeOpacity="0.7" strokeWidth="2" />
      <Glow uid={uid} cx={600} cy={610} rx={360} ry={24} kind="glow-signal" />
      {/* keyboard, mouse, headset */}
      <Dt d="M500 572H660V584H500ZM700 574c0-6 14-6 14 0v10h-14z" o={0.3} />
      <Dt d="M852 584V520M836 520c0-26 32-26 32 0" o={0.3} />
      {/* chair */}
      <Dt d="M540 780L600 740L660 780M600 740V690M552 690H648M566 690V560c0-20 68-20 68 0V690" o={0.28} />
      {/* speakers */}
      <Dt d="M300 500H340V584H300ZM860 500H900V584H860Z" o={0.34} />
      <Waves x={340} y={530} dir={1} count={2} gap={14} start={14} o={0.18} />
      <Waves x={860} y={530} dir={-1} count={2} gap={14} start={14} o={0.18} />
      <Node x={600} y={600} />
      <Node x={320} y={500} />
      <Node x={880} y={500} />
      <Link d="M320 500V200H880V500" o={0.35} />
      <Label x={396} y={316} text="ULTRAWIDE · 240HZ" opacity={0.55} />
      <Label x={60} y={120} text="SCENE — PLAY" opacity={0.75} />
      <Label x={60} y={146} text="LIGHT · SOUND · FOCUS" opacity={0.4} size={13} />
    </Frame>
  );
}

/* ─────────────────────────────── Office / meeting room: plan */
export function OfficeScene({ uid, className, title }: SceneProps) {
  const chairs = [
    ...[440, 540, 640, 740].map((x) => ({ x, y: 344 })),
    ...[440, 540, 640, 740].map((x) => ({ x, y: 556 })),
  ];
  return (
    <Frame uid={uid} className={className} title={title} label="FIG. 05 — MEETING ROOM PLAN · CONCEPT">
      <S d="M200 200H1000V700H200Z" w={2.5} o={0.4} />
      {/* glass wall with door */}
      <path d="M200 700H1000" stroke={C.cool} strokeOpacity="0.35" strokeWidth="1" />
      <path d="M200 706H1000" stroke={C.cool} strokeOpacity="0.2" strokeWidth="1" />
      <Dt d="M860 700V620M860 620A80 80 0 0 1 940 700" o={0.22} />
      {/* table */}
      <rect x="400" y="380" width="420" height="140" rx="70" fill="none" stroke={C.line} strokeOpacity="0.4" strokeWidth="1.5" />
      <Glow uid={uid} cx={610} cy={450} rx={300} ry={140} kind="glow-soft" />
      {chairs.map((c, i) => (
        <rect key={i} x={c.x - 22} y={c.y - 18} width="44" height="36" rx="10" fill="none" stroke={C.line} strokeOpacity="0.3" />
      ))}
      <rect x="850" y="432" width="36" height="44" rx="10" fill="none" stroke={C.line} strokeOpacity="0.3" />
      {/* display & camera field of view */}
      <rect x="214" y="370" width="10" height="160" fill={`url(#${uid}-screen)`} />
      <path d="M232 450L900 250V650Z" fill={C.cool} fillOpacity="0.04" stroke={C.cool} strokeOpacity="0.12" strokeDasharray="4 8" />
      {/* ceiling mics */}
      {[510, 710].map((x) => (
        <g key={x}>
          <circle cx={x} cy={450} r="10" fill="none" stroke={C.signal} strokeOpacity="0.8" />
          <circle cx={x} cy={450} r="46" fill="none" stroke={C.signal} strokeOpacity="0.18" />
          <circle cx={x} cy={450} r="86" fill="none" stroke={C.signal} strokeOpacity="0.08" />
        </g>
      ))}
      {/* booking panel */}
      <rect x="1006" y="610" width="16" height="30" rx="3" fill="none" stroke={C.signal} strokeOpacity="0.8" />
      <Node x={219} y={450} />
      <Node x={1014} y={625} r={4} pulse />
      <Link d="M219 360V230H1014V610" o={0.35} />
      <Link d="M510 440V230M710 440V230" o={0.25} />
      <Label x={236} y={236} text="MEETING — 9 SEATS" opacity={0.6} />
      <Label x={236} y={560} text="DISPLAY · CAMERA" opacity={0.5} />
      <Label x={740} y={760} text="ROOM BOOKED 14:00–15:00" opacity={0.5} />
      <Label x={60} y={120} text="SCENE — PRESENT" opacity={0.75} />
    </Frame>
  );
}

/* ─────────────────────────────── Plan: apartment with sensors & zones */
export function PlanScene({ uid, className, title }: SceneProps) {
  return (
    <Frame uid={uid} className={className} title={title} label="FIG. 06 — APARTMENT PLAN · COMFORT & SAFETY · CONCEPT">
      {/* climate zones */}
      <rect x="182" y="182" width="456" height="336" fill={C.glow} fillOpacity="0.05" />
      <rect x="662" y="182" width="356" height="236" fill={C.cool} fillOpacity="0.05" />
      <Glow uid={uid} cx={410} cy={350} rx={220} ry={150} kind="glow-soft" />
      {/* walls */}
      <S d="M170 170H1030V730H170Z" w={3} o={0.45} />
      <S d="M650 170V300M650 380V530M650 610V730M650 430H1030M170 530H560M620 530H650M860 430V520M860 600V730" w={2.2} o={0.36} />
      {/* windows */}
      <path d="M300 166H520M300 174H520M760 166H940M760 174H940M1026 250V380M1034 250V380" stroke={C.cool} strokeOpacity="0.45" />
      {/* doors */}
      <Dt d="M560 530A60 60 0 0 1 620 590M650 300A80 80 0 0 1 730 380M860 520A80 80 0 0 0 940 600" o={0.2} />
      {/* entrance */}
      <Dt d="M170 620V700M170 620A80 80 0 0 1 250 700" o={0.26} />
      {/* furniture */}
      <Dt d="M240 250H470V300H240ZM240 300V330M470 300V330M300 380H420V440H300Z" o={0.18} />
      <Dt d="M720 230H900V360H720ZM720 260H900" o={0.18} />
      <Dt d="M700 480H820V520M900 620H1000V700H900Z" o={0.16} />
      <Dt d="M320 600H580V700H320Z M360 620H440V680H360Z" o={0.12} />
      {/* curtains */}
      <path d="M300 186c10 6 20-6 30 0s20-6 30 0s20-6 30 0" fill="none" stroke={C.glow} strokeOpacity="0.4" />
      {/* camera cones */}
      <path d="M190 190L330 250L260 330Z" fill={C.signal} fillOpacity="0.06" stroke={C.signal} strokeOpacity="0.25" strokeDasharray="3 6" />
      {/* sensors */}
      <Node x={190} y={190} r={5} />
      <Node x={176} y={660} r={6} pulse />
      <Node x={410} y={350} r={5} />
      <Node x={840} y={300} r={5} />
      <Node x={1030} y={315} r={5} />
      <Node x={940} y={660} r={5} />
      <Node x={330} y={186} r={5} />
      <Link d="M176 660H130V120H1080V315H1030M190 190V120M330 186V120M840 300V120" o={0.3} />
      <Label x={196} y={500} text="Z-01  22.5°" opacity={0.7} color={C.glow} />
      <Label x={680} y={404} text="Z-02  21.0°" opacity={0.6} color={C.cool} />
      <Label x={196} y={690} text="ENTRY · LOCKED" opacity={0.7} />
      <Label x={880} y={712} text="BATH" opacity={0.4} />
      <Label x={60} y={96} text="SCENE — AWAY" opacity={0.75} />
    </Frame>
  );
}

/* ─────────────────────────────── Audio: multi-room plan */
export function AudioScene({ uid, className, title }: SceneProps) {
  const speakers = [
    { x: 330, y: 330, z: "A" },
    { x: 520, y: 330, z: "A" },
    { x: 330, y: 520, z: "A" },
    { x: 520, y: 520, z: "A" },
    { x: 820, y: 320, z: "B" },
    { x: 820, y: 580, z: "C" },
  ];
  return (
    <Frame uid={uid} className={className} title={title} label="FIG. 07 — MULTI-ROOM AUDIO · CONCEPT">
      <S d="M200 200H1000V700H200Z" w={2.5} o={0.42} />
      <S d="M660 200V420M660 500V700M660 450H1000" w={2} o={0.34} />
      {speakers.map((s, i) => (
        <g key={i}>
          <circle cx={s.x} cy={s.y} r="90" fill="none" stroke={C.glow} strokeOpacity="0.07" />
          <circle cx={s.x} cy={s.y} r="56" fill="none" stroke={C.glow} strokeOpacity="0.14" />
          <circle cx={s.x} cy={s.y} r="26" fill="none" stroke={C.glow} strokeOpacity="0.3" />
          <Node x={s.x} y={s.y} r={5} />
        </g>
      ))}
      <Glow uid={uid} cx={425} cy={425} rx={240} ry={200} kind="glow-soft" />
      {/* waveform */}
      <path
        d={`M200 790 ${Array.from({ length: 80 }, (_, i) => `L${200 + i * 10} ${790 - Math.abs(Math.sin(i * 0.55) * Math.cos(i * 0.17)) * 34}`).join(" ")}`}
        fill="none"
        stroke={C.glow}
        strokeOpacity="0.5"
      />
      <Link d="M330 330V240H820V320M820 320V580" o={0.3} />
      <Label x={226} y={236} text="ZONE A · LIVING · 38%" opacity={0.65} color={C.glow} />
      <Label x={686} y={236} text="ZONE B · KITCHEN" opacity={0.5} />
      <Label x={686} y={486} text="ZONE C · TERRACE" opacity={0.5} />
      <Label x={60} y={120} text="SCENE — SUNDAY MORNING" opacity={0.75} />
    </Frame>
  );
}

/* ─────────────────────────────── Sports simulator bay */
export function SimulatorScene({ uid, className, title }: SceneProps) {
  return (
    <Frame uid={uid} className={className} title={title} label="FIG. 08 — SPORTS SIMULATOR BAY · CONCEPT">
      <S d="M120 180H1080M120 780H1080" o={0.26} />
      {/* impact screen */}
      <rect x="760" y="240" width="300" height="480" fill={`url(#${uid}-screen)`} opacity="0.3" />
      <Dt d="M760 240H1060V720H760Z" o={0.4} />
      <Dt d="M760 560Q900 520 1060 548M760 600Q900 580 1060 590" o={0.25} />
      <Glow uid={uid} cx={900} cy={480} rx={280} ry={320} kind="glow-cool" />
      {/* projector */}
      <Dt d="M430 200H480V228H430Z M455 180V200" o={0.38} />
      <path d="M480 214L760 240V720L480 222Z" fill={`url(#${uid}-beam)`} />
      {/* mat, tee, player position */}
      <Dt d="M200 780L260 740H560L520 780" o={0.3} />
      <circle cx="400" cy="752" r="5" fill={C.line} fillOpacity="0.8" />
      <Dt d="M330 740c-40-60-40-160 30-230" o={0.22} />
      {/* trajectory */}
      <path d="M400 752Q560 300 820 420" fill="none" stroke={C.signal} strokeOpacity="0.9" strokeWidth="2" strokeDasharray="1 10" strokeLinecap="round" />
      <Node x={820} y={420} r={6} pulse />
      {/* sensors */}
      <Dt d="M560 770H600V782H560Z" o={0.4} />
      <Node x={580} y={770} r={4} />
      <Link d="M580 770V800H1100V180H455" o={0.3} />
      <Label x={780} y={276} text="LAUNCH · SPIN · CARRY" opacity={0.6} />
      <Label x={140} y={120} text="SCENE — PRACTICE" opacity={0.75} />
    </Frame>
  );
}

/* ─────────────────────────────── Worship house: arches, light & sound */
export function WorshipScene({ uid, className, title }: SceneProps) {
  const arches = [260, 600, 940];
  return (
    <Frame uid={uid} className={className} title={title} label="FIG. 09 — WORSHIP SPACE · LIGHT & SOUND · CONCEPT">
      <S d="M80 780H1120M80 170H1120" o={0.24} />
      {arches.map((x) => (
        <g key={x}>
          <S d={`M${x - 130} 780V420Q${x - 130} 250 ${x} 220Q${x + 130} 250 ${x + 130} 420V780`} o={0.32} />
          <Dt d={`M${x - 110} 780V430Q${x - 110} 272 ${x} 246Q${x + 110} 272 ${x + 110} 430V780`} o={0.12} />
          <Glow uid={uid} cx={x} cy={430} rx={150} ry={220} kind="glow-soft" />
        </g>
      ))}
      <Pendant uid={uid} x={430} ceiling={170} drop={200} floor={780} spread={90} shade={26} />
      <Pendant uid={uid} x={770} ceiling={170} drop={200} floor={780} spread={90} shade={26} />
      {/* column speakers */}
      <Dt d="M110 460H126V600H110ZM1074 460H1090V600H1074Z" o={0.4} />
      <Waves x={126} y={530} count={4} gap={20} start={18} o={0.2} />
      <Waves x={1074} y={530} dir={-1} count={4} gap={20} start={18} o={0.2} />
      {/* floor rows */}
      {[640, 690, 740].map((y) => (
        <Dt key={y} d={`M180 ${y}H1020`} o={0.08} />
      ))}
      <Node x={118} y={460} r={5} />
      <Node x={1082} y={460} r={5} />
      <Node x={430} y={170} r={5} />
      <Node x={770} y={170} r={5} />
      <Link d="M118 460V190H1082V460" o={0.3} />
      <Label x={140} y={130} text="SCENE — GATHERING" opacity={0.75} />
      <Label x={146} y={630} text="CLEAR SPEECH · EVEN LIGHT" opacity={0.5} />
    </Frame>
  );
}

/* ─────────────────────────────── Software: web + mobile, connected */
export function SoftwareScene({ uid, className, title }: SceneProps) {
  return (
    <Frame uid={uid} className={className} title={title} label="FIG. 10 — SOFTWARE · WEB & MOBILE · CONCEPT">
      {/* browser */}
      <rect x="150" y="190" width="660" height="460" rx="14" fill="#111215" stroke={C.line} strokeOpacity="0.3" />
      <Dt d="M150 236H810" o={0.2} />
      {[176, 196, 216].map((x) => (
        <circle key={x} cx={x} cy={213} r="5" fill={C.line} fillOpacity="0.25" />
      ))}
      <rect x="260" y="202" width="300" height="22" rx="11" fill={C.line} fillOpacity="0.06" />
      <rect x="190" y="276" width="220" height="16" rx="3" fill={C.line} fillOpacity="0.5" />
      <rect x="190" y="304" width="320" height="10" rx="3" fill={C.line} fillOpacity="0.15" />
      <rect x="190" y="322" width="280" height="10" rx="3" fill={C.line} fillOpacity="0.15" />
      <rect x="190" y="356" width="120" height="34" rx="17" fill={C.signal} fillOpacity="0.9" />
      <rect x="560" y="276" width="210" height="150" rx="8" fill={C.line} fillOpacity="0.05" stroke={C.line} strokeOpacity="0.12" />
      <path d="M580 400L620 370L660 384L700 330L750 310" fill="none" stroke={C.glow} strokeOpacity="0.8" strokeWidth="2" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={190 + i * 200} y="460" width="180" height="150" rx="8" fill={C.line} fillOpacity="0.04" stroke={C.line} strokeOpacity="0.1" />
          <rect x={206 + i * 200} y="476" width="60" height="8" rx="3" fill={C.line} fillOpacity="0.3" />
          <rect x={206 + i * 200} y="496" width="130" height="6" rx="3" fill={C.line} fillOpacity="0.12" />
        </g>
      ))}
      {/* phone */}
      <rect x="760" y="300" width="230" height="440" rx="34" fill="#0f1013" stroke={C.line} strokeOpacity="0.4" strokeWidth="1.5" />
      <rect x="840" y="316" width="70" height="10" rx="5" fill={C.line} fillOpacity="0.2" />
      <Label x={790} y={372} text="HOME" opacity={0.6} size={13} />
      <rect x="790" y="390" width="170" height="90" rx="14" fill={C.line} fillOpacity="0.05" />
      <Glow uid={uid} cx={830} cy={435} rx={40} ry={34} />
      <path d="M822 425h16l-3 16h-10z" fill={C.glow} fillOpacity="0.9" />
      <Label x={860} y={430} text="LIVING" opacity={0.7} size={11} />
      <Label x={860} y={450} text="ON · 60%" opacity={0.5} size={11} color={C.glow} />
      {[0, 1].map((i) => (
        <rect key={i} x={790 + i * 88} y="496" width="82" height="82" rx="14" fill={C.line} fillOpacity="0.05" />
      ))}
      <rect x="790" y="594" width="170" height="36" rx="18" fill={C.line} fillOpacity="0.06" />
      <circle cx={818} cy={612} r="10" fill={C.signal} />
      {/* connection to physical space */}
      <Link d="M990 520H1080V760H300V650" o={0.4} />
      <Node x={1080} y={520} />
      <Node x={300} y={760} pulse />
      <Label x={1000} y={790} text="API · DEVICES · DATA" opacity={0.5} anchor="end" />
      <Label x={150} y={130} text="WEB · MOBILE · CUSTOM" opacity={0.75} />
    </Frame>
  );
}
