"use client";

import { useEffect, useRef } from "react";

const VERTEX_SHADER = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;
  uniform float u_time;
  uniform vec2 u_resolution;

  #define PI 3.14159265
  #define TAU 6.28318530
  #define MAX_STEPS 100
  #define MAX_DIST 25.0
  #define SURF_DIST 0.0008

  mat2 rot(float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, -s, s, c);
  }

  // Signed distance to a cylinder along Y axis
  float sdCylinder(vec3 p, float r, float h) {
    float d = length(p.xz) - r;
    float dy = abs(p.y) - h;
    return min(max(d, dy), 0.0) + length(max(vec2(d, dy), 0.0));
  }

  // Pie wedge: cuts space to an angular sector
  float sdPieWedge(vec3 p, float r, float h, float startAngle, float sweepAngle, float gap) {
    // Rotate so wedge starts at angle 0
    float ca = cos(-startAngle), sa = sin(-startAngle);
    p.xz = mat2(ca, -sa, sa, ca) * p.xz;

    float angle = atan(p.x, p.z);
    if (angle < 0.0) angle += TAU;

    // Distance to cylinder
    float dCyl = sdCylinder(p, r, h);

    // Angular clipping
    float halfSweep = sweepAngle * 0.5;
    float midAngle = halfSweep;

    float angDist = abs(angle - midAngle);
    if (angle > PI && sweepAngle < PI) {
      angDist = abs(TAU - angle + midAngle);
    }
    angDist = min(angDist, abs(angle - midAngle));
    if (angle > sweepAngle && angle < TAU - 0.01) {
      // Outside the wedge
      float angClip = max(0.0, angDist - halfSweep);
      float rr = length(p.xz);
      float dAng = rr * sin(angClip);
      return max(dCyl, dAng - gap);
    }

    return dCyl;
  }

  // Simpler approach: use angular repetition with hard cut
  float sdSegment3D(vec3 p, float innerR, float outerR, float h, float aStart, float aSweep) {
    float a = atan(p.x, p.z);
    if (a < 0.0) a += TAU;

    float aEnd = aStart + aSweep;

    // Normalize angle check
    float aMid = aStart + aSweep * 0.5;
    float aHalf = aSweep * 0.5;

    // Angular distance from center of segment
    float da = a - aMid;
    if (da > PI) da -= TAU;
    if (da < -PI) da += TAU;

    float angDist = abs(da) - aHalf;

    float rr = length(p.xz);
    float dRing = max(rr - outerR, innerR - rr);
    float dY = abs(p.y) - h;

    // Combine radial, height, and angular
    float dAng = rr * max(sin(max(angDist, 0.0)), 0.0);

    float exterior = length(max(vec3(dRing, dY, dAng), 0.0));
    float interior = min(max(dRing, max(dY, dAng)), 0.0);

    return exterior + interior;
  }

  // Budget segments: angle, sweep, height
  // Housing 42%, Savings 18%, Groceries 16%, Transport 10%, Personal 8%, Utilities 6%
  #define NUM_SEGS 6

  float scene(vec3 p, float t) {
    // Slow rotation
    p.xz *= rot(t * 0.18);
    // Slight tilt
    p.xy *= rot(0.35 + 0.08 * sin(t * 0.3));

    float d = MAX_DIST;

    float gap = 0.04;

    // Segments: startAngle, sweepAngle, height
    float angles[6];
    float sweeps[6];
    float heights[6];

    angles[0] = 0.0;
    sweeps[0] = TAU * 0.42 - gap;
    heights[0] = 0.55 + 0.06 * sin(t * 0.8);

    angles[1] = TAU * 0.42;
    sweeps[1] = TAU * 0.18 - gap;
    heights[1] = 0.42 + 0.05 * sin(t * 0.9 + 1.0);

    angles[2] = TAU * 0.60;
    sweeps[2] = TAU * 0.16 - gap;
    heights[2] = 0.36 + 0.04 * sin(t * 1.1 + 2.0);

    angles[3] = TAU * 0.76;
    sweeps[3] = TAU * 0.10 - gap;
    heights[3] = 0.28 + 0.03 * sin(t * 0.7 + 3.0);

    angles[4] = TAU * 0.86;
    sweeps[4] = TAU * 0.08 - gap;
    heights[4] = 0.22 + 0.03 * sin(t * 1.3 + 4.0);

    angles[5] = TAU * 0.94;
    sweeps[5] = TAU * 0.06 - gap;
    heights[5] = 0.16 + 0.02 * sin(t * 1.0 + 5.0);

    float outerR = 1.5;
    float innerR = 0.55;

    for (int i = 0; i < NUM_SEGS; i++) {
      // Slight vertical float per segment
      float yOff = 0.02 * sin(t * 0.6 + float(i) * 1.2);
      vec3 sp = p - vec3(0.0, yOff, 0.0);

      float seg = sdSegment3D(sp, innerR, outerR, heights[i], angles[i], sweeps[i]);

      // Round the edges slightly
      seg -= 0.02;

      d = min(d, seg);
    }

    // Inner core — small cylinder
    float core = sdCylinder(p, innerR - 0.08, 0.12);
    d = min(d, core);

    return d;
  }

  vec3 getNormal(vec3 p, float t) {
    vec2 e = vec2(0.001, 0.0);
    return normalize(vec3(
      scene(p + e.xyy, t) - scene(p - e.xyy, t),
      scene(p + e.yxy, t) - scene(p - e.yxy, t),
      scene(p + e.yyx, t) - scene(p - e.yyx, t)
    ));
  }

  float raymarch(vec3 ro, vec3 rd, float t) {
    float d = 0.0;
    for (int i = 0; i < MAX_STEPS; i++) {
      float ds = scene(ro + rd * d, t);
      d += ds * 0.8;
      if (ds < SURF_DIST || d > MAX_DIST) break;
    }
    return d;
  }

  float softShadow(vec3 ro, vec3 rd, float t, float k) {
    float res = 1.0;
    float d = 0.05;
    for (int i = 0; i < 32; i++) {
      float h = scene(ro + rd * d, t);
      res = min(res, k * h / d);
      d += clamp(h, 0.02, 0.2);
      if (h < 0.001 || d > 5.0) break;
    }
    return clamp(res, 0.0, 1.0);
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;
    float t = u_time * 0.5;

    // Camera — elevated 3/4 view to show circular pie shape
    vec3 ro = vec3(0.0, 5.8, 6.6);
    vec3 target = vec3(0.0, 0.0, 0.0);
    vec3 fwd = normalize(target - ro);
    vec3 right = normalize(cross(fwd, vec3(0.0, 1.0, 0.0)));
    vec3 up = cross(right, fwd);
    vec3 rd = normalize(fwd * 1.6 + right * uv.x + up * uv.y);

    float d = raymarch(ro, rd, t);

    vec3 col = vec3(0.035, 0.035, 0.04);

    if (d < MAX_DIST) {
      vec3 p = ro + rd * d;
      vec3 n = getNormal(p, t);

      vec3 lightDir = normalize(vec3(2.0, 3.0, 2.0));
      vec3 lightDir2 = normalize(vec3(-1.5, 1.0, -1.0));
      vec3 viewDir = normalize(ro - p);

      float diff = max(dot(n, lightDir), 0.0);
      float diff2 = max(dot(n, lightDir2), 0.0);
      float spec = pow(max(dot(reflect(-lightDir, n), viewDir), 0.0), 40.0);
      float spec2 = pow(max(dot(reflect(-lightDir2, n), viewDir), 0.0), 20.0);
      float fresnel = pow(1.0 - max(dot(n, viewDir), 0.0), 4.0);

      // Shadow
      float shadow = softShadow(p + n * 0.01, lightDir, t, 12.0);

      // Material — dark brushed metal
      vec3 matColor = vec3(0.13, 0.13, 0.15);

      // Top faces are brighter — shows the pie from above
      float topFace = smoothstep(0.3, 1.0, n.y);
      matColor += vec3(0.07, 0.07, 0.08) * topFace;

      col = matColor * (0.15 + diff * 0.7 * shadow + diff2 * 0.18);
      col += vec3(0.5, 0.47, 0.42) * spec * shadow * 0.5;
      col += vec3(0.25, 0.22, 0.20) * spec2 * 0.2;
      col += vec3(0.07, 0.08, 0.12) * fresnel * 0.7;

      // AO
      float ao = 0.5 + 0.5 * clamp(scene(p + n * 0.1, t) / 0.1, 0.0, 1.0);
      col *= ao;
    }

    // Atmospheric glow
    float glow = exp(-d * 0.6) * 0.08;
    col += vec3(0.08, 0.08, 0.09) * glow;

    // Vignette
    float vig = 1.0 - length(uv) * 0.45;
    col *= 0.65 + 0.35 * vig;

    // Grain
    float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + u_time) * 43758.5453);
    col += (grain - 0.5) * 0.01;

    // Tonemap
    col = col / (col + 0.7);

    gl_FragColor = vec4(col, 1.0);
  }
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext, vs: WebGLShader, fs: WebGLShader): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

export function FluidAnimation({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { alpha: false, antialias: false });
    if (!gl) return;

    const vs = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = createProgram(gl, vs, fs);
    if (!program) return;

    const posLoc = gl.getAttribLocation(program, "a_position");
    const timeLoc = gl.getUniformLocation(program, "u_time");
    const resLoc = gl.getUniformLocation(program, "u_resolution");

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    function resize() {
      if (!canvas || !gl) return;
      const rect = canvas.getBoundingClientRect();
      const w = Math.floor(rect.width * dpr);
      const h = Math.floor(rect.height * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const start = performance.now();
    function render() {
      if (!gl || !program || !canvas) return;
      const elapsed = (performance.now() - start) / 1000;
      gl.useProgram(program);
      gl.enableVertexAttribArray(posLoc);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
      gl.uniform1f(timeLoc, elapsed);
      gl.uniform2f(resLoc, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animRef.current = requestAnimationFrame(render);
    }

    animRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animRef.current);
      observer.disconnect();
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}
