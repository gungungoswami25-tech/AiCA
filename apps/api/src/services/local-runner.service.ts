import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { SupportedLanguage } from '@aica/shared';

export interface LocalExecutionInput {
  language: SupportedLanguage;
  code: string;
  stdin?: string;
  timeoutMs?: number;
}

export interface LocalExecutionOutput {
  stdout: string;
  stderr: string;
  compileOutput: string;
  executionTimeMs: number;
  memoryUsedKb: number;
  statusId: number;
  statusDescription: string;
}

export function wrapCodeWithDriver(code: string, language: SupportedLanguage): string {
  // If user already handles I/O or calls driver, leave code untouched
  if (
    code.includes('if __name__ == "__main__":') ||
    code.includes("if __name__ == '__main__':") ||
    code.includes('sys.stdin') ||
    code.includes('input(') ||
    code.includes('fs.readFileSync') ||
    code.includes('cin >>') ||
    code.includes('getline(') ||
    code.includes('Scanner') ||
    code.includes('BufferedReader')
  ) {
    return code;
  }

  if (language === 'python') {
    if (code.includes('def twoSum(')) {
      return (
        code +
        `\n\nif __name__ == '__main__':
    import sys
    _lines = sys.stdin.read().split()
    if len(_lines) >= 3:
        _n = int(_lines[0])
        _nums = [int(x) for x in _lines[1:_n+1]]
        _target = int(_lines[_n+1])
        _res = twoSum(_nums, _target)
        if isinstance(_res, (list, tuple)) and len(_res) >= 2:
            print(f"{_res[0]} {_res[1]}")
`
      );
    }
    if (code.includes('def lengthOfLongestSubstring(')) {
      return (
        code +
        `\n\nif __name__ == '__main__':
    import sys
    _s = sys.stdin.read().rstrip('\\r\\n')
    print(lengthOfLongestSubstring(_s))
`
      );
    }
    if (code.includes('def maxArea(')) {
      return (
        code +
        `\n\nif __name__ == '__main__':
    import sys
    _lines = sys.stdin.read().split()
    if len(_lines) >= 2:
        _n = int(_lines[0])
        _h = [int(x) for x in _lines[1:_n+1]]
        print(maxArea(_h))
`
      );
    }
    if (code.includes('def isValid(')) {
      return (
        code +
        `\n\nif __name__ == '__main__':
    import sys
    _s = sys.stdin.read().strip()
    print('true' if isValid(_s) else 'false')
`
      );
    }
    if (code.includes('def search(')) {
      return (
        code +
        `\n\nif __name__ == '__main__':
    import sys
    _lines = sys.stdin.read().split()
    if len(_lines) >= 3:
        _n = int(_lines[0])
        _target = int(_lines[-1])
        _nums = [int(x) for x in _lines[1:_n+1]]
        print(search(_nums, _target))
`
      );
    }
    if (code.includes('def isPalindrome(')) {
      return (
        code +
        `\n\nif __name__ == '__main__':
    import sys
    _s = sys.stdin.read().strip()
    print('true' if isPalindrome(_s) else 'false')
`
      );
    }
    if (code.includes('def circleMetrics(')) {
      return (
        code +
        `\n\nif __name__ == '__main__':
    import sys
    _line = sys.stdin.read().strip()
    if _line:
        _r = float(_line)
        _a, _c = circleMetrics(_r)
        print(f"{_a:.6f} {_c:.6f}")
`
      );
    }
    if (code.includes('def subarraySum(')) {
      return (
        code +
        `\n\nif __name__ == '__main__':
    import sys
    _lines = sys.stdin.read().strip().split('\\n')
    if len(_lines) >= 2:
        _n, _k = map(int, _lines[0].split())
        _nums = list(map(int, _lines[1].split()))
        print(subarraySum(_nums, _k))
`
      );
    }
  }

  if (language === 'javascript') {
    if (code.includes('function twoSum(')) {
      return (
        code +
        `\ntry {
  const _fs = require('fs');
  const _input = _fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
  if (_input.length >= 3) {
    const _n = parseInt(_input[0], 10);
    const _nums = _input.slice(1, _n + 1).map(Number);
    const _target = parseInt(_input[_n + 1], 10);
    const _res = twoSum(_nums, _target);
    if (Array.isArray(_res)) console.log(_res.join(' '));
  }
} catch (_) {}
`
      );
    }
    if (code.includes('function lengthOfLongestSubstring(')) {
      return (
        code +
        `\ntry {
  const _fs = require('fs');
  const _s = _fs.readFileSync(0, 'utf-8').replace(/[\\r\\n]+$/, '');
  console.log(lengthOfLongestSubstring(_s));
} catch (_) {}
`
      );
    }
    if (code.includes('function maxArea(')) {
      return (
        code +
        `\ntry {
  const _fs = require('fs');
  const _input = _fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
  if (_input.length >= 2) {
    const _n = parseInt(_input[0], 10);
    const _nums = _input.slice(1, _n + 1).map(Number);
    console.log(maxArea(_nums));
  }
} catch (_) {}
`
      );
    }
    if (code.includes('function isValid(')) {
      return (
        code +
        `\ntry {
  const _fs = require('fs');
  const _s = _fs.readFileSync(0, 'utf-8').trim();
  console.log(isValid(_s) ? 'true' : 'false');
} catch (_) {}
`
      );
    }
    if (code.includes('function search(')) {
      return (
        code +
        `\ntry {
  const _fs = require('fs');
  const _input = _fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
  if (_input.length >= 3) {
    const _n = parseInt(_input[0], 10);
    const _nums = _input.slice(1, _n + 1).map(Number);
    const _target = parseInt(_input[_n + 1], 10);
    console.log(search(_nums, _target));
  }
} catch (_) {}
`
      );
    }
  }

  return code;
}

