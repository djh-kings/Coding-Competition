import { NextRequest, NextResponse } from "next/server";
import { getStudentSession } from "@/lib/auth";

interface TestCase {
  input: string;
  expected: string;
}

interface PistonResult {
  run: {
    stdout: string;
    stderr: string;
    code: number;
  };
}

const LANGUAGE_MAP: Record<string, { language: string; version: string }> = {
  python: { language: "python", version: "3.10.0" },
  javascript: { language: "javascript", version: "18.15.0" },
};

async function runCode(code: string, language: string, stdin: string): Promise<PistonResult> {
  const runtime = LANGUAGE_MAP[language] ?? LANGUAGE_MAP.python;
  const res = await fetch("https://emkc.org/api/v2/piston/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: runtime.language,
      version: runtime.version,
      files: [{ content: code }],
      stdin,
    }),
  });
  return res.json();
}

export async function POST(req: NextRequest) {
  const session = await getStudentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { code, language, testCases } = await req.json() as {
    code: string;
    language: string;
    testCases: TestCase[];
  };

  const start = Date.now();
  const result = await runCode(code, language, "");
  const duration = ((Date.now() - start) / 1000).toFixed(2);

  const testResults = await Promise.all(
    (testCases ?? []).map(async (tc: TestCase) => {
      const r = await runCode(code, language, tc.input);
      const actual = r.run.stdout.trim();
      return {
        input: tc.input,
        expected: tc.expected,
        actual,
        pass: actual === tc.expected.trim(),
      };
    })
  );

  return NextResponse.json({
    stdout: result.run.stdout,
    stderr: result.run.stderr,
    exitCode: result.run.code,
    duration,
    testResults,
  });
}
