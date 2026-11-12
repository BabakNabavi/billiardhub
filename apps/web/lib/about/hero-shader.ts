/* ─────────────────────────────────────────────────────────────
   شیدرِ صحنه‌ی هیروی درباره ما — میزِ اسنوکر با raymarching، WebGL1، بی کتابخانه.

   چرا بی three.js: صحنه یک میز، نوزده توپ و یک چراغ است؛ یک شیدرِ فرگمنتِ ~۸KB
   همین را با سایه‌ی نرم، AO و بازتابِ چراغ روی توپ‌ها می‌سازد، در حالی که three
   بیش از ۱۵۰KB به باندلِ موبایلِ ایرانی اضافه می‌کرد (و قاعده‌ی پروژه نصبِ
   وابستگیِ تازه را بی‌اجازه منع می‌کند). فقط وقتی چیزی عوض شود یک فریم کشیده
   می‌شود — حلقه‌ی دائمی نیست (HeroScene.tsx).

   مختصات: y بالا، رویه‌ی پارچه y=0، طول میز در محورِ z، دوربین سمتِ +z (سمتِ بالک).
   واحدها تقریباً متر؛ شعاعِ توپ ۰٫۰۲۶
   ───────────────────────────────────────────────────────────── */

export const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

export const NB = 22

export const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform vec3 uCam;
uniform vec3 uTarget;
uniform float uLamp;
uniform vec3 uBallP[${NB}];
uniform vec3 uBallC[${NB}];

#define W 0.9
#define L 1.8
#define R 0.0262
#define LAMPY 1.02

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) { return 0.5 * noise(p) + 0.25 * noise(p * 2.03) + 0.125 * noise(p * 4.01); }

float sdBox(vec3 p, vec3 b) { vec3 q = abs(p) - b; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0); }
float sdRBox(vec3 p, vec3 b, float r) { return sdBox(p, b - r) - r; }

float pocketD(vec2 xz) {
  vec2 a = abs(xz);
  float c = length(a - vec2(W, L));
  float m = length(vec2(a.x - W - 0.012, a.y));
  return min(c, m) - 0.062;
}

/* x: فاصله، y: جنس (۱ پارچه، ۲ لاستیک، ۳ چوب، ۵ چراغ، ۶ کف، ۱۰+i توپ) */
vec2 map(vec3 p) {
  vec2 res = vec2(1e5, 0.0);
  float felt = sdBox(p - vec3(0.0, -0.1, 0.0), vec3(W, 0.1, L));
  res = vec2(felt, 1.0);

  float pk = pocketD(p.xz);
  float cs = min(
    sdRBox(vec3(abs(p.x) - (W - 0.022), p.y - 0.017, p.z), vec3(0.024, 0.02, L), 0.012),
    sdRBox(vec3(p.x, p.y - 0.017, abs(p.z) - (L - 0.022)), vec3(W, 0.02, 0.024), 0.012));
  cs = max(cs, -pk);
  if (cs < res.x) res = vec2(cs, 2.0);

  float rail = max(sdRBox(p - vec3(0.0, -0.06, 0.0), vec3(W + 0.13, 0.105, L + 0.13), 0.02), -sdBox(p, vec3(W, 0.3, L)));
  rail = max(rail, -(pk - 0.006));
  if (rail < res.x) res = vec2(rail, 3.0);

  float lamp = sdRBox(p - vec3(0.0, LAMPY + 0.05, 0.0), vec3(0.3, 0.05, 1.0), 0.01);
  if (lamp < res.x) res = vec2(lamp, 5.0);

  float fl = p.y + 0.78;
  if (fl < res.x) res = vec2(fl, 6.0);

  /* پکِ قرمزها: اول کره‌ی محیطی، بعد تک‌تک */
  float pb = length(p - uBallP[4]) - 0.17;
  for (int i = 0; i < ${NB}; i++) {
    if (i < 15 && pb > res.x) continue;
    float d = length(p - uBallP[i]) - R;
    if (d < res.x) res = vec2(d, 10.0 + float(i));
  }
  return res;
}

vec3 calcNormal(vec3 p) {
  const vec2 e = vec2(1.0, -1.0) * 0.0005;
  return normalize(e.xyy * map(p + e.xyy).x + e.yyx * map(p + e.yyx).x + e.yxy * map(p + e.yxy).x + e.xxx * map(p + e.xxx).x);
}