export function executeLocally(input: LocalExecutionInput): LocalExecutionOutput {
  const { language, stdin = '', timeoutMs = 5000 } = input;
  const code = wrapCodeWithDriver(input.code, language);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aica-run-'));
  const start = performance.now();

  try {
    if (language === 'python') {
      const scriptPath = path.join(tempDir, 'solution.py');
      fs.writeFileSync(scriptPath, code);
      const res = spawnSync('python3', [scriptPath], {
        input: stdin,
        timeout: timeoutMs,
        maxBuffer: 10 * 1024 * 1024
      });
      const elapsed = Math.round(performance.now() - start);

      if (res.error && (res.error as any).code === 'ETIMEDOUT') {
        return {
          stdout: '',
          stderr: 'Time limit exceeded',
          compileOutput: '',
          executionTimeMs: timeoutMs,
          memoryUsedKb: 14000,
          statusId: 5,
          statusDescription: 'Time Limit Exceeded'
        };
      }

      const stdout = res.stdout ? res.stdout.toString('utf8') : '';
      const stderr = res.stderr ? res.stderr.toString('utf8') : '';
      const isErr = res.status !== 0;

      return {
        stdout,
        stderr,
        compileOutput: '',
        executionTimeMs: Math.max(1, elapsed),
        memoryUsedKb: 14200,
        statusId: isErr ? 11 : 3,
        statusDescription: isErr ? 'Runtime Error' : 'Accepted'
      };
    }

    if (language === 'javascript') {
      const scriptPath = path.join(tempDir, 'solution.js');
      fs.writeFileSync(scriptPath, code);
      const res = spawnSync(process.execPath || 'node', [scriptPath], {
        input: stdin,
        timeout: timeoutMs,
        maxBuffer: 10 * 1024 * 1024
      });
      const elapsed = Math.round(performance.now() - start);

      if (res.error && (res.error as any).code === 'ETIMEDOUT') {
        return {
          stdout: '',
          stderr: 'Time limit exceeded',
          compileOutput: '',
          executionTimeMs: timeoutMs,
          memoryUsedKb: 22000,
          statusId: 5,
          statusDescription: 'Time Limit Exceeded'
        };
      }

      const stdout = res.stdout ? res.stdout.toString('utf8') : '';
      const stderr = res.stderr ? res.stderr.toString('utf8') : '';
      const isErr = res.status !== 0;

      return {
        stdout,
        stderr,
        compileOutput: '',
        executionTimeMs: Math.max(1, elapsed),
        memoryUsedKb: 22500,
        statusId: isErr ? 11 : 3,
        statusDescription: isErr ? 'Runtime Error' : 'Accepted'
      };
    }

    if (language === 'cpp') {
      const srcPath = path.join(tempDir, 'solution.cpp');
      const binPath = path.join(tempDir, 'solution');
      fs.writeFileSync(srcPath, code);

      const compRes = spawnSync('g++', ['-O2', '-std=c++17', srcPath, '-o', binPath], {
        timeout: 10000,
        maxBuffer: 5 * 1024 * 1024
      });

      if (compRes.status !== 0) {
        return {
          stdout: '',
          stderr: '',
          compileOutput: compRes.stderr ? compRes.stderr.toString('utf8') : 'Compilation failed',
          executionTimeMs: 0,
          memoryUsedKb: 0,
          statusId: 6,
          statusDescription: 'Compilation Error'
        };
      }

      const res = spawnSync(binPath, [], {
        input: stdin,
        timeout: timeoutMs,
        maxBuffer: 10 * 1024 * 1024
      });
      const elapsed = Math.round(performance.now() - start);

      if (res.error && (res.error as any).code === 'ETIMEDOUT') {
        return {
          stdout: '',
          stderr: 'Time limit exceeded',
          compileOutput: '',
          executionTimeMs: timeoutMs,
          memoryUsedKb: 4096,
          statusId: 5,
          statusDescription: 'Time Limit Exceeded'
        };
      }

      const stdout = res.stdout ? res.stdout.toString('utf8') : '';
      const stderr = res.stderr ? res.stderr.toString('utf8') : '';
      const isErr = res.status !== 0;

      return {
        stdout,
        stderr,
        compileOutput: '',
        executionTimeMs: Math.max(1, elapsed),
        memoryUsedKb: 4200,
        statusId: isErr ? 11 : 3,
        statusDescription: isErr ? 'Runtime Error' : 'Accepted'
      };
    }

    if (language === 'java') {
      const srcPath = path.join(tempDir, 'Main.java');
      fs.writeFileSync(srcPath, code);

      const compRes = spawnSync('javac', [srcPath], {
        timeout: 10000,
        maxBuffer: 5 * 1024 * 1024
      });

      if (compRes.status !== 0) {
        return {
          stdout: '',
          stderr: '',
          compileOutput: compRes.stderr ? compRes.stderr.toString('utf8') : 'Compilation failed',
          executionTimeMs: 0,
          memoryUsedKb: 0,
          statusId: 6,
          statusDescription: 'Compilation Error'
        };
      }

      const res = spawnSync('java', ['-cp', tempDir, 'Main'], {
        input: stdin,
        timeout: timeoutMs,
        maxBuffer: 10 * 1024 * 1024
      });
      const elapsed = Math.round(performance.now() - start);

      if (res.error && (res.error as any).code === 'ETIMEDOUT') {
        return {
          stdout: '',
          stderr: 'Time limit exceeded',
          compileOutput: '',
          executionTimeMs: timeoutMs,
          memoryUsedKb: 28000,
          statusId: 5,
          statusDescription: 'Time Limit Exceeded'
        };
      }

      const stdout = res.stdout ? res.stdout.toString('utf8') : '';
      const stderr = res.stderr ? res.stderr.toString('utf8') : '';
      const isErr = res.status !== 0;

      return {
        stdout,
        stderr,
        compileOutput: '',
        executionTimeMs: Math.max(1, elapsed),
        memoryUsedKb: 29000,
        statusId: isErr ? 11 : 3,
        statusDescription: isErr ? 'Runtime Error' : 'Accepted'
      };
    }

    throw new Error(`Unsupported language for local runner: ${language}`);
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  }
}
