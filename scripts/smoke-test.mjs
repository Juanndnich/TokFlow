import { spawn } from 'child_process'
import { existsSync } from 'fs'
import { resolve } from 'path'

const unpackedExePath = resolve(process.cwd(), 'release/win-unpacked/TokFlow.exe')

if (!existsSync(unpackedExePath)) {
  console.error(
    `Smoke test failed: binary not found at ${unpackedExePath}. Run 'npm run dist' first.`
  )
  process.exit(1)
}

console.log(`Starting smoke test for ${unpackedExePath}...`)

const proc = spawn(unpackedExePath, ['--smoke-test'], {
  stdio: 'inherit',
  windowsHide: false
})

const timeout = setTimeout(() => {
  console.error('Smoke test timed out after 30 seconds!')
  proc.kill()
  process.exit(1)
}, 30000)

proc.on('close', (code) => {
  clearTimeout(timeout)
  if (code === 0) {
    console.log('Smoke test passed successfully! Code 0')
    process.exit(0)
  } else {
    console.error(`Smoke test failed with exit code ${code}`)
    process.exit(code || 1)
  }
})