float softShadow(vec3 ro, vec3 rd, float tmax) {
  float res = 1.0, t = 0.004;
  /* فقط چیزهای زیرِ ۱۲ سانتی‌متر سایه می‌اندازند (توپ، لاستیک، چوب)؛ پرتو همان‌جا
     می‌ایستد — وگرنه به بدنه‌ی چراغ می‌رسید و خودِ چراغ سایه‌ی حلقه‌حلقه می‌انداخت */
  for (int i = 0; i < 36; i++) {
    vec3 q = ro + rd * t;
    if (q.y > 0.12) break;
    float h = map(q).x;
    res = min(res, 7.0 * h / t);
    t += clamp(h, 0.003, 0.05);
    if (res < 0.002 || t > tmax) break;
  }
  return clamp(res, 0.0, 1.0);
}

float calcAO(vec3 p, vec3 n) {
  float occ = 0.0, sca = 1.0;
  for (int i = 0; i < 4; i++) {
    float h = 0.01 + 0.03 * float(i);
    occ += (h - map(p + n * h).x) * sca;
    sca *= 0.7;
  }
  return clamp(1.0 - 6.0 * occ, 0.0, 1.0);
}

vec3 lampEmit() { return vec3(1.0, 0.93, 0.82) * 0.95 * uLamp; }

vec3 env(vec3 rd) {
  vec3 c = mix(vec3(0.003, 0.004, 0.0035), vec3(0.009, 0.011, 0.010), clamp(rd.y * 0.6 + 0.5, 0.0, 1.0));
  return c;
}

vec3 shade(vec3 p, vec3 n, vec3 rd, float mat) {
  float att = 0.0, dif = 0.0;
  for (int i = 0; i < 4; i++) {
    vec3 li = vec3(0.0, LAMPY - 0.01, -0.9 + 0.6 * float(i)) - p;
    float di = length(li);
    float ai = 0.55 / (1.0 + di * di * 1.4);
    att += ai; dif += ai * max(dot(n, li / di), 0.0);
  }
  att *= uLamp; dif = att > 0.0 ? dif * uLamp / att : 0.0;
  vec3 lp = vec3(0.0, LAMPY - 0.01, clamp(p.z, -0.9, 0.9));
  vec3 ld = lp - p; float dl = length(ld); ld /= dl;
  float sh = dif > 0.0 ? softShadow(p + n * 0.002, ld, dl - 0.06) : 0.0;
  float ao = calcAO(p, n);
  vec3 lightC = vec3(1.0, 0.94, 0.84);
  vec3 amb = (vec3(0.010, 0.012, 0.011) + vec3(0.006, 0.05, 0.025) * att * max(-n.y, 0.0)) * ao;

  if (mat > 9.5) {
    int bi = int(mat - 10.0 + 0.5);
    vec3 base = vec3(0.0);
    for (int i = 0; i < ${NB}; i++) if (i == bi) base = uBallC[i];
    vec3 h = normalize(ld - rd);
    float spec = pow(max(dot(n, h), 0.0), 160.0) * 2.2 * att * sh;
    vec3 r = reflect(rd, n);
    vec3 refl = env(r);
    if (r.y > 0.0) {
      vec3 q = p + r * ((LAMPY - p.y) / r.y);
      float m = (1.0 - smoothstep(0.26, 0.31, abs(q.x))) * (1.0 - smoothstep(0.93, 1.0, abs(q.z)));
      refl += lampEmit() * m * 0.9;
    } else {
      refl = vec3(0.02, 0.22, 0.10) * att * 0.5;
    }
    float fres = 0.05 + 0.95 * pow(1.0 - max(dot(-rd, n), 0.0), 5.0);
    /* رزینِ فنولیک روشن‌تر از پارچه بازمی‌تاباند؛ نیمه‌ی پایین نورِ سبزِ برگشتی از پارچه می‌گیرد */
    vec3 bounce = vec3(0.01, 0.12, 0.055) * att * max(-n.y, 0.0);
    vec3 c = base * (amb + bounce + dif * att * sh * lightC * 1.7) * ao;
    return c + spec * lightC + refl * fres;
  }
  if (mat > 5.5) return vec3(0.006, 0.007, 0.006) * (0.4 + att);
  if (mat > 4.5) {
    /* زیرِ چراغ: چهار صفحه‌ی نور در قابِ تیره، نه یک تخته‌ی سفید */
    if (n.y < -0.6) {
      float panel = (1.0 - smoothstep(0.2, 0.235, abs(p.x))) * smoothstep(0.035, 0.06, abs(fract((p.z + 1.0) / 0.5) - 0.5) * 0.5);
      return mix(vec3(0.015), lampEmit(), panel);
    }
    return vec3(0.012) + vec3(0.025) * max(n.y, 0.0) + vec3(0.04) * pow(max(dot(reflect(rd, n), vec3(0.0, -1.0, 0.0)), 0.0), 8.0);
  }
  vec3 base;
  float specK = 0.0, shin = 8.0;
  if (mat > 2.5) {
    float grain = fbm(vec2(p.x * 8.0, p.z * 60.0));
    base = vec3(0.17, 0.075, 0.03) * (0.75 + 0.5 * grain);
    specK = 0.5; shin = 70.0;
    /* خال‌های لوزیِ لبه روی چوب */
    if (n.y > 0.9) {
      vec2 a = abs(p.xz);
      float kz = abs(fract(a.y / (L * 0.25) + 0.5) - 0.5) * L * 0.25;
      float kx = abs(fract(a.x / (W * 0.5) + 0.5) - 0.5) * W * 0.5;
      float side = a.x > W + 0.02 ? length(vec2(a.x - (W + 0.065), kz)) : 1.0;
      float end = a.y > L + 0.02 ? length(vec2(kx, a.y - (L + 0.065))) : 1.0;
      if (min(side, end) < 0.008) { base = vec3(0.80, 0.74, 0.62); specK = 0.8; }
    }
  } else {
    float nap = fbm(p.xz * 70.0) * 0.12 + fbm(p.xz * 3.0) * 0.08;
    base = vec3(0.010, 0.155, 0.072) * (0.92 + nap);
    if (mat > 1.5) base *= 0.82;
    if (pocketD(p.xz) < 0.0 && p.y < 0.01) return vec3(0.002);
  }
  vec3 h = normalize(ld - rd);
  float spec = pow(max(dot(n, h), 0.0), shin) * specK * att * sh;
  return base * (amb + dif * att * sh * lightC) * ao + spec * lightC * 0.6;
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - uRes) / uRes.y;
  vec3 ro = uCam;
  vec3 fw = normalize(uTarget - ro);
  vec3 rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(rt, fw);
  vec3 rd = normalize(uv.x * rt + uv.y * up + 1.85 * fw);

  float t = 0.02; vec2 hit = vec2(0.0);
  for (int i = 0; i < 110; i++) {
    hit = map(ro + rd * t);
    if (hit.x < 0.00035 * t) break;
    t += hit.x;
    if (t > 9.0) { hit.y = 0.0; break; }
  }

  vec3 col = env(rd);
  if (hit.y > 0.5) {
    vec3 p = ro + rd * t;
    vec3 n = calcNormal(p);
    col = shade(p, n, rd, hit.y);
    col = mix(col, env(rd), 1.0 - exp(-0.02 * t * t));
  }
  /* هاله‌ی نرمِ زیرِ چراغ در هوا */
  float glow = exp(-6.0 * abs(rd.y - 0.33)) * exp(-3.0 * abs(rd.x)) * 0.05 * uLamp;
  col += vec3(1.0, 0.9, 0.75) * glow;

  col = col * (2.51 * col + 0.03) / (col * (2.43 * col + 0.59) + 0.14);
  col = pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2));
  vec2 q = gl_FragCoord.xy / uRes;
  col *= 0.55 + 0.45 * pow(16.0 * q.x * q.y * (1.0 - q.x) * (1.0 - q.y), 0.22);
  col += (hash(gl_FragCoord.xy) - 0.5) * 0.018;
  gl_FragColor = vec4(col, 1.0);
}
`

const RED: [number, number, number] = [0.46, 0.02, 0.016]

/* جای توپ‌ها: پک رو به دوربین، صورتی جلویش، سیاه پشتش، آبی وسط، سفید نزدیکِ دوربین.
   ترتیب مهم است: ۱۵ قرمزِ اول (اندیسِ ۴ وسطِ پک برای کره‌ی محیطی) */
export function ballLayout(): { pos: number[]; col: number[] } {
  const R = 0.0262
  const pos: number[] = []
  const col: number[] = []
  const apex = -0.958
  for (let row = 0; row < 5; row++) {
    for (let k = 0; k <= row; k++) {
      pos.push((k - row / 2) * 2 * R * 1.01, R, apex - row * R * Math.sqrt(3) * 1.01)
      col.push(...RED)
    }
  }
  const add = (x: number, z: number, c: [number, number, number]) => { pos.push(x, R, z); col.push(...c) }
  add(0, -0.9, [0.78, 0.26, 0.36])     /* صورتی */
  add(0, -1.47, [0.006, 0.006, 0.006]) /* سیاه */
  add(0, 0, [0.02, 0.08, 0.46])        /* آبی */
  add(0.29, 1.063, [0.78, 0.56, 0.03])  /* زرد، روی خطِ بالک */
  add(-0.29, 1.063, [0.03, 0.26, 0.09]) /* سبز */
  add(0, 1.063, [0.21, 0.075, 0.025])   /* قهوه‌ای */
  add(0.13, 1.17, [0.86, 0.83, 0.75])   /* سفید، داخلِ D */
  return { pos, col }
}
